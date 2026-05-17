import { ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { Data } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SupportedDB, VStatement } from "./types.js";
export declare function toSqlValue(v: any): any;
export declare class SQLiteValthera extends ActionsBase {
    db: SupportedDB;
    primaryKey: Record<string, string>;
    _inited: boolean;
    constructor(db: SupportedDB, primaryKey?: Record<string, string>);
    _prepare(sql: string): Promise<VStatement>;
    getCollections(): Promise<string[]>;
    add(config: VQueryT.Add): Promise<Data>;
    find(config: VQueryT.Find): Promise<Data[]>;
    findOne(config: VQueryT.Find): Promise<Data>;
    update(config: VQueryT.Update): Promise<import("@wxn0brp/db-core/types/data").DataInternal[]>;
    updateOne(config: VQueryT.Update): Promise<import("@wxn0brp/db-core/types/data").DataInternal>;
    remove(config: VQueryT.Remove): Promise<import("@wxn0brp/db-core/types/data").DataInternal[]>;
    removeOne(config: VQueryT.Remove): Promise<import("@wxn0brp/db-core/types/data").DataInternal>;
    removeCollection(collection: string): Promise<boolean>;
    issetCollection(collection: string): Promise<boolean>;
    ensureCollection(collection: string): Promise<boolean>;
}
export declare function createSQLiteValthera<T extends Record<string, Data> = {}>(sqlDB: SupportedDB): ValtheraClass & { [K in keyof T]: import("@wxn0brp/db-core/helpers/collection").Collection<T[K]>; };
export declare const DYNAMIC: {
    sqlite(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
    bun(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
    node(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
    better(file: string, keys?: Record<string, string>, opts?: any): Promise<SQLiteValthera>;
};
