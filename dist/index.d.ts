import { ValtheraClass } from "@wxn0brp/db-core";
import { Data } from "@wxn0brp/db-core/types/data";
import { SQLiteValthera } from "./actions.js";
import { SupportedDB } from "./types.js";
export * from "./actions.js";
export declare function createSQLiteValthera<T extends Record<string, Data> = {}>(sqlDB: SupportedDB): ValtheraClass & { [K in keyof T]: import("@wxn0brp/db-core/helpers/collection").Collection<T[K]>; };
export declare const DYNAMIC: {
    def(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
    sqlite(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
    bun(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
    node(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
    better(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
};
