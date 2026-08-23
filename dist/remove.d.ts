import { DataInternal } from "@wxn0brp/db-core/types/data";
import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from "./index.js";
export declare function remove(slv: SQLiteValthera, query: VQueryT.Remove, one: boolean): Promise<DataInternal[]>;
