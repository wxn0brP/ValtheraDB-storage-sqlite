import { Data } from "@wxn0brp/db-core/types/data";
import { FindQuery } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from "./index.js";
export declare function find(slv: SQLiteValthera, config: FindQuery): Promise<Data[]>;
