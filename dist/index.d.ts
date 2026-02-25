import { ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { Data } from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { SupportedDB, VStatement } from "./types.js";
export declare class SQLiteValthera extends ActionsBase {
    db: SupportedDB;
    _inited: boolean;
    constructor(db: SupportedDB);
    _prepare(sql: string): Promise<VStatement>;
    getCollections(): Promise<string[]>;
    add(config: VQuery): Promise<Data>;
    find(config: VQuery): Promise<Data[]>;
    findOne(config: VQuery): Promise<Data | null>;
    update(config: VQuery): Promise<any[]>;
    updateOne(config: VQuery): Promise<any>;
    remove(config: VQuery): Promise<Data[]>;
    removeOne(config: VQuery): Promise<Data>;
    removeCollection(config: VQuery): Promise<boolean>;
    issetCollection(config: VQuery): Promise<boolean>;
    ensureCollection(config: VQuery): Promise<boolean>;
}
export declare function createSQLiteValthera(sqlDB: SupportedDB): ValtheraClass;
