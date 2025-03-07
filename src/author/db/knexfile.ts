import type { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config({ path: `../../../${process.env.NODE_ENV}.env` });

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tbl-test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
  },
  production: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost1',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'tbl-test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
  },
};

export default config;
