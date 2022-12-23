import { ColumnType, Generated, Kysely, Migration, Migrator, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { Database as SqliteDatabase } from "https://deno.land/x/sqlite3@0.6.1/mod.ts";
import { SqliteDriver } from "./driver.ts";
import * as path from "https://deno.land/std@0.166.0/path/mod.ts";

const sqlite = new SqliteDatabase("app.db");

interface PostTable {
  id: Generated<number>;
  title: string;
  status: "trash" | "draft" | "published"
  slug: string;
  post_type_id: number;
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, never>
}

interface PostTypeTable {
  id: Generated<number>;
  name: string;
  slug: string;
  path_prefix: string | null
}

interface FieldGroupTable {
  id: Generated<number>;
  name: string;
  created_at: ColumnType<Date, string | undefined, never>
}

interface FieldGroupOnPostTypeTable {
  field_group_id: number;
  post_type_id: number;
}

interface FieldTypeTable {
  id: Generated<number>;
  name: string;
}

export interface FieldTable {
  id: Generated<number>;
  name: string;
  slug: string;
  type_id: number;
  field_group_id: number;
  created_at: ColumnType<Date, string | undefined, never>
}

interface PostFieldTable {
  id: Generated<number>;
  post_id: number;
  field_id: number;
  value: string;
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, never>
}

export type Roles = "admin" | "editor" | "subscriber"
interface UserTable {
  id: Generated<number>;
  name: string;
  email: string;
  password: string;
  role: Roles
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, never>
}

export interface Database {
  post: PostTable,
  post_type: PostTypeTable,
  field_group: FieldGroupTable,
  field_group_on_post_type: FieldGroupOnPostTypeTable,
  field_type: FieldTypeTable,
  field: FieldTable,
  post_field: PostFieldTable,
  user: UserTable
}

const db = new Kysely<Database>({
  dialect: {
    createAdapter() {
      return new SqliteAdapter()
    },
    createDriver() {
      return new SqliteDriver({
        database: sqlite,
      })
    },
    createIntrospector(db: Kysely<unknown>) {
      return new SqliteIntrospector(db)
    },
    createQueryCompiler() {
      return new SqliteQueryCompiler()
    },
  }
})

export async function migrate() {
  const migrator = new Migrator({
    db: db,
    provider: {
      getMigrations: async () => {
        const migrationDirPath = path.join(Deno.cwd(), "./src/db/migrations");
        const migrationFiles = await Deno.readDir(migrationDirPath);
        const migrations: Record<string, Migration> = {};
        for await (const migration of migrationFiles) {
          const { up, down } = await import(path.join(migrationDirPath, `./${migration.name}`));

          migrations[migration.name] = {
            up,
            down,
          }
        }

        return migrations
      }
    }
  });
  const { error, results } = await migrator.migrateToLatest()
  if (results && results.length > 0) {
    console.log(results);
  }

  if (error) {
    const migrationError = error as Error;
    throw migrationError.message
  }
}

export default db;