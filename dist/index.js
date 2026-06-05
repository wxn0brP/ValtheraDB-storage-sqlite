import { forgeTypedValthera, ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { find } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
export function toSqlValue(v) {
    if (typeof v === "boolean")
        return v ? 1 : 0;
    return v;
}
export class SQLiteValthera extends ActionsBase {
    db;
    primaryKey;
    _inited = true;
    constructor(db, primaryKey = {}) {
        super();
        this.db = db;
        this.primaryKey = primaryKey;
    }
    async close() {
        const close = this.db.close;
        if (typeof close === "function")
            await Promise.resolve(close.call(this.db));
    }
    async _prepare(sql) {
        const db = this.db;
        if (typeof db.prepare !== "undefined")
            return await db.prepare(sql);
        if (typeof db.prepareSync !== "undefined")
            return await db.prepareSync(sql);
        if (typeof db.query === "function") {
            const q = await db.query(sql);
            if (q && (q.all || q.get || q.run))
                return q;
        }
        throw new Error("Unsupported database");
    }
    async getCollections() {
        const tables = (await this._prepare("SELECT name FROM sqlite_master WHERE type='table'")).all();
        return tables.map((t) => t.name);
    }
    async add(config) {
        const { data, collection } = config;
        await addId(config, this, true);
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => toSqlValue(data[k]));
        const sql = `INSERT INTO ${collection} (${keys.join(", ")}) VALUES (${placeholders})`;
        const stmt = await this._prepare(sql);
        await Promise.resolve(stmt.run(...values));
        return data;
    }
    find(config) {
        return find(this, config);
    }
    async findOne(config) {
        config.dbFindOpts = { limit: 1 };
        const result = await this.find(config);
        return result.length ? result[0] : null;
    }
    update(config) {
        return update(this, config, false);
    }
    async updateOne(config) {
        const res = await update(this, config, true);
        return res[0] || null;
    }
    remove(config) {
        return remove(this, config, false);
    }
    async removeOne(config) {
        const res = await remove(this, config, true);
        return res[0] || null;
    }
    async removeCollection(collection) {
        const sql = `DROP TABLE IF EXISTS ${collection}`;
        const stmt = await this._prepare(sql);
        await Promise.resolve(stmt.run());
        return true;
    }
    async issetCollection(collection) {
        const sql = `SELECT name FROM sqlite_master WHERE type='table' AND name=?`;
        const stmt = await this._prepare(sql);
        const result = await Promise.resolve(stmt.all(collection));
        return result.length > 0;
    }
    async ensureCollection(collection) {
        const issetCollection = await this.issetCollection(collection);
        if (!issetCollection) {
            throw new Error(`Collection "${collection}" not found. Please create it first.`);
        }
        return true;
    }
}
export function createSQLiteValthera(sqlDB) {
    const dbAction = new SQLiteValthera(sqlDB);
    const db = new ValtheraClass({ dbAction });
    return forgeTypedValthera(db);
}
export const DYNAMIC = {
    sqlite(file, keys = {}, opts) {
        if (typeof Bun !== "undefined")
            return DYNAMIC.bun(file, keys, opts);
        return DYNAMIC.node(file, keys, opts);
    },
    async bun(file, keys = {}, opts = undefined) {
        const { Database } = await import("bun:sqlite");
        if (typeof opts === "object" && Object.keys(opts).length === 0)
            opts = undefined;
        return new SQLiteValthera(new Database(file, opts), keys);
    },
    async node(file, keys = {}, opts) {
        const { DatabaseSync } = await import("node:sqlite");
        if (!opts)
            opts = {};
        return new SQLiteValthera(new DatabaseSync(file, opts), keys);
    },
    async better(file, keys = {}, opts) {
        const { default: def } = await import("better-sqlite3");
        if (!opts)
            opts = {};
        return new SQLiteValthera(new def(file, opts), keys);
    }
};
