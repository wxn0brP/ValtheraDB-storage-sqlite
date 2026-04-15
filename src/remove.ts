import { Data, DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { SQLiteValthera } from ".";

export async function remove(slv: SQLiteValthera, query: VQueryT.Remove, one: boolean) {
    const { collection, search, context } = query;

    let stmt = await slv._prepare(`SELECT * FROM "${collection}"`);
    const allEntries: Data[] = await Promise.resolve(stmt.all());

    const toDelete: Data[] = [];

    for (const entry of allEntries) {
        const match = typeof search === "function"
            ? search(entry, context)
            : hasFieldsAdvanced(entry, search);

        if (match) {
            toDelete.push(entry);
            if (one) break;
        }
    }

    if (!toDelete.length) return [];

    stmt = await slv._prepare(`DELETE FROM "${collection}" WHERE _id = ?`);
    for (const entry of toDelete) {
        await Promise.resolve(stmt.run(entry._id));
    }

    return toDelete as DataInternal[];
}
