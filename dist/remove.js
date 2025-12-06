import hasFieldsAdvanced from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
export async function remove(slv, collection, one, search, context = {}) {
    let stmt = await slv._prepare(`SELECT * FROM "${collection}"`);
    const allEntries = await Promise.resolve(stmt.all());
    const toDelete = [];
    let removed = false;
    for (const entry of allEntries) {
        const match = typeof search === "function"
            ? search(entry, context)
            : hasFieldsAdvanced(entry, search);
        if (match) {
            toDelete.push(entry);
            removed = true;
            if (one)
                break;
        }
    }
    if (!removed)
        return false;
    stmt = await slv._prepare(`DELETE FROM "${collection}" WHERE _id = ?`);
    for (const entry of toDelete) {
        await Promise.resolve(stmt.run(entry._id));
    }
    return true;
}
