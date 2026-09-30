import { globEscape, qid, toSqlValue } from "./utils.js";
export const MAX_STMT_CACHE = 100;
export const BATCH_SIZE = +process.env.VALTHERA_SQLITE_BATCH_SIZE || 500;
const NUMERIC_TYPEOF = "IN ('integer','real')";
function numGuard(field, op, value) {
    const f = qid(field);
    return {
        sql: `(typeof(${f}) ${NUMERIC_TYPEOF} AND ${f} ${op} ?)`,
        values: [
            value,
        ],
    };
}
function textGuard(field, op, value) {
    const f = qid(field);
    return {
        sql: `(typeof(${f}) = 'text' AND ${f} ${op} ?)`,
        values: [
            value,
        ],
    };
}
function rangeOp(field, value, op) {
    if (typeof value === "number" && Number.isFinite(value))
        return numGuard(field, op, value);
    if (typeof value === "string")
        return textGuard(field, op, value);
    return null;
}
function buildInComposite(field, list) {
    if (list.some(v => v === undefined || (typeof v === "number" && !Number.isFinite(v))))
        return null;
    const f = qid(field);
    const numbers = list.filter(v => typeof v === "number");
    const strings = list.filter(v => typeof v === "string");
    const others = list.filter(v => typeof v === "boolean" || v === null);
    const groups = [];
    const values = [];
    if (numbers.length > 0) {
        groups.push(`(typeof(${f}) ${NUMERIC_TYPEOF} AND ${f} IN (${numbers.map(() => "?").join(",")}))`);
        values.push(...numbers);
    }
    if (strings.length > 0) {
        groups.push(`(typeof(${f}) = 'text' AND ${f} IN (${strings.map(() => "?").join(",")}))`);
        values.push(...strings);
    }
    if (others.length > 0) {
        groups.push(`${f} IN (${others.map(() => "?").join(",")})`);
        values.push(...others.map(v => toSqlValue(v)));
    }
    if (groups.length === 0)
        return null;
    return {
        sql: groups.join(" OR "),
        values,
    };
}
export const PUSHABLE_OPS = {
    $gt: (field, value) => rangeOp(field, value, ">"),
    $lt: (field, value) => rangeOp(field, value, "<"),
    $gte: (field, value) => rangeOp(field, value, ">="),
    $lte: (field, value) => rangeOp(field, value, "<="),
    $in: (field, value) => {
        if (!Array.isArray(value))
            return null;
        return buildInComposite(field, value);
    },
    $nin: (field, value) => {
        if (!Array.isArray(value))
            return null;
        const composite = buildInComposite(field, value);
        if (!composite)
            return null;
        return {
            sql: `NOT (${composite.sql})`,
            values: composite.values,
        };
    },
    $between: (field, value) => {
        if (!Array.isArray(value) || value.length !== 2)
            return null;
        const f = qid(field);
        const [min, max] = value;
        if (typeof min !== "number" ||
            typeof max !== "number" ||
            !Number.isFinite(min) ||
            !Number.isFinite(max))
            return null;
        return {
            sql: `(typeof(${f}) ${NUMERIC_TYPEOF} AND ${f} BETWEEN ? AND ?)`,
            values: [
                min,
                max,
            ],
        };
    },
    $exists: (field, value) => {
        const f = qid(field);
        if (value === true)
            return {
                sql: `${f} IS NOT NULL`,
                values: [],
            };
        if (value === false)
            return {
                sql: `${f} IS NULL`,
                values: [],
            };
        return null;
    },
    $startswith: (field, value) => {
        if (typeof value !== "string")
            return null;
        const f = qid(field);
        return {
            sql: `(typeof(${f}) = 'text' AND ${f} GLOB ?)`,
            values: [
                globEscape(value) + "*",
            ],
        };
    },
    $endswith: (field, value) => {
        if (typeof value !== "string")
            return null;
        const f = qid(field);
        return {
            sql: `(typeof(${f}) = 'text' AND ${f} GLOB ?)`,
            values: [
                "*" + globEscape(value),
            ],
        };
    },
};
export const NON_PUSHABLE_OPS = new Set([
    "$type",
    "$size",
    "$arrinc",
    "$arrincall",
    "$idgt",
    "$idlt",
    "$idgte",
    "$idlte",
    "$regex",
]);
export const COMPLEX_OPS = [
    "$push",
    "$pushall",
    "$pushset",
    "$pull",
    "$pullall",
    "$rename",
    "$unset",
    "$merge",
    "$deepmerge",
];
