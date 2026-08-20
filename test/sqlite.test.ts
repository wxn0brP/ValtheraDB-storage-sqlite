import { ValtheraClass } from "@wxn0brp/db-core";
import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { SQLiteValthera } from "../src";

function setup(tableSql: string, primaryKey: Record<string, string> = {}) {
    const sqlDB = new Database(":memory:");
    const sqlActions = new SQLiteValthera(sqlDB, primaryKey);
    const db = new ValtheraClass({ adapter: sqlActions });

    sqlDB.prepare(tableSql).run();

    return { sqlDB, db };
}

describe("SQLiteValthera", () => {
    test("1. adds and finds rows with default _id key", async () => {
        const { db } = setup("CREATE TABLE users (_id TEXT PRIMARY KEY, user TEXT, age INT)");
        const users = db.c("users");

        const added = await users.add({ user: "Piotr", age: 37 });
        const found = await users.find({ user: "Piotr" });

        expect(typeof added._id).toBe("string");
        expect(found).toHaveLength(1);
        expect(found[0]).toMatchObject({
            _id: added._id,
            user: "Piotr",
            age: 37
        });
    });

    test("2. updates matching rows", async () => {
        const { db } = setup("CREATE TABLE users (_id TEXT PRIMARY KEY, user TEXT, age INT)");
        const users = db.c("users");

        await users.add({ user: "Michał", age: 7 });
        const updated = await users.update({ user: "Michał" }, { age: 18 });
        const found = await users.find({ user: "Michał" });

        expect(updated).toHaveLength(1);
        expect(updated[0]).toMatchObject({ user: "Michał", age: 18 });
        expect(found[0]).toMatchObject({ user: "Michał", age: 18 });
    });

    test("3. respects custom primary key during update", async () => {
        const { sqlDB, db } = setup(
            "CREATE TABLE users (user_id TEXT PRIMARY KEY, user TEXT, age INT)",
            { users: "user_id" }
        );
        const users = db.c("users");

        sqlDB.prepare("INSERT INTO users (user_id, user, age) VALUES (?, ?, ?)").run("u1", "Piotr", 37);
        const updated = await users.update({ user: "Piotr" }, { user_id: "u2", age: 38 });
        const found = await users.find({ user_id: "u1" });

        expect(updated).toHaveLength(1);
        expect(updated[0]).toMatchObject({ user_id: "u1", user: "Piotr", age: 38 });
        expect(found).toHaveLength(1);
        expect(found[0]).toMatchObject({ user_id: "u1", user: "Piotr", age: 38 });
    });

    test("4. removes rows using custom primary key", async () => {
        const { sqlDB, db } = setup(
            "CREATE TABLE users (user_id TEXT PRIMARY KEY, user TEXT, age INT)",
            { users: "user_id" }
        );
        const users = db.c("users");

        sqlDB.prepare("INSERT INTO users (user_id, user, age) VALUES (?, ?, ?)").run("u1", "Piotr", 37);
        sqlDB.prepare("INSERT INTO users (user_id, user, age) VALUES (?, ?, ?)").run("u2", "Michał", 7);

        const removed = await users.remove({ user: "Michał" });
        const remaining = await users.find({});

        expect(removed).toHaveLength(1);
        expect(removed[0]).toMatchObject({ user_id: "u2", user: "Michał", age: 7 });
        expect(remaining).toHaveLength(1);
        expect(remaining[0]).toMatchObject({ user_id: "u1", user: "Piotr", age: 37 });
    });

    test("5. applies advanced search operators and find options", async () => {
        const { db } = setup("CREATE TABLE items (_id TEXT PRIMARY KEY, name TEXT, val INT, hidden INT)");
        const items = db.c("items");

        await items.add({ name: "A", val: 5, hidden: 1 });
        await items.add({ name: "B", val: 10, hidden: 2 });
        await items.add({ name: "C", val: 15, hidden: 3 });

        const found = await db.find<{ name: string; val: number }>({
            collection: "items",
            search: { $gt: { val: 7 } },
            findOpts: { select: ["name", "val"] }
        });

        expect(found).toHaveLength(2);
        expect(found[0]).toEqual({ name: "B", val: 10 });
        expect(found[1]).toEqual({ name: "C", val: 15 });
    });
});
