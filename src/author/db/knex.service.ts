import { Injectable } from '@nestjs/common';

import * as Knex from 'knex';
import knexConfig from './knexfile';

@Injectable()
export class KnexService {
  private readonly knex: Knex.Knex;
  constructor() {
    this.knex = Knex(knexConfig.development);
  }

  getKnex(): Knex.Knex {
    return this.knex;
  }
}
