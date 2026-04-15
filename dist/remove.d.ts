import { DataInternal } from "@wxn0brp/db-core/types/data";
import { RemoveQuery } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from "./index.js";
export declare function remove(slv: SQLiteValthera, query: RemoveQuery, one: boolean): Promise<DataInternal[]>;
