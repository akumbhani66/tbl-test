import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { Author } from './author.model';
import {
  PaginatedResponse,
  Metadata,
  ErrorResponse,
} from './dto/author-response.dto';
import { KnexService } from './db/knex.service';
import type { AuthorSearchDto } from './dto/author-search.dto';
import { ResponseStatusCode } from './dto/author-response.dto';
import { ErrorCode } from './types/api-response.types';

import * as dotenv from 'dotenv';
dotenv.config();

// Types for API response
interface OpenLibraryAuthorDoc {
  key: string;
  name: string;
  _version_?: string;
  [key: string]: any; // Allow any additional fields
}

interface AuthorApiResponse {
  numFound: number;
  docs: OpenLibraryAuthorDoc[];
}

interface SearchResult {
  authors: Author[];
  totalRecords: number;
}

@Injectable()
export class AuthorService {
  constructor(
    private readonly knexService: KnexService,
    private readonly httpService: HttpService,
  ) {}

  private mapApiResponseToAuthor(doc: OpenLibraryAuthorDoc): Author {
    const numericData: Record<string, number> = {};

   for (const [key, value] of Object.entries(doc)) {
  if (key === '_version_') continue;
  if (typeof value === 'number') numericData[key] = value;
}

    return {
      id: doc.key,
      name: doc.name,
      numeric_data: numericData,
      _version_: doc._version_ ? BigInt(doc._version_) : 1n,
    };
  }

  private buildApiUrl(query: string, limit: number, offset: number): string {
    const baseUrl: string = `https://openlibrary.org/search/authors.json`;

    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      offset: String(offset),
    });
    return `${baseUrl}?${params}`;
  }

  private async fetchAuthorsFromApi(
    query: string,
    limit: number,
    offset: number,
  ): Promise<SearchResult> {
    try {
      const url: string = this.buildApiUrl(query, limit, offset);
      const { data } = await firstValueFrom(
        this.httpService.get<AuthorApiResponse>(url),
      );

      return {
        authors: (data.docs ?? []).map((doc: OpenLibraryAuthorDoc) =>
          this.mapApiResponseToAuthor(doc),
        ),
        totalRecords: data.numFound ?? 0,
      };
    } catch (error) {
      throw {
        code: ErrorCode.API_ERROR,
        message: 'Failed to fetch authors from external API',
        details: { error: error.message },
      };
    }
  }

  private async getExistingAuthorsVersions(
    authorIds: string[],
  ): Promise<Map<string, bigint>> {
    if (!authorIds.length) return new Map();

    try {
      const knex = this.knexService.getKnex();
      const existingAuthors = await knex('authors')
        .select('id', '_version_')
        .whereIn('id', authorIds);

      return new Map(
        existingAuthors.map((author) => [author.id, BigInt(author._version_)]),
      );
    } catch (error) {
      throw {
        code: ErrorCode.DATABASE_ERROR,
        message: `Failed to fetch existing author versions: ${error.message}`,
      };
    }
  }

  private filterAuthorsNeedingUpdate(
    authors: Author[],
    existingVersions: Map<string, bigint>,
  ): Author[] {
    return authors.filter((author) => {
      const existingVersion = existingVersions.get(author.id);
      return existingVersion !== author._version_;
    });
  }

  private async upsertAuthors(authors: Author[]): Promise<void> {
    if (!authors.length) return;

    try {
      const knex = this.knexService.getKnex();
      await knex('authors').insert(authors).onConflict('id').merge();
    } catch (error) {
      throw {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to sync authors with database',
        details: { error: error.message },
      };
    }
  }

  private async processAndUpdateAuthors(authors: Author[]): Promise<void> {
    if (!authors.length) return;

    try {
      const existingVersions = await this.getExistingAuthorsVersions(
        authors.map((author) => author.id),
      );

      const authorsToUpdate = this.filterAuthorsNeedingUpdate(
        authors,
        existingVersions,
      );

      await this.upsertAuthors(authorsToUpdate);
    } catch (error) {
      throw {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Failed to process and update authors',
        details: { error: error.message },
      };
    }
  }

  private buildPaginationMetadata(
    limit: number,
    offset: number,
    totalRecords: number,
  ): Metadata {
    return {
      limit,
      offset,
      totalRecords,
      totalPages: Math.ceil(totalRecords / limit),
      currentPage: Math.ceil(offset / limit) + 1,
      hasNextPage: offset + limit < totalRecords,
      hasPreviousPage: offset > 0,
    };
  }

  private getEmptyQueryResponse(
    limit: number,
    offset: number,
  ): PaginatedResponse<Author> {
    return {
      statusCode: ResponseStatusCode.SUCCESS,
      message: 'No search query provided',
      metadata: this.buildPaginationMetadata(limit, offset, 0),
      data: [],
    };
  }

  async searchAuthors(
    queryParams: AuthorSearchDto,
  ): Promise<PaginatedResponse<Author>> {
    const limit = queryParams.limit ?? 10;
    const offset = queryParams.offset ?? 0;

    try {
      if (!queryParams.query?.trim())
        return this.getEmptyQueryResponse(limit, offset);

      // Step 1: Fetch authors from API
      const result = await this.fetchAuthorsFromApi(
        queryParams.query,
        limit,
        offset,
      );

      // Step 2: Process and update database if needed
      await this.processAndUpdateAuthors(result.authors);

      // Step 3: Return paginated response
      return {
        statusCode: ResponseStatusCode.SUCCESS,
        message: 'Authors fetched successfully',
        metadata: this.buildPaginationMetadata(
          limit,
          offset,
          result.totalRecords,
        ),
        data: result.authors,
      };
    } catch (error) {
      let statusCode = ResponseStatusCode.INTERNAL_SERVER_ERROR;
      if (error.code === ErrorCode.API_ERROR)
        statusCode = ResponseStatusCode.SERVICE_UNAVAILABLE;
      else if (error.code === ErrorCode.VALIDATION_ERROR)
        statusCode = ResponseStatusCode.BAD_REQUEST;
      else if (error.code === ErrorCode.DATABASE_ERROR)
        statusCode = ResponseStatusCode.INTERNAL_SERVER_ERROR;

      const errorResponse: ErrorResponse = {
        code: error.code || ErrorCode.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred'
      };

      return {
        statusCode,
        message: 'Failed to fetch authors',
        metadata: this.buildPaginationMetadata(limit, offset, 0),
        data: [],
        error: errorResponse,
      };
    }
  }
}
