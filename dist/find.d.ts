import { Data } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteAdapter } from "./adapter.js";
export declare function find(slv: SQLiteAdapter, config: VQueryT.Find): Promise<Data[]>;
