import { Kysely, sql } from 'kysely'
import { Database } from "../db.server.ts"

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable('post')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('title', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updated_at', 'datetime', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .execute()

  await db.schema
    .createTable('field_group')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .execute()

  await db.schema
    .createTable('field_type')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('field')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('name', 'varchar', (col) => col.notNull())
    .addColumn('slug', 'varchar', (col) => col.notNull())
    .addColumn('type_id', 'integer', (col) => col.notNull().references('field_type.id'))
    .addColumn('field_group_id', 'integer', (col) => col.notNull().references('field_group.id'))
    .addColumn('created_at', 'datetime', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .execute()

  await db.schema
    .createTable('post_field')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('post_id', 'integer', (col) => col.notNull().references('post.id'))
    .addColumn('field_id', 'integer', (col) => col.notNull().references('field.id'))
    .addColumn('value', 'varchar', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .addColumn('updated_at', 'datetime', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .execute();

  for (const item of ["Text", "Number", "Date", "Boolean"]) {
    await db.insertInto("field_type").values({
      name: item
    }).execute();
  }
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('post').execute()
  await db.schema.dropTable('field_group').execute()
  await db.schema.dropTable('field_type').execute()
  await db.schema.dropTable('field').execute()
  await db.schema.dropTable('post_field').execute()
}