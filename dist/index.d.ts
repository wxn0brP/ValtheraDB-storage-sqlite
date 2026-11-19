import { ValtheraClass } from "@wxn0brp/db-core";
import { Data } from "@wxn0brp/db-core/types/data";
import { SQLiteAdapter } from "./adapter.js";
import { SupportedDB } from "./types.js";
export * from "./adapter.js";
export * from "./actions.js";
export declare function createSQLiteValthera<T extends Record<string, Data> = {}>(sqlDB: SupportedDB): import("@wxn0brp/db-core/types/typed").TypedValthera<T, ValtheraClass>;
export declare const DYNAMIC: {
    def(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteAdapter>;
    bun(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteAdapter>;
    node(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteAdapter>;
    better(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteAdapter>;
};
