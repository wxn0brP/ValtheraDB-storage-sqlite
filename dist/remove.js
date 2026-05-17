import { find } from "./find.js";
export async function remove(slv, query, one) {
    const { collection } = query;
    const toDelete = await find(slv, {
        ...query,
        dbFindOpts: {
            limit: one ? 1 : undefined
        }
    });
    if (!toDelete.length)
        return [];
    const key = slv.primaryKey[collection] || "_id";
    const stmt = await slv._prepare(`DELETE FROM "${collection}" WHERE "${key}" IN (${toDelete.map(() => "?").join(", ")})`);
    await Promise.resolve(stmt.run(...toDelete.map(d => d[key])));
    return toDelete;
}
