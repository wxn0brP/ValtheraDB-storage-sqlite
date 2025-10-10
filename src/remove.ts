import { Search } from "@wxn0brp/db-core/types/arg";
import Data from "@wxn0brp/db-core/types/data";
import { VContext } from "@wxn0brp/db-core/types/types";
import hasFieldsAdvanced from "@wxn0brp/db-core/utils/hasFieldsAdvanced";

export async function remove(collection: string, one: boolean, search: Search, context: VContext = {}): Promise<boolean> {
    let stmt = await this._prepare(`SELECT * FROM "${collection}"`);
    const allEntries: Data[] = await Promise.resolve(stmt.all());

    const toDelete: Data[] = [];
    let removed = false;

    for (const entry of allEntries) {
        const match = typeof search === "function"
            ? search(entry, context)
            : hasFieldsAdvanced(entry, search);

        if (match) {
            toDelete.push(entry);
            removed = true;
            if (one) break;
        }
    }

    if (!removed) return false;

    stmt = await this._prepare(`DELETE FROM "${collection}" WHERE _id = ?`);
    for (const entry of toDelete) {
        await Promise.resolve(stmt.run(entry._id));
    }

    return true;
}
