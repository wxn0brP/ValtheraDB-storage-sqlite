#!/usr/bin/env node
import { DatabaseSync } from "node:sqlite";
import { SQLiteValthera } from "../dist/index.js";
import { TABLES } from "./tables.js";

export default async () => {
	const sqlDB = new DatabaseSync(":memory:");

	for (const table of TABLES) sqlDB.exec(table);

	const actions = new SQLiteValthera(sqlDB);
	actions._inited = true;
	return actions;
};
