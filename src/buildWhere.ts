import { hasFieldsAdvanced } from "@wxn0brp/db-core/utils/hasFieldsAdvanced";
import { PUSHABLE_OPS } from "./const";
import { AffinityMap } from "./types";
import { qid, toSqlValue } from "./utils";

export interface WhereResult {
	sql: string;
	values: any[];
	postFilter?: (row: any) => boolean;
}

const FALSE_SQL = "1 = 0";

function isMatchAllCondition(cond: any): boolean {
	return (
		cond === undefined ||
		cond === null ||
		(typeof cond === "object" &&
			!Array.isArray(cond) &&
			Object.keys(cond).length === 0)
	);
}

export function buildWhere(search: any, affinities: AffinityMap): WhereResult {
	if (search === undefined || search === null) {
		return {
			sql: "",
			values: [],
		};
	}

	if (typeof search === "function") {
		return {
			sql: "",
			values: [],
			postFilter: search,
		};
	}

	if (typeof search !== "object" || Array.isArray(search)) {
		return {
			sql: FALSE_SQL,
			values: [],
		};
	}

	if (Object.keys(search).length === 0) {
		return {
			sql: "",
			values: [],
		};
	}

	const $fields: Record<string, any> = {};
	const flatFields: Record<string, any> = {};

	for (const key of Object.keys(search)) {
		if (key.startsWith("$")) {
			$fields[key.toLowerCase()] = search[key];
		} else {
			flatFields[key] = search[key];
		}
	}

	const clauses: string[] = [];
	const allValues: any[] = [];
	const postFilters: ((row: any) => boolean)[] = [];

	for (const [key, value] of Object.entries(flatFields)) {
		if (typeof value === "object" && value !== null && !Array.isArray(value)) {
			postFilters.push(row => {
				try {
					return hasFieldsAdvanced(row, {
						[key]: value,
					} as any);
				} catch {
					return false;
				}
			});
		} else if (value === undefined) {
			postFilters.push(() => false);
		} else {
			clauses.push(`${qid(key)} = ?`);
			allValues.push(toSqlValue(value, affinities[key]));
		}
	}

	if ("$subset" in $fields) {
		const subsetSearch = {
			$subset: $fields["$subset"],
		};
		postFilters.push(row => {
			try {
				return hasFieldsAdvanced(row, subsetSearch as any);
			} catch {
				return false;
			}
		});
		delete $fields["$subset"];
	}

	if ("$not" in $fields) {
		const notResult = buildWhere($fields["$not"], affinities);
		if (notResult.sql && !notResult.postFilter) {
			clauses.push(`NOT (${notResult.sql})`);
			allValues.push(...notResult.values);
		} else {
			const innerSearch = $fields["$not"];
			postFilters.push(row => {
				try {
					return !hasFieldsAdvanced(row, innerSearch);
				} catch {
					return false;
				}
			});
		}
		delete $fields["$not"];
	}

	if ("$and" in $fields) {
		const andResult = buildAnd($fields["$and"], affinities);
		if (andResult.sql) {
			clauses.push(`(${andResult.sql})`);
			allValues.push(...andResult.values);
		}
		if (andResult.postFilter) {
			postFilters.push(andResult.postFilter);
		}
		delete $fields["$and"];
	}

	if ("$or" in $fields) {
		const orResult = buildOr($fields["$or"], affinities);
		if (orResult.sql) {
			clauses.push(`(${orResult.sql})`);
			allValues.push(...orResult.values);
		}
		if (orResult.postFilter) {
			postFilters.push(orResult.postFilter);
		}
		delete $fields["$or"];
	}

	for (const [opKey, fieldMap] of Object.entries($fields)) {
		if (typeof fieldMap !== "object" || fieldMap === null) continue;

		for (const [field, value] of Object.entries(fieldMap)) {
			let pushed = false;
			const pushable = PUSHABLE_OPS[opKey];

			const isSimpleValue =
				!(value instanceof RegExp) &&
				(typeof value !== "object" || value === null || Array.isArray(value));

			if (pushable && !field.includes(".") && isSimpleValue) {
				const result = pushable(field, value, affinities[field]);
				if (result) {
					clauses.push(result.sql);
					allValues.push(...result.values);
					pushed = true;
				}
			}

			if (!pushed) {
				postFilters.push(row => {
					try {
						return hasFieldsAdvanced(row, {
							[opKey]: {
								[field]: value,
							},
						} as any);
					} catch {
						return false;
					}
				});
			}
		}
	}

	let postFilter: ((row: any) => boolean) | undefined;
	if (postFilters.length > 0) {
		postFilter = row => postFilters.every(fn => fn(row));
	}

	return {
		sql: clauses.join(" AND "),
		values: allValues,
		postFilter,
	};
}

function buildAnd(conditions: any[], affinities: AffinityMap): WhereResult {
	if (!Array.isArray(conditions)) {
		return {
			sql: FALSE_SQL,
			values: [],
		};
	}

	const clauses: string[] = [];
	const allValues: any[] = [];
	const postFilters: ((row: any) => boolean)[] = [];

	for (const condition of conditions) {
		const result = buildWhere(condition, affinities);
		if (result.sql) {
			clauses.push(`(${result.sql})`);
			allValues.push(...result.values);
		}
		if (result.postFilter) {
			postFilters.push(result.postFilter);
		}
	}

	let postFilter: ((row: any) => boolean) | undefined;
	if (postFilters.length > 0) {
		postFilter = row => postFilters.every(fn => fn(row));
	}

	return {
		sql: clauses.join(" AND "),
		values: allValues,
		postFilter,
	};
}

function buildOr(conditions: any[], affinities: AffinityMap): WhereResult {
	if (!Array.isArray(conditions)) {
		return {
			sql: FALSE_SQL,
			values: [],
		};
	}

	if (conditions.some(isMatchAllCondition)) {
		return {
			sql: "",
			values: [],
		};
	}

	const results = conditions.map(c => buildWhere(c, affinities));
	const allFullyPushable = results.every(r => !r.postFilter);

	if (allFullyPushable) {
		const nonEmpty = results.filter(r => r.sql && r.sql !== FALSE_SQL);
		if (nonEmpty.length === 0)
			return {
				sql: FALSE_SQL,
				values: [],
			};
		return {
			sql: nonEmpty.map(r => `(${r.sql})`).join(" OR "),
			values: nonEmpty.flatMap(r => r.values),
		};
	}

	return {
		sql: "",
		values: [],
		postFilter: row => {
			try {
				return hasFieldsAdvanced(row, {
					$or: conditions,
				} as any);
			} catch {
				return false;
			}
		},
	};
}
