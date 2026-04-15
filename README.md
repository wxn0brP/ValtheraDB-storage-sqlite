# @wxn0brp/db-storage-sqlite

A **pure SQLite storage adapter** for the ValtheraDB database library.
This package allows you to use SQLite as a backend while leveraging the **full power of ValtheraDB** (CRUD operations, relations, queries, `_id` generation, sorting, pagination, etc.).

> ⚠️ **Note:** Unlike the original ValtheraDB, SQLite requires tables to exist before inserting data. This adapter provides `ensureCollection` to check for table existence, but it **does not create empty tables automatically**.

## Features

* **Full CRUD** – Create, Read, Update, Delete operations fully supported.
* **Collection-based** – Each collection corresponds to a SQLite table.
* **Flexible Search** – Supports function-based or object-based searches.
* **Automatic ID Generation** – `_id` is generated automatically if missing.
* **Sorting & Pagination** – Built-in support for sorting, limiting, and offsetting results.
* **TypeScript Support** – Fully typed for safety and autocompletion.

## Installation

```bash
npm i @wxn0brp/db-storage-sqlite @wxn0brp/db-core
```

## Usage

```ts
import { createSQLiteValthera } from "@wxn0brp/db-storage-sqlite";
import Database from "better-sqlite3";
// import Database from "bun:sqlite";
// import Database from "node:sqlite";

// 1. Initialize SQLite database connection
const sqliteDB = new Database("path/to/database.sqlite");

// 2. Create a collection/table
sqliteDB.run("CREATE TABLE IF NOT EXISTS users (_id TEXT PRIMARY KEY, name TEXT, email TEXT)");

// 3. Create the ValtheraDB instance
const db = createSQLiteValthera<{
  users: {
    _id: string;
    name: string;
    email: string;
  }
}>(sqliteDB);

// 4. Ensure the collection/table exists
await db.ensureCollection("users");

// 5. Add a new entry (_id generated automatically, _id is type `TEXT`)
await db.users.add({ name: "John Doe", email: "john@example.com" });

// 6. Find entries
const users = await db.users.find({ name: "John Doe" });

// 7. Update entries
await db.users.update({ name: "John Doe" }, { email: "newemail@example.com" });

// 8. Remove entries
await db.users.remove({ name: "John Doe" });
```

## API Notes

* **`ensureCollection(collection: string)`**
  Checks if the collection (table) exists.
  Throws an error if the table does not exist.

  > This is necessary because SQLite cannot create a table without defining at least one column.

* All other methods (`add`, `find`, `update`, `remove`) are **fully compatible with ValtheraDB**, preserving all features like `_id` generation, complex filters (`hasFieldsAdvanced`), sorting, pagination, and function-based search.

## License

MIT

## Contributing

Contributions and bug requests are welcome!
