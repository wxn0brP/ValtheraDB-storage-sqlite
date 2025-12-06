import { Search, Updater } from "@wxn0brp/db-core/types/arg";
import Data from "@wxn0brp/db-core/types/data";
import { VContext } from "@wxn0brp/db-core/types/types";
import hasFieldsAdvanced from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { SQLiteValthera } from ".";

export async function update(
    slv: SQLiteValthera,
    collection: string,
    one: boolean,
    search: Search,
    updater: Updater,
    context: VContext = {}
): Promise<boolean> {
    const stmt = await slv._prepare(`SELECT * FROM "${collection}"`);
    const allEntries: Data[] = await Promise.resolve(stmt.all());

    const matched: Data[] = [];
    for (const entry of allEntries) {
        const match = typeof search === "function"
            ? search(entry, context)
            : hasFieldsAdvanced(entry, search);

        if (match) {
            matched.push(entry);
            if (one) break;
        }
    }

    if (matched.length === 0) return false;

    const updateOne = async (target: Data) => {
        const newData: any = typeof updater === "function"
            ? updater(target, context)
            : { ...target, ...updater };

        if (newData._id !== target._id)
            newData._id = target._id;

        const keys = Object.keys(newData).filter(k => k !== "_id");
        const values = keys.map(k => newData[k]);
        const sql = `UPDATE "${collection}" SET ${keys.map(k => `"${k}" = ?`).join(", ")} WHERE _id = ?`;
        const stmt = await slv._prepare(sql);
        await Promise.resolve(stmt.run(...values, target._id));
    };

    for (const target of matched)
        await updateOne(target);

    return true;
}
