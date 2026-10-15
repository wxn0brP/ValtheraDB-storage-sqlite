import { Affinity, VStatement } from "./types.js";
export declare function qid(identifier: string): string;
export declare function computeAffinity(type: string): Affinity;
export declare function toSqlValue(v: any, affinity?: Affinity): any;
export declare function decodeSqlValue(value: any): any;
export declare function globEscape(value: string): string;
export declare function execStmt(stmt: VStatement, method: "all" | "run" | "get", ...args: any[]): Promise<any>;
