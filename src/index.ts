import { genId, ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { Data } from "@wxn0brp/db-core/types/data";
import * as Query from "@wxn0brp/db-core/types/query";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { find } from "./find";
import { remove } from "./remove";
import { SupportedDB, VStatement } from "./types";
import { update } from "./update";

export class SQLiteValthera extends ActionsBase {
    _inited = true;

    constructor(public db: SupportedDB) {
        super();
    }

    async _prepare(sql: string): Promise<VStatement> {
        const db = this.db as any;
        if (typeof db.prepare !== "undefined") return await db.prepare(sql);
        if (typeof db.prepareSync !== "undefined") return await db.prepareSync(sql);
        if (typeof db.query === "function") {
            const q = await db.query(sql);
            if (q && (q.all || q.get || q.run)) return q;
        }
        throw new Error("Unsupported database");
    }

    async getCollections(): Promise<string[]> {
        throw new Error("This method is not supported by SQLite");
        return [];
    }

    async add(config: Query.AddQuery): Promise<Data> {
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

    find(config: Query.FindQuery): Promise<Data[]> {
        return find(this, config);
    }

    async findOne(config: Query.FindQuery): Promise<Data | null> {
        config.dbFindOpts = { limit: 1 };
        const result = await this.find(config);
        return result.length ? result[0] : null;
    }

    update(config: Query.UpdateQuery) {
        return update(this, config, false);
    }

    async updateOne(config: Query.UpdateQuery) {
        const res = await update(this, config, true);
        return res[0] || null;
    }

    remove(config: Query.RemoveQuery) {
        return remove(this, config, false);
    }

    async removeOne(config: Query.RemoveQuery) {
        const res = await remove(this, config, true);
        return res[0] || null;
    }

    async removeCollection(collection: string): Promise<boolean> {
        const sql = `DROP TABLE IF EXISTS ${collection}`;
        const stmt = await this._prepare(sql);
        await Promise.resolve(stmt.run());
        return true;
    }

    async issetCollection(collection: string): Promise<boolean> {
        const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
        const stmt = await this._prepare(sql);
        const result = await Promise.resolve(stmt.all(collection));
        return result.length > 0;
    }

    async ensureCollection(collection: string): Promise<boolean> {
        const issetCollection = await this.issetCollection(collection);
        if (!issetCollection) {
            throw new Error(`Collection "${collection}" not found. Please create it first.`);
        }
        return true;
    }
}

export function createSQLiteValthera(sqlDB: SupportedDB) {
    const dbAction = new SQLiteValthera(sqlDB);
    return new ValtheraClass({ dbAction });
}
