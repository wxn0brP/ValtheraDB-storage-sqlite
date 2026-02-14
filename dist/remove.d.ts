import { Search } from "@wxn0brp/db-core/types/arg";
import { Data } from "@wxn0brp/db-core/types/data";
import { VContext } from "@wxn0brp/db-core/types/types";
import { SQLiteValthera } from "./index.js";
export declare function remove(slv: SQLiteValthera, collection: string, one: boolean, search: Search, context?: VContext): Promise<Data[]>;
