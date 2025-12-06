import Data from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { compareSafe } from "@wxn0brp/db-core/utils/compare";
import hasFieldsAdvanced from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import updateFindObject from "@wxn0brp/db-core/utils/updateFindObject";
import { SQLiteValthera } from ".";

export async function find(slv: SQLiteValthera, config: VQuery): Promise<Data[]> {
    const { collection, search, findOpts, dbFindOpts, context } = config;

    let sqlResult = [];

    if (typeof search === "function" || Object.keys(search).length === 0) {
        const stmt = await slv._prepare(`SELECT * FROM ${collection}`);
        sqlResult = await Promise.resolve(stmt.all());
    } else {
        const baseKeys = Object.keys(search)
            .filter(k => search[k] !== undefined)
            .filter(k => !k.startsWith("$"))
            .filter(k => typeof search[k] !== "object");

        const baseSql = `SELECT * FROM ${collection} WHERE ${baseKeys.map(k => `${k} = ?`).join(" AND ")}`;
        const baseValues = baseKeys.map(k => search[k]);
        const stmt = await slv._prepare(baseSql);
        sqlResult = await Promise.resolve(stmt.all(...baseValues));
    }

    let result = sqlResult.filter(entry =>
        typeof search === "function" ? search(entry, context) : hasFieldsAdvanced(entry, search)
    );

    const { reverse = false, limit = -1, offset = 0, sortBy, sortAsc = true } = dbFindOpts;

    if (reverse) result.reverse();

    if (sortBy) {
        const dir = sortAsc ? 1 : -1;
        result.sort((a, b) => compareSafe(a[sortBy], b[sortBy]) * dir);
        const start = offset;
        const end = limit !== -1 ? offset + limit : undefined;
        result = result.slice(start, end);
    } else {
        if (offset > 0) result.splice(0, offset);
        if (limit > 0) result.splice(limit);
    }

    return result.length ? result.map(res => updateFindObject(res, findOpts)) : [];
}