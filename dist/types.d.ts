import type BetterSqlite3 from "better-sqlite3";
import type { Database as BetterSqliteDB } from "better-sqlite3";
import type { Database as BunSqliteDB } from "bun:sqlite";
import type NodeSqlite from "node:sqlite";
import type { DatabaseSync as NodeSqliteDB } from "node:sqlite";
export type SupportedDB = BetterSqliteDB | NodeSqliteDB | BunSqliteDB;
export type VStatement = BetterSqlite3.Statement | NodeSqlite.StatementSync;
export type Affinity = "INTEGER" | "TEXT" | "BLOB" | "REAL" | "NUMERIC" | "NONE";
export type AffinityMap = Record<string, Affinity>;
