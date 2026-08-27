import { forgeTypedValthera, ValtheraClass } from "@wxn0brp/db-core";
import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { addId } from "@wxn0brp/db-core/helpers/addId";
import { MAX_STMT_CACHE } from "./const.js";
import { find } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
import { computeAffinity, execStmt, qid, toSqlValue } from "./utils.js";
import { version } from "./version.js";
export class SQLiteValthera extends ActionsBase {
    db;
    primaryKey;
    _inited = true;
    _stmtCache = new Map();
    _stmtCacheKeys = [];
    _pendingStmts = new Map();
    _tableColumns = new Map();
    _tableAffinities = new Map();
    version = version;
    constructor(db, primaryKey = {}) {
        super();
        this.db = db;
        this.primaryKey = primaryKey;
    }
    async _getTableInfo(collection) {
        const stmt = await this._prepare(`PRAGMA table_info(${qid(collection)})`);
        const rows = await execStmt(stmt, "all");
        const info = {};
        for (const r of rows)
            info[r.name] = r.type || "";
        return info;
    }
    async _invalidateTableCache(collection) {
        this._tableColumns.delete(collection);
        this._tableAffinities.delete(collection);
    }
    async _getTableColumns(collection) {
        const cached = this._tableColumns.get(collection);
        if (cached)
            return cached;
        const info = await this._getTableInfo(collection);
        const cols = new Set(Object.keys(info));
        this._tableColumns.set(collection, cols);
        return cols;
    }
    async _getColumnAffinities(collection) {
        const cached = this._tableAffinities.get(collection);
        if (cached)
            return cached;
        const info = await this._getTableInfo(collection);
        const affinities = {};
        for (const [name, type] of Object.entries(info))
            affinities[name] = computeAffinity(type);
        this._tableAffinities.set(collection, affinities);
        return affinities;
    }
    async _ensureColumns(collection, keys) {
        const existing = await this._getTableColumns(collection);
        const missing = keys.filter(k => k !== "_id" && !existing.has(k));
        if (missing.length === 0)
            return;
        for (const col of missing) {
            const stmt = await this._prepare(`ALTER TABLE ${qid(collection)} ADD COLUMN ${qid(col)}`);
            await execStmt(stmt, "run");
        }
        await this._invalidateTableCache(collection);
    }
    async close() {
        this._stmtCache.clear();
        this._stmtCacheKeys = [];
        this._pendingStmts.clear();
        this._tableColumns.clear();
        this._tableAffinities.clear();
        const close = this.db.close;
        if (typeof close === "function")
            await Promise.resolve(close.call(this.db));
    }
    async _prepare(sql) {
        const cached = this._stmtCache.get(sql);
        if (cached)
            return cached;
        const pending = this._pendingStmts.get(sql);
        if (pending)
            return pending;
        const promise = this._prepareUncached(sql).finally(() => {
            this._pendingStmts.delete(sql);
        });
        this._pendingStmts.set(sql, promise);
        return promise;
    }
    async _prepareUncached(sql) {
        const db = this.db;
        let stmt;
        if (typeof db.prepare !== "undefined") {
            stmt = await db.prepare(sql);
        }
        else if (typeof db.prepareSync !== "undefined") {
            stmt = await db.prepareSync(sql);
        }
        else if (typeof db.query === "function") {
            const q = await db.query(sql);
            if (q && (q.all || q.get || q.run)) {
                stmt = q;
            }
            else {
                throw new Error("Unsupported database");
            }
        }
        else {
            throw new Error("Unsupported database");
        }
        this._cacheStmt(sql, stmt);
        return stmt;
    }
    _cacheStmt(sql, stmt) {
        if (this._stmtCache.size >= MAX_STMT_CACHE) {
            const oldest = this._stmtCacheKeys.shift();
            if (oldest)
                this._stmtCache.delete(oldest);
        }
        this._stmtCache.set(sql, stmt);
        this._stmtCacheKeys.push(sql);
    }
    async getCollections() {
        const stmt = await this._prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
        const tables = await execStmt(stmt, "all");
        return tables.map((t) => t.name);
    }
    async add(config) {
        const { data, collection } = config;
        await addId(config, this, true);
        const entries = Object.entries(data).filter(([, v]) => v !== undefined);
        if (entries.length === 0)
            throw new Error(`Cannot insert an empty document into "${collection}"`);
        await this._ensureColumns(collection, entries.map(([k]) => k));
        const affinities = await this._getColumnAffinities(collection);
        const keys = entries.map(([k]) => k);
        const placeholders = keys.map(() => "?").join(", ");
        const values = entries.map(([k, v]) => toSqlValue(v, affinities[k]));
        const sql = `INSERT INTO ${qid(collection)} (${keys.map(k => qid(k)).join(", ")}) VALUES (${placeholders})`;
        const stmt = await this._prepare(sql);
        await execStmt(stmt, "run", ...values);
        return data;
    }
    find(config) {
        return find(this, config);
    }
    async findOne(config) {
        config.dbFindOpts = {
            limit: 1,
        };
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
        const sql = `DROP TABLE IF EXISTS ${qid(collection)}`;
        const stmt = await this._prepare(sql);
        await execStmt(stmt, "run");
        await this._invalidateTableCache(collection);
        return true;
    }
    async issetCollection(collection) {
        const stmt = await this._prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?");
        const result = await execStmt(stmt, "all", collection);
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
    const adapter = new SQLiteValthera(sqlDB);
    const db = new ValtheraClass({
        adapter,
    });
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
    },
};
