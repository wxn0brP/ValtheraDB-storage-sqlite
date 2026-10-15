import { ActionsBase } from "@wxn0brp/db-core/base/actions";
import { AdapterError, QueryValidationError } from "@wxn0brp/db-core/errors";
import { add, bulkAdd } from "./add.js";
import { buildWhere } from "./buildWhere.js";
import { MAX_STMT_CACHE } from "./const.js";
import { find } from "./find.js";
import { remove } from "./remove.js";
import { update } from "./update.js";
import { computeAffinity, execStmt, qid } from "./utils.js";
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
    _txActive = false;
    _txWaiters = [];
    version = version;
    capabilities = {
        transactions: true,
        indexes: true,
        persistent: true,
    };
    constructor(db, primaryKey = {}) {
        super();
        this.db = db;
        this.primaryKey = primaryKey;
    }
    async _waitForTx() {
        if (!this._txActive)
            return;
        return await new Promise(resolve => {
            this._txWaiters.push(resolve);
        });
    }
    _releaseTx() {
        this._txActive = false;
        const waiters = this._txWaiters;
        this._txWaiters = [];
        for (const w of waiters)
            w();
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
                throw new AdapterError(new Error("Unsupported database"), {
                    sql,
                    driver: "query",
                });
            }
        }
        else {
            throw new AdapterError(new Error("Unsupported database"), {
                sql,
                driver: "unknown",
            });
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
        if (!config.transaction)
            await this._waitForTx();
        return add(this, config);
    }
    async find(config) {
        if (!config.transaction)
            await this._waitForTx();
        return find(this, config);
    }
    async findOne(config) {
        if (!config.transaction)
            await this._waitForTx();
        config.dbFindOpts = {
            limit: 1,
        };
        const result = await this.find(config);
        return result.length ? result[0] : null;
    }
    async update(config) {
        if (!config.transaction)
            await this._waitForTx();
        return update(this, config, false);
    }
    async updateOne(config) {
        if (!config.transaction)
            await this._waitForTx();
        const res = await update(this, config, true);
        return res[0] || null;
    }
    async remove(config) {
        if (!config.transaction)
            await this._waitForTx();
        return remove(this, config, false);
    }
    async removeOne(config) {
        if (!config.transaction)
            await this._waitForTx();
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
            throw new QueryValidationError(`Collection "${collection}" not found. Please create it first.`, {
                collection,
                op: "ensureCollection",
            });
        }
        return true;
    }
    async beginTransaction(id) {
        await this._waitForTx();
        const stmt = await this._prepare("BEGIN");
        await execStmt(stmt, "run");
        this._txActive = true;
        return {
            id,
        };
    }
    async commitTransaction(handle) {
        const stmt = await this._prepare("COMMIT");
        await execStmt(stmt, "run");
        this._releaseTx();
    }
    async rollbackTransaction(handle) {
        const stmt = await this._prepare("ROLLBACK");
        await execStmt(stmt, "run");
        this._releaseTx();
    }
    async createIndex(config) {
        await this._waitForTx();
        const { collection, index } = config;
        const { fields, opts } = index;
        const indexName = opts?.name || `idx_${collection}_${fields.join("_")}`;
        const uniqueStr = opts?.unique ? "UNIQUE " : "";
        const fieldsStr = fields.map(f => qid(f)).join(", ");
        const sql = `CREATE ${uniqueStr}INDEX IF NOT EXISTS ${qid(indexName)} ON ${qid(collection)} (${fieldsStr})`;
        const stmt = await this._prepare(sql);
        await execStmt(stmt, "run");
    }
    async removeIndex(config) {
        await this._waitForTx();
        const { collection, index } = config;
        const { fields, opts } = index;
        const indexName = opts?.name || `idx_${collection}_${fields.join("_")}`;
        const sql = `DROP INDEX IF EXISTS ${qid(indexName)}`;
        const stmt = await this._prepare(sql);
        await execStmt(stmt, "run");
    }
    async count(config) {
        if (!config.transaction)
            await this._waitForTx();
        const { collection, search } = config;
        const affinities = await this._getColumnAffinities(collection);
        const where = buildWhere(search, affinities);
        if (where.postFilter) {
            return (await this.find(config)).length;
        }
        const sql = where.sql
            ? `SELECT COUNT(*) as count FROM ${qid(collection)} WHERE ${where.sql}`
            : `SELECT COUNT(*) as count FROM ${qid(collection)}`;
        const stmt = await this._prepare(sql);
        const row = await execStmt(stmt, "get", ...where.values);
        return row?.count ?? 0;
    }
    async bulkAdd(config) {
        if (!config.transaction)
            await this._waitForTx();
        return bulkAdd(this, config);
    }
}
