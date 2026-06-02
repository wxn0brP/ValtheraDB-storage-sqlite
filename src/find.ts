import { Data } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { findUtil } from "@wxn0brp/db-core/utils/action";
import { findObj } from "@wxn0brp/db-core/utils/process";
import { SQLiteValthera, toSqlValue } from ".";

export async function find(slv: SQLiteValthera, config: VQueryT.Find): Promise<Data[]> {
    const { collection, search } = config;

    let sqlResult = [];

    const baseKeys = typeof search === "object" && search !== null && !Array.isArray(search)
        ? Object.keys(search)
            .filter(k => search[k] !== undefined)
            .filter(k => !k.startsWith("$"))
            .filter(k => typeof search[k] !== "object")
        : [];

    if (typeof search === "function" || baseKeys.length === 0) {
        const stmt = await slv._prepare(`SELECT * FROM ${collection}`);
        sqlResult = await Promise.resolve(stmt.all());
    } else {
        const baseSql = `SELECT * FROM ${collection} WHERE ${baseKeys.map(k => `${k} = ?`).join(" AND ")}`;
        const baseValues = baseKeys.map(k => toSqlValue(search[k]));
        const stmt = await slv._prepare(baseSql);
        sqlResult = await Promise.resolve(stmt.all(...baseValues));
    }

    const result = sqlResult
        .map(entry => findObj(config, entry))
        .filter(Boolean);

    return findUtil(
        config,
        result,
        []
    )
}
