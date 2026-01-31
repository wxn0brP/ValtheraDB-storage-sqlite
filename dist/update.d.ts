import { Search, Updater } from "@wxn0brp/db-core/types/arg";
import { VContext } from "@wxn0brp/db-core/types/types";
import { SQLiteValthera } from "./index.js";
export declare function update(slv: SQLiteValthera, collection: string, one: boolean, search: Search, updater: Updater, context?: VContext): Promise<boolean>;
