import { forgeTypedValthera, genId, ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { Data } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
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
        const tables = (await this._prepare("SELECT name FROM sqlite_master WHERE type='table'")).all();
        return tables.map((t: any) => t.name);
    }

    async add(config: VQueryT.Add): Promise<Data> {
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

    find(config: VQueryT.Find) {
        return find(this, config);
    }

    async findOne(config: VQueryT.Find) {
        config.dbFindOpts = { limit: 1 };
        const result = await this.find(config);
        return result.length ? result[0] : null;
    }

    update(config: VQueryT.Update) {
        return update(this, config, false);
    }

    async updateOne(config: VQueryT.Update) {
        const res = await update(this, config, true);
        return res[0] || null;
    }

    remove(config: VQueryT.Remove) {
        return remove(this, config, false);
    }

    async removeOne(config: VQueryT.Remove) {
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

export function createSQLiteValthera<T extends Record<string, Data> = {}>(sqlDB: SupportedDB) {
    const dbAction = new SQLiteValthera(sqlDB);
    const db = new ValtheraClass({ dbAction });
    return forgeTypedValthera<T>(db);
}

export const DYNAMIC = {
    sqlite(file: string, opts?: any) {
        if (typeof Bun !== "undefined") return DYNAMIC.bun(file, opts);
        return DYNAMIC.node(file, opts);
    },
    async bun(file: string, opts?: any) {
        const { Database } = await import("bun:sqlite");
        return new SQLiteValthera(new Database(file, opts));
    },
    async node(file: string, opts?: any) {
        const { DatabaseSync } = await import("node:sqlite");
        return new SQLiteValthera(new DatabaseSync(file, opts));
    },
    async better(file: string, opts?: any) {
        const { default: def } = await import("better-sqlite3");
        return new SQLiteValthera(new def(file, opts));
    }
}
