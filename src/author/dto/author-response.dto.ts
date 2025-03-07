export interface Metadata {
  limit: number;
  offset: number;
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export enum ResponseStatusCode {
  SUCCESS = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

export interface ErrorResponse {
  code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  statusCode: ResponseStatusCode;
  metadata: Metadata;
  data: T[];
  error?: ErrorResponse;
  message?: string;
}
