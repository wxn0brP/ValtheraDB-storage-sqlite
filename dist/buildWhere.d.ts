import { AffinityMap } from "./types.js";
export interface WhereResult {
    sql: string;
    values: any[];
    postFilter?: (row: any) => boolean;
}
export declare function buildWhere(search: any, affinities: AffinityMap): WhereResult;
