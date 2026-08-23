#!/usr/bin/env node
import Database from "better-sqlite3";
import { SQLiteValthera } from "../dist/index.js";
import { TABLES } from "./tables.js";

export default async () => {
	const sqlDB = new Database(":memory:");

	for (const table of TABLES) sqlDB.exec(table);

	const actions = new SQLiteValthera(sqlDB);
	actions._inited = true;
	return actions;
};
