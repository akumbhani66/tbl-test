import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('authors', (table) => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.jsonb('numeric_data').notNullable().defaultTo('{}'); // Store all numeric fields here
    table.bigInteger('_version_').notNullable();
    table.timestamps(true, true);

    table.index(['_version_']);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('authors');
}
