import { genId } from "@wxn0brp/db-core";
import ActionsBase from "@wxn0brp/db-core/base/actions";
import Data from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import type { Database as BetterSqliteDB } from "better-sqlite3";
import type { DatabaseSync as NodeSqliteDB } from "node:sqlite";
import { find } from "./find";
import { remove } from "./remove";
import { update } from "./update";

export type SupportedDB = BetterSqliteDB | NodeSqliteDB;

export class SQLiteValthera extends ActionsBase {
    _inited = true;
    constructor(public db: SupportedDB) {
        super();
    }

    async add(config: VQuery): Promise<Data> {
        const { data, id_gen = true, collection } = config;

        if (id_gen && !data._id) data._id = genId();

        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => data[k]);
        const sql = `INSERT INTO ${collection} (${keys.join(", ")}) VALUES (${placeholders})`;

        await Promise.resolve(this.db.prepare(sql).run(...values));
        return data;
    }

    find(config: VQuery): Promise<Data[]> {
        return find.bind(this)(config);
    }

    async findOne(config: VQuery): Promise<Data | null> {
        config.dbFindOpts = { max: 1 };
        const result = await this.find(config);
        return result.length ? result[0] : null;
    }

    update(config: VQuery): Promise<boolean> {
        return update.bind(this)(config.collection, false, config.search, config.updater, config.context);
    }

    updateOne(config: VQuery): Promise<boolean> {
        return update.bind(this)(config.collection, true, config.search, config.updater, config.context);
    }

    remove(config: VQuery): Promise<boolean> {
        return remove.bind(this)(config.collection, false, config.search, config.context);
    }

    removeOne(config: VQuery): Promise<boolean> {
        return remove.bind(this)(config.collection, true, config.search, config.context);
    }

    async removeCollection(config: VQuery): Promise<boolean> {
        const { collection } = config;
        const sql = `DROP TABLE IF EXISTS ${collection}`;
        await Promise.resolve(this.db.prepare(sql).run());
        return true;
    }

    async issetCollection(config: VQuery): Promise<boolean> {
        const { collection } = config;
        const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
        const result = await Promise.resolve(this.db.prepare(sql).all(collection));
        return result.length > 0;
    }

    async ensureCollection(config: VQuery): Promise<boolean> {
        const { collection } = config;

        const issetCollection = await this.issetCollection({ collection });
        if (!issetCollection) {
            throw new Error(`Collection "${collection}" not found. Please create it first.`);
        }
        return true;
    }
}