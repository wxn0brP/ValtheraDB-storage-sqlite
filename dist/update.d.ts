import { DataInternal } from "@wxn0brp/db-core/types/data";
import { UpdateQuery } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from "./index.js";
export declare function update(slv: SQLiteValthera, query: UpdateQuery, one: boolean): Promise<DataInternal[]>;
