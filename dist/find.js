import { findUtil } from "@wxn0brp/db-core/utils/action";
import { findObj } from "@wxn0brp/db-core/utils/process";
import { toSqlValue } from "./index.js";
export async function find(slv, config) {
    const { collection, search } = config;
    let sqlResult = [];
    if (typeof search === "function" || Object.keys(search).length === 0) {
        const stmt = await slv._prepare(`SELECT * FROM ${collection}`);
        sqlResult = await Promise.resolve(stmt.all());
    }
    else {
        const baseKeys = Object.keys(search)
            .filter(k => search[k] !== undefined)
            .filter(k => !k.startsWith("$"))
            .filter(k => typeof search[k] !== "object");
        const baseSql = `SELECT * FROM ${collection} WHERE ${baseKeys.map(k => `${k} = ?`).join(" AND ")}`;
        const baseValues = baseKeys.map(k => toSqlValue(search[k]));
        const stmt = await slv._prepare(baseSql);
        sqlResult = await Promise.resolve(stmt.all(...baseValues));
    }
    const result = sqlResult.filter(entry => findObj(entry, search));
    return findUtil(config, result, []);
}
