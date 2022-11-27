import {
  DatabaseConnection,
  QueryResult,
} from 'kysely'
import { Driver } from 'kysely'
import { CompiledQuery } from 'kysely'
import { Database as SqliteDatabase } from "https://deno.land/x/sqlite3@0.6.1/mod.ts"

class DenoSqliteError extends Error {
  constructor(message: string, sql: string) {
    super(`${message}\n${sql}`)
  }
}

interface DenoSqliteConfig {
  /**
    * An sqlite Database instance or a function that returns one.
    *
    * If a function is provided, it's called once when the first query is executed.
    *
    * https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
    */
  database: SqliteDatabase
  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `better-sqlite3` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
}

export class SqliteDriver implements Driver {
  readonly #config: DenoSqliteConfig
  readonly #connectionMutex = new ConnectionMutex()

  #db?: SqliteDatabase
  #connection?: DatabaseConnection

  constructor(config: DenoSqliteConfig) {
    this.#config = config
  }

  async init(): Promise<void> {
    this.#db = this.#config.database;

    this.#connection = new SqliteConnection(this.#db)

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.#connection)
    }
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    // SQLite only has one single connection. We use a mutex here to wait
    // until the single connection has been released.
    await this.#connectionMutex.lock()
    return this.#connection!
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('begin'))
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
  }

  async releaseConnection(): Promise<void> {
    this.#connectionMutex.unlock()
  }

  async destroy(): Promise<void> {
    this.#db?.close()
  }
}

class SqliteConnection implements DatabaseConnection {
  readonly #db: SqliteDatabase

  constructor(db: SqliteDatabase) {
    this.#db = db
  }

  executeQuery<O>(compiledQuery: CompiledQuery): Promise<QueryResult<O>> {
    try {
      const { sql, parameters } = compiledQuery
      const stmt = this.#db.prepare(sql)

      if (stmt.readonly) {
        return Promise.resolve({
          rows: stmt.all(parameters as any[]) as O[],
        })
      } else {
        const rows = stmt.all(parameters as any) as O[]

        return Promise.resolve({
          numUpdatedOrDeletedRows: undefined,
          insertId: undefined,
          rows: rows,
        })
      }
    } catch (error) {
      return Promise.reject(new DenoSqliteError(error.message, compiledQuery.sql))
    }
  }

  async *streamQuery<R>(): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("Sqlite driver doesn't support streaming")
  }
}

class ConnectionMutex {
  #promise?: Promise<void>
  #resolve?: () => void

  async lock(): Promise<void> {
    while (this.#promise) {
      await this.#promise
    }

    this.#promise = new Promise((resolve) => {
      this.#resolve = resolve
    })
  }

  unlock(): void {
    const resolve = this.#resolve

    this.#promise = undefined
    this.#resolve = undefined

    resolve?.()
  }
}
