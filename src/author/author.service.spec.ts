import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AuthorService } from './author.service';
import { KnexService } from './db/knex.service';
import { ResponseStatusCode } from './dto/author-response.dto';
import { ErrorCode } from './types/api-response.types';

describe('AuthorService', () => {
  let service: AuthorService;

  const mockKnexService = {
    raw: jest.fn(),
    transaction: jest.fn((callback) => callback()),
    queryBuilder: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    onConflict: jest.fn().mockReturnThis(),
    merge: jest.fn().mockReturnThis(),
  };

  const mockHttpService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorService,
        { provide: KnexService, useValue: mockKnexService },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<AuthorService>(AuthorService);
    httpService = module.get<HttpService>(HttpService);
    knexService = module.get<KnexService>(KnexService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapApiResponseToAuthor', () => {
    it('should correctly map API response to Author object', () => {
      const mockDoc = {
        key: 'OL123456A',
        name: 'Test Author',
        _version_: '1234567890',
        work_count: 42,
        top_work: 'Test Work',
      };

      const result = service['mapApiResponseToAuthor'](mockDoc);

      expect(result).toEqual({
        id: 'OL123456A',
        name: 'Test Author',
        numeric_data: { work_count: 42 },
        _version_: BigInt('1234567890'),
      });
    });

    it('should handle missing _version_ by using default value', () => {
      const mockDoc = {
        key: 'OL123456A',
        name: 'Test Author',
        work_count: 42,
      };

      const result = service['mapApiResponseToAuthor'](mockDoc);

      expect(result._version_).toEqual(1n);
    });
  });

  describe('fetchAuthorsFromApi', () => {
    it('should fetch authors from external API', async () => {
      const mockApiResponse = {
        numFound: 2,
        docs: [
          {
            key: 'OL123456A',
            name: 'Author 1',
            _version_: '1234567890',
            work_count: 42,
          },
          {
            key: 'OL789012A',
            name: 'Author 2',
            _version_: '9876543210',
            work_count: 24,
          },
        ],
      };

      mockHttpService.get.mockReturnValueOnce(
        of({ data: mockApiResponse, status: 200 }),
      );

      const result = await service['fetchAuthorsFromApi']('test', 10, 0);

      expect(mockHttpService.get).toHaveBeenCalledWith(
        expect.stringContaining('https://openlibrary.org/search/authors.json'),
      );
      expect(result.totalRecords).toBe(2);
      expect(result.authors.length).toBe(2);
      expect(result.authors[0].id).toBe('OL123456A');
      expect(result.authors[1].id).toBe('OL789012A');
    });

    it('should handle API errors', async () => {
      mockHttpService.get.mockImplementationOnce(() => {
        throw new Error('API Error');
      });

      await expect(
        service['fetchAuthorsFromApi']('test', 10, 0),
      ).rejects.toEqual({
        code: ErrorCode.API_ERROR,
        message: 'Failed to fetch authors from external API',
        details: { error: 'API Error' },
      });
    });
  });

  describe('searchAuthors', () => {
    it('should return empty response for empty query', async () => {
      const result = await service.searchAuthors({
        query: '',
        offset: 1,
        limit: 10,
      });

      expect(result.metadata.totalRecords).toBe(0);
      expect(result.data).toEqual([]);
    });

    it('should fetch, process and return authors', async () => {
      const mockApiResponse = {
        numFound: 1,
        docs: [
          {
            key: 'OL123456A',
            name: 'Test Author',
            _version_: 1234567890,
            work_count: 42,
          },
        ],
      };

      mockHttpService.get.mockReturnValueOnce(
        of({ data: mockApiResponse, status: 200 }),
      );

      mockKnexService.raw.mockResolvedValueOnce({ rows: [] });

      const result = await service.searchAuthors({
        query: 'test',
        offset: 1,
        limit: 10,
      });

      expect(result.metadata.totalRecords).toBe(0);
      expect(result.data.length).toBe(0);
    });

    it('should handle errors and return appropriate error response', async () => {
      mockHttpService.get.mockImplementationOnce(() => {
        throw new Error('API Error');
      });

      const result = await service.searchAuthors({
        query: 'test',
        offset: 1,
        limit: 10,
      });

      expect(result.statusCode).toBe(ResponseStatusCode.SERVICE_UNAVAILABLE);
      expect(result.error).toBeDefined();
    });
  });
});
