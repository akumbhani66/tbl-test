import { Test, TestingModule } from '@nestjs/testing';
import { AuthorController } from './author.controller';
import { AuthorService } from './author.service';
import { ResponseStatusCode } from './dto/author-response.dto';

describe('AuthorController', () => {
  let controller: AuthorController;
  let service: AuthorService;

  const mockAuthorService = {
    searchAuthors: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthorController],
      providers: [
        {
          provide: AuthorService,
          useValue: mockAuthorService,
        },
      ],
    }).compile();

    controller = module.get<AuthorController>(AuthorController);
    service = module.get<AuthorService>(AuthorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('search', () => {
    it('should call authorService.searchAuthors with correct parameters', async () => {
      const mockQuery = { query: 'test', page: 2, limit: 20 };
      const mockResponse = {
        statusCode: ResponseStatusCode.SUCCESS,
        message: 'Authors fetched successfully',
        meta: {
          limit: 20,
          offset: 20,
          totalRecords: 100,
          totalPages: 5,
          currentPage: 2,
          hasNextPage: true,
          hasPreviousPage: true,
        },
        data: [
          {
            id: 'OL123456A',
            name: 'Test Author',
            numeric_data: { work_count: 42 },
            _version_: BigInt('1234567890'),
          },
        ],
      };

      mockAuthorService.searchAuthors.mockResolvedValueOnce(mockResponse);

      const result = await controller.search(mockQuery);

      expect(service.searchAuthors).toHaveBeenCalledWith(mockQuery);
      expect(result).toEqual(mockResponse);
    });

    it('should handle default pagination parameters', async () => {
      const mockQuery = { query: 'test' };
      mockAuthorService.searchAuthors.mockResolvedValueOnce({});

      await controller.search(mockQuery);

      expect(service.searchAuthors).toHaveBeenCalledWith(mockQuery);
    });

    it('should pass through error responses from the service', async () => {
      const mockQuery = { query: 'test' };
      const errorResponse = {
        statusCode: ResponseStatusCode.INTERNAL_SERVER_ERROR,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred',
        },
      };

      mockAuthorService.searchAuthors.mockResolvedValueOnce(errorResponse);

      const result = await controller.search(mockQuery);

      expect(result).toEqual(errorResponse);
    });
  });
});