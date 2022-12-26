import { Kysely, sql } from "kysely";
import { Database } from "../db.server.ts";
import config from "../../config.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

export async function up(db: Kysely<Database>): Promise<void> {
  await db.schema
    .createTable("post_type")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("slug", "varchar", (col) => col.notNull())
    .addColumn("path_prefix", "varchar")
    .addColumn(
      "created_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .addColumn(
      "updated_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .execute();

  await db.schema
    .createTable("post")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("title", "varchar", (col) => col.notNull())
    .addColumn("status", "varchar", (col) => col.notNull())
    .addColumn("slug", "varchar", (col) => col.notNull())
    .addColumn(
      "post_type_id",
      "integer",
      (col) => col.notNull().references("post_type.id"),
    )
    .addColumn(
      "created_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .addColumn(
      "updated_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .execute();

  await db.schema
    .createTable("field_group")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn(
      "created_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .execute();

  await db.schema
    .createTable("field_group_on_post_type")
    .addColumn(
      "field_group_id",
      "integer",
      (col) => col.notNull().references("field_group.id"),
    )
    .addColumn(
      "post_type_id",
      "integer",
      (col) => col.notNull().references("post_type.id"),
    )
    .execute();

  await db.schema
    .createTable("field_type")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar", (col) => col.notNull())
    .execute();

  await db.schema
    .createTable("field")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("slug", "varchar", (col) => col.notNull())
    .addColumn(
      "type_id",
      "integer",
      (col) => col.notNull().references("field_type.id"),
    )
    .addColumn(
      "field_group_id",
      "integer",
      (col) => col.notNull().references("field_group.id"),
    )
    .addColumn(
      "created_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .execute();

  await db.schema
    .createTable("post_field")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn(
      "post_id",
      "integer",
      (col) => col.notNull().references("post.id"),
    )
    .addColumn(
      "field_id",
      "integer",
      (col) => col.notNull().references("field.id"),
    )
    .addColumn("value", "varchar", (col) => col.notNull())
    .addColumn(
      "created_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .addColumn(
      "updated_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .execute();

  await db.schema
    .createTable("user")
    .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
    .addColumn("name", "varchar", (col) => col.notNull())
    .addColumn("email", "varchar", (col) => col.notNull())
    .addColumn("password", "varchar", (col) => col.notNull())
    .addColumn("role", "varchar", (col) => col.notNull())
    .addColumn(
      "created_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .addColumn(
      "updated_at",
      "datetime",
      (col) => col.notNull().defaultTo(sql`current_timestamp`),
    )
    .execute();

  for (const item of ["Text", "WYSIWYG", "Number", "Date", "Boolean"]) {
    await db.insertInto("field_type").values({
      name: item,
    }).execute();
  }

  for (const item of ["Post", "Page"]) {
    await db.insertInto("post_type").values({
      name: item,
      slug: item.toLowerCase(),
      path_prefix: item === "Post" ? "/posts" : null,
    }).execute();
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(config.admin.password, salt);

  await db.insertInto("user")
    .values({
      name: "admin",
      email: config.admin.email,
      password: hash,
      role: "admin",
    })
    .returning("id")
    .executeTakeFirst();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable("post_type").execute();
  await db.schema.dropTable("post").execute();
  await db.schema.dropTable("field_group").execute();
  await db.schema.dropTable("field_type").execute();
  await db.schema.dropTable("field").execute();
  await db.schema.dropTable("post_field").execute();
  await db.schema.dropTable("user").execute();
}
