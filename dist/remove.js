import { BATCH_SIZE } from "./const.js";
import { find } from "./find.js";
import { execStmt, qid } from "./utils.js";
export async function remove(slv, query, one) {
    const { collection } = query;
    const toDelete = await find(slv, {
        ...query,
        dbFindOpts: {
            limit: one ? 1 : undefined,
        },
    });
    if (!toDelete.length)
        return [];
    const key = slv.primaryKey[collection] || "_id";
    for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
        const batch = toDelete.slice(i, i + BATCH_SIZE);
        const stmt = await slv._prepare(`DELETE FROM ${qid(collection)} WHERE ${qid(key)} IN (${batch.map(() => "?").join(", ")})`);
        await execStmt(stmt, "run", ...batch.map(d => d[key]));
    }
    return toDelete;
}
