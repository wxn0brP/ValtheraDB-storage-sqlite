const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
export function qid(identifier) {
    return `"${identifier.replace(/"/g, '""')}"`;
}
export function computeAffinity(type) {
    const t = (type || "").toUpperCase();
    if (!t)
        return "NONE";
    if (t.includes("INT"))
        return "INTEGER";
    if (t.includes("CHAR") || t.includes("CLOB") || t.includes("TEXT"))
        return "TEXT";
    if (t.includes("BLOB"))
        return "NONE";
    if (t.includes("REAL") || t.includes("FLOA") || t.includes("DOUB"))
        return "REAL";
    return "NUMERIC";
}
const BLOB_PREFIX = "VJ:";
const BLOB_PREFIX_BYTES = textEncoder.encode(BLOB_PREFIX);
function encodeJsonBlob(v) {
    const json = textEncoder.encode(JSON.stringify(v));
    const out = new Uint8Array(BLOB_PREFIX_BYTES.length + json.length);
    out.set(BLOB_PREFIX_BYTES);
    out.set(json, BLOB_PREFIX_BYTES.length);
    return out;
}
function isNumericLike(s) {
    return s.trim() !== "" && !Number.isNaN(Number(s));
}
export function toSqlValue(v, affinity) {
    if (typeof v === "boolean")
        return encodeJsonBlob(v);
    if (v === null)
        return encodeJsonBlob(null);
    if (typeof v === "string") {
        if ((affinity === "INTEGER" ||
            affinity === "REAL" ||
            affinity === "NUMERIC") &&
            isNumericLike(v)) {
            return encodeJsonBlob(v);
        }
        return v;
    }
    if (typeof v === "object" && v !== null)
        return JSON.stringify(v);
    return v;
}
export function decodeSqlValue(value) {
    if (value instanceof Uint8Array) {
        if (startsWithBytes(value, BLOB_PREFIX_BYTES)) {
            const text = textDecoder.decode(value.subarray(BLOB_PREFIX_BYTES.length));
            try {
                return JSON.parse(text);
            }
            catch { }
        }
        return value;
    }
    return value;
}
function startsWithBytes(value, prefix) {
    if (value.length < prefix.length)
        return false;
    for (let i = 0; i < prefix.length; i++)
        if (value[i] !== prefix[i])
            return false;
    return true;
}
const GLOB_META = /[*?[\]]/g;
export function globEscape(value) {
    return value.replace(GLOB_META, c => `[${c}]`);
}
export async function execStmt(stmt, method, ...args) {
    const result = stmt[method](...args);
    return result instanceof Promise ? await result : result;
}
