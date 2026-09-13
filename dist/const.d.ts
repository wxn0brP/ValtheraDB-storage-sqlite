import { Affinity } from "./types.js";
export declare const MAX_STMT_CACHE = 100;
export declare const BATCH_SIZE: number;
interface PushResult {
    sql: string;
    values: any[];
}
type PushFn = (field: string, value: any, affinity?: Affinity) => PushResult | null;
export declare const PUSHABLE_OPS: Record<string, PushFn>;
export declare const NON_PUSHABLE_OPS: Set<string>;
export declare const COMPLEX_OPS: string[];
export {};
