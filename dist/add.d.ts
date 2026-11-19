import { VQueryT } from "@wxn0brp/db-core/types/query";
import { SQLiteAdapter } from "./adapter.js";
export declare function add(slv: SQLiteAdapter, config: VQueryT.Add): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>>;
export declare function bulkAdd(slv: SQLiteAdapter, config: VQueryT.BulkAdd): Promise<import("@wxn0brp/db-core/types/arg").Arg<import("@wxn0brp/db-core/types/data").Data>[]>;
