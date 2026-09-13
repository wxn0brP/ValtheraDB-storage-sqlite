import { Data } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from "./index.js";
export declare function find(slv: SQLiteValthera, config: VQueryT.Find): Promise<Data[]>;
