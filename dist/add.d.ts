import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteValthera } from "./actions.js";
export declare function add(slv: SQLiteValthera, config: VQueryT.Add): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>>;
export declare function bulkAdd(slv: SQLiteValthera, config: VQueryT.BulkAdd): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>[]>;
