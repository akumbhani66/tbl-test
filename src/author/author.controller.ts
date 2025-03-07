import { Get, Query, UseInterceptors, Controller } from '@nestjs/common';
import { AuthorService } from './author.service';
import { AuthorSearchDto } from './dto/author-search.dto';
import type { PaginatedResponse } from './dto/author-response.dto';
import type { Author } from './author.model';
import { BigIntSerializerInterceptor } from '../common/interceptors/bigint-serializer.interceptor';
import { CacheTTL } from '@nestjs/cache-manager';



/**
 * Author Search API
 *
 * @description
 * Provides a search api for authors
 *
 * @example
 * GET /api/v1/authors/search?query=tolkien&limit=10&offset=0
 *
 * @param {string} query - Search query
 * @param {number} limit - Number of results per page (optional, default 10)
 * @param {number} offset - Offset for pagination (optional, default 0)
 *
 * @returns {PaginatedResponse<Author>}
 */

@Controller('api/v1/authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Get('search')
  @UseInterceptors(BigIntSerializerInterceptor)
  @CacheTTL(60)
  async search(
    @Query() query: AuthorSearchDto,
  ): Promise<PaginatedResponse<Author>> {
    return this.authorService.searchAuthors(query);
  }
}
