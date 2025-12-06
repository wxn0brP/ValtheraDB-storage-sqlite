import Data from "@wxn0brp/db-core/types/data";
import { VQuery } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from "./index.js";
export declare function find(slv: SQLiteValthera, config: VQuery): Promise<Data[]>;
