import { ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { Data } from "@wxn0brp/db-core/types/data";
import * as Query from "@wxn0brp/db-core/types/query";
import { SupportedDB, VStatement } from "./types.js";
export declare class SQLiteValthera extends ActionsBase {
    db: SupportedDB;
    _inited: boolean;
    constructor(db: SupportedDB);
    _prepare(sql: string): Promise<VStatement>;
    getCollections(): Promise<string[]>;
    add(config: Query.AddQuery): Promise<Data>;
    find(config: Query.FindQuery): Promise<Data[]>;
    findOne(config: Query.FindQuery): Promise<Data | null>;
    update(config: Query.UpdateQuery): Promise<import("@wxn0brp/db-core/types/data").DataInternal[]>;
    updateOne(config: Query.UpdateQuery): Promise<import("@wxn0brp/db-core/types/data").DataInternal>;
    remove(config: Query.RemoveQuery): Promise<import("@wxn0brp/db-core/types/data").DataInternal[]>;
    removeOne(config: Query.RemoveQuery): Promise<import("@wxn0brp/db-core/types/data").DataInternal>;
    removeCollection(collection: string): Promise<boolean>;
    issetCollection(collection: string): Promise<boolean>;
    ensureCollection(collection: string): Promise<boolean>;
}
export declare function createSQLiteValthera<T extends Record<string, Data> = {}>(sqlDB: SupportedDB): ValtheraClass & { [K in keyof T]: import("@wxn0brp/db-core/helpers/collection").Collection<T[K]>; };
export declare const DYNAMIC: {
    sqlite(file: string, opts?: any): Promise<SQLiteValthera>;
    bun(file: string, opts?: any): Promise<SQLiteValthera>;
    node(file: string, opts?: any): Promise<SQLiteValthera>;
    better(file: string, opts?: any): Promise<SQLiteValthera>;
};
