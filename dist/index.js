import { forgeTypedValthera, ValtheraClass } from "@wxn0brp/db-core";
import { SQLiteValthera } from "./actions.js";
export * from "./actions.js";
export function createSQLiteValthera(sqlDB) {
    const adapter = new SQLiteValthera(sqlDB);
    const db = new ValtheraClass({
        adapter,
    });
    return forgeTypedValthera(db);
}
export const DYNAMIC = {
    def(file, keys = {}, opts) {
        if (typeof Bun !== "undefined")
            return DYNAMIC.bun(file, keys, opts);
        return DYNAMIC.node(file, keys, opts);
    },
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
