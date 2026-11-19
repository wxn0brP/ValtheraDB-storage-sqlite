import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteAdapter } from "./adapter.js";
export declare function update(slv: SQLiteAdapter, query: VQueryT.Update, one: boolean): Promise<DataInternal[]>;
