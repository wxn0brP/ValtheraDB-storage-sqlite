import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from ".";
import { find } from "./find";

export async function remove(slv: SQLiteValthera, query: VQueryT.Remove, one: boolean) {
    const { collection } = query;

    const toDelete = await find(slv, {
        ...query,
        dbFindOpts: {
            limit: one ? 1 : undefined
        }
    });

    if (!toDelete.length) return [];
    const key = slv.primaryKey[collection] || "_id";

    const stmt = await slv._prepare(`DELETE FROM "${collection}" WHERE "${key}" IN (${toDelete.map(() => "?").join(", ")})`);
    await Promise.resolve(stmt.run(...toDelete.map(d => d[key])));

    return toDelete as DataInternal[];
}
