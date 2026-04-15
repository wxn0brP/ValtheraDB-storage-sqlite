import { forgeTypedValthera, genId, ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { find } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
export class SQLiteValthera extends ActionsBase {
    db;
    _inited = true;
    constructor(db) {
        super();
        this.db = db;
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
        const { data, id_gen = true, collection } = config;
        if (id_gen && !data._id)
            data._id = genId();
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(", ");
        const values = keys.map(k => data[k]);
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
    sqlite(file, opts) {
        if (typeof Bun !== "undefined")
            return DYNAMIC.bun(file, opts);
        return DYNAMIC.node(file, opts);
    },
    async bun(file, opts) {
        const { Database } = await import("bun:sqlite");
        return new SQLiteValthera(new Database(file, opts));
    },
    async node(file, opts) {
        const { DatabaseSync } = await import("node:sqlite");
        return new SQLiteValthera(new DatabaseSync(file, opts));
    },
    async better(file, opts) {
        const { default: def } = await import("better-sqlite3");
        return new SQLiteValthera(new def(file, opts));
    }
};
