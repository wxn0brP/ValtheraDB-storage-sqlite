import { find } from "./find.js";
const BATCH_SIZE = +process.env.VALTHERA_SQLITE_BATCH_SIZE || 500;
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
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);
        const stmt = await slv._prepare(`DELETE FROM "${collection}" WHERE "${key}" IN (${batch.map(() => "?").join(", ")})`);
        await Promise.resolve(stmt.run(...batch.map(d => d[key])));
    }
    return toDelete;
}
