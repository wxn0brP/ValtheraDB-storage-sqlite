export const TABLES = [
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
    )`,
];
