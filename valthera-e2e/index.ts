import { Database } from "bun:sqlite";
import { SQLiteValthera } from "../src/index.ts";

const TABLES = [
    `CREATE TABLE users (
        _id TEXT PRIMARY KEY,
        name TEXT,
        age INTEGER
    )`,
    `CREATE TABLE test (
        _id TEXT PRIMARY KEY,
        name TEXT
    )`,
    `CREATE TABLE items (
        _id TEXT PRIMARY KEY,
        name TEXT,
        val INTEGER,
        status TEXT,
        extra INTEGER,
        a,
        b INTEGER,
        c INTEGER,
        count INTEGER,
        temp TEXT,
        tags,
        settings,
        text TEXT
    )`
];

export default async () => {
    const sqlDB = new Database(":memory:");

    for (const table of TABLES)
        sqlDB.prepare(table).run();

    const actions = new SQLiteValthera(sqlDB);
    actions._inited = true;
    return actions;
}
