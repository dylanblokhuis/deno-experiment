import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('post')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('title', 'varchar', (col) => col.notNull())
    // .addColumn('last_name', 'varchar')
    // .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .addColumn('created_at', 'datetime', (col) => col.notNull().defaultTo(sql`current_timestamp`))
    .execute()

  // await db.schema
  //   .createTable('pet')
  //   .addColumn('id', 'serial', (col) => col.primaryKey())
  //   .addColumn('name', 'varchar', (col) => col.notNull().unique())
  //   .addColumn('owner_id', 'integer', (col) =>
  //     col.references('person.id').onDelete('cascade').notNull()
  //   )
  //   .addColumn('species', 'varchar', (col) => col.notNull())
  //   .execute()

  // await db.schema
  //   .createIndex('pet_owner_id_index')
  //   .on('pet')
  //   .column('owner_id')
  //   .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('post').execute()
  // await db.schema.dropTable('person').execute()
}