import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteAdapter } from "./adapter.js";
export declare function remove(slv: SQLiteAdapter, query: VQueryT.Remove, one: boolean): Promise<DataInternal[]>;
