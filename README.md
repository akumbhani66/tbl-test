# Author Service API

## Quick Start

### Using Docker
```bash
# Start all services
docker-compose up --build

# Access the API at http://localhost:3000
# Access the adminer to visualize data at http://localhost:8080 (Add host as postgres if it is runing inside docker container)
```

### Local Development

## Prerequisites

- Node.js (v20 or higher)
- npm (v8 or higher)
- PostgreSQL

## Environment Setup

Create a `development.env` file in the root directory with the reference from example.env

# API Configuration
PORT=3000
API_PREFIX=/api/v1

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker-compose up postgres -d

# Run migrations
npm run migrate:up

# For new migration
npm run migrate:make

# Start development server
npm run start:dev

# To run test cases
npm run test
```

## API Usage

### Search Authors
```http
GET /api/v1/authors/search?query=tolkien&limit=10&offset=0
```

Query Parameters:
- `query` (string): Search term for author name
- `limit` (number, optional): Results per page (default: 10, max: 100)
- `offset` (number, optional): Pagination offset (default: 0)

Response:
```json
  {
    "statusCode": 200,
    "message": "Authors fetched successfully",
    "metadata": {
      "limit": 1,
      "offset": 0,
      "totalRecords": 23,
      "totalPages": 23,
      "currentPage": 1,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "data": [
      {
        "id": "OL10612708A",
        "name": "Ashvin Ahuja",
        "numeric_data": {
          "work_count": 28
        },
        "_version_": "1795942535191855104"
      }
    ]
  }
```

## Error Handling

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": {
    "code": "ERROR_CODE",
    "message": "Detailed error message",
  }
}
```

Error Codes:
- `VALIDATION_ERROR`: Invalid input data
- `API_ERROR`: External API error
- `DATABASE_ERROR`: Database operation failed
- `NOT_FOUND`: Resource not found
- `UNKNOWN_ERROR`: Unexpected error

HTTP Status Codes:
- 200: Success
- 400: Bad Request (validation errors)
- 404: Not Found
- 500: Internal Server Error
- 503: Service Unavailable (external API issues)

## Configuration

### Database Migrations
```bash
# Create migration
npm run migrate:make

# Run migrations
npm run migrate:up

# Rollback migration
npm run migrate:down
```

### Considerations
- Since the response of the external api isn't consistent, I stored the numeric values as json in the database to support uncertain future changes in the external api.
- This db decision will not be ideal if we need to query the numeric values frequently. If we need to query the numeric values frequently, we can store them in the database as columns. But that will require constant monitoring of the external api and may require constant updates to the database schema.













