import { ValtheraClass } from "@wxn0brp/db-core";
import ActionsBase from "@wxn0brp/db-core/base/actions";
import Data from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { Statement } from "bun:sqlite";
import { SupportedDB } from "./types.js";
export declare class SQLiteValthera extends ActionsBase {
    db: SupportedDB;
    _inited: boolean;
    constructor(db: SupportedDB);
    _prepare(sql: string): Promise<Statement>;
    add(config: VQuery): Promise<Data>;
    find(config: VQuery): Promise<Data[]>;
    findOne(config: VQuery): Promise<Data | null>;
    update(config: VQuery): Promise<boolean>;
    updateOne(config: VQuery): Promise<boolean>;
    remove(config: VQuery): Promise<boolean>;
    removeOne(config: VQuery): Promise<boolean>;
    removeCollection(config: VQuery): Promise<boolean>;
    issetCollection(config: VQuery): Promise<boolean>;
    ensureCollection(config: VQuery): Promise<boolean>;
}
export declare function createSQLiteValthera(sqlDB: SupportedDB): ValtheraClass;
