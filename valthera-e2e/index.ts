import { Database } from "bun:sqlite";
import { SQLiteValthera } from "../src/index.ts";
import { TABLES } from "./tables";

export default async () => {
    const sqlDB = new Database(":memory:");

    for (const table of TABLES)
        sqlDB.prepare(table).run();

    const actions = new SQLiteValthera(sqlDB);
    actions._inited = true;
    return actions;
}
