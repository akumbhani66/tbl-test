FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

# Set default environment variables
ENV NODE_ENV=development \
    APP_PORT=3000 \
    DB_CLIENT=pg \
    DB_HOST=postgres \
    DB_PORT=5432 \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    DB_NAME=tbl-test

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:dev"]
