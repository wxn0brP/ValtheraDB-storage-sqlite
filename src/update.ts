import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { updateObjectAdvanced } from "@wxn0brp/db-core/utils/updateObject";
import { SQLiteValthera } from ".";
import { find } from "./find";

export async function update(
    slv: SQLiteValthera,
    query: VQueryT.Update,
    one: boolean,
) {
    const { collection, updater, context } = query;

    const matched = await find(slv, {
        ...query,
        dbFindOpts: {
            limit: one ? 1 : undefined
        }
    });

    if (matched.length === 0) return [];

    const key = slv.primaryKey[collection] || "_id";

    const updateOne = async (target: any) => {
        const newData: any = typeof updater === "function"
            ? updater(target, context)
            : updateObjectAdvanced(target, updater);

        if (newData[key] !== target[key])
            newData[key] = target[key];

        const keys = Object.keys(newData).filter(k => k !== key);
        const values = keys.map(k => newData[k]);

        const sql = `UPDATE "${collection}" SET ${keys.map(k => `"${k}" = ?`).join(", ")} WHERE "${key}" = ?`;
        const stmt = await slv._prepare(sql);

        await Promise.resolve(stmt.run(...values, target[key]));
        return newData;
    };

    const results = [];

    for (const target of matched)
        results.push(await updateOne(target));

    return results as DataInternal[];
}
