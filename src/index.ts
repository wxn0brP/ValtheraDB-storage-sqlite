import { genId } from "@wxn0brp/db-core";
import ActionsBase from "@wxn0brp/db-core/base/actions";
import Data from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import type { Database as BetterSqliteDB } from "better-sqlite3";
import type { Database as BunSqliteDB } from "bun:sqlite";
import type { DatabaseSync as NodeSqliteDB } from "node:sqlite";
import { find } from "./find";
import { remove } from "./remove";
import { update } from "./update";

export type SupportedDB = BetterSqliteDB | NodeSqliteDB | BunSqliteDB;

export class SQLiteValthera extends ActionsBase {
    _inited = true;
    constructor(public db: SupportedDB) {
        super();
    }

    async _prepare(sql: string) {
        const db = this.db as any;
        if (typeof db.prepare !== "undefined") return await db.prepare(sql);
        if (typeof db.prepareSync !== "undefined") return await db.prepareSync(sql);
        if (typeof db.query === "function") {
            const q = await db.query(sql);
            if (q && (q.all || q.get || q.run)) return q;
        }
        throw new Error("Unsupported database");
    }

    async add(config: VQuery): Promise<Data> {
        const { data, id_gen = true, collection } = config;

        if (id_gen && !data._id) data._id = genId();

        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => data[k]);
        const sql = `INSERT INTO ${collection} (${keys.join(", ")}) VALUES (${placeholders})`;

        const stmt = await this._prepare(sql);
        await Promise.resolve(stmt.run(...values));
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
        const stmt = await this._prepare(sql);
        await Promise.resolve(stmt.run());
        return true;
    }

    async issetCollection(config: VQuery): Promise<boolean> {
        const { collection } = config;
        const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
        const stmt = await this._prepare(sql);
        const result = await Promise.resolve(stmt.all(collection));
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