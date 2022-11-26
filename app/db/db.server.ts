import { ColumnType, FileMigrationProvider, Generated, Kysely, Migrator, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { Database as SqliteDatabase } from "https://deno.land/x/sqlite3@0.6.1/mod.ts";
import { SqliteDriver } from "./driver.ts";
import * as path from "https://deno.land/std@0.166.0/path/mod.ts";

const sqlite = new SqliteDatabase("app.db");

interface Post {
  id: Generated<number>;
  title: string;
  created_at: ColumnType<Date, string | undefined, never>
}

interface Database {
  post: Post
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
    provider: new FileMigrationProvider({
      // @ts-ignore - node compat just has the wrong type
      fs: {
        readdir: async (dir) => {
          const paths = [];
          for await (const dirEntry of Deno.readDir(dir)) {
            paths.push(dirEntry.name);
          }
          return paths;
        }
      },
      path,
      migrationFolder: path.join(Deno.cwd(), './app/db/migrations'),
    })
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