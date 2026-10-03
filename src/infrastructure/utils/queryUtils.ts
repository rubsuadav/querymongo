/**
 * Utilidades para conversión de queries SQL a MongoDB
 * Centraliza lógica reutilizable siguiendo principio DRY
 */
import _ from "lodash";

export const removeUndefinedFields = (
  obj: _.Dictionary<any>,
): _.Dictionary<any> => {
  return _.omitBy(obj, _.isUndefined);
};

const normalizeFieldName = (field: string): string => {
  return field.trim().replace(/`|"/g, "");
};

const normalizeFieldNames = (fields: string[]): string[] => {
  return fields.map(normalizeFieldName);
};

const normalizeQualifiedField = (field: string): string => {
  const parts = field.split(".");
  return parts.length > 1 ? (parts[parts.length - 1] as string) : field;
};

export const extractSelectColumns = (columns: any[]): string[] => {
  if (!columns) return ["*"];

  return columns.map((col: any) => {
    if (typeof col === "object" && col.expr) {
      return col.expr.column || col.expr.value || "*";
    }
    return col;
  });
};

const getColumnName = (expression: any): string => {
  const column = expression?.column || expression?.value || expression || "";
  return normalizeQualifiedField(normalizeFieldName(String(column)));
};

const getColumnAlias = (column: any, fallback: string): string => {
  const alias = column?.as;
  if (typeof alias === "string") return normalizeFieldName(alias);
  if (alias?.value !== undefined)
    return normalizeFieldName(String(alias.value));
  return fallback;
};

const getColumnExpression = (column: any): any => column?.expr || column;

const isAggregationColumn = (column: any): boolean => {
  return getColumnExpression(column)?.type === "aggr_func";
};

const getAggregationKey = (expression: any): string => {
  return `${String(expression?.name || "").toUpperCase()}:${getColumnName(
    expression?.args?.expr,
  )}`;
};

const findAggregationAlias = (
  expression: any,
  columns: any[],
): string | null => {
  const matchingColumn = (columns || []).find((column: any) => {
    const selectExpression = getColumnExpression(column);
    return (
      selectExpression?.type === "aggr_func" &&
      getAggregationKey(selectExpression) === getAggregationKey(expression)
    );
  });

  if (!matchingColumn) return null;

  const functionName = String(expression.name || "").toLowerCase();
  return getColumnAlias(matchingColumn, functionName);
};

const normalizeHavingCondition = (condition: any, columns: any[]): any => {
  if (!condition) return condition;

  const operator = condition.operator?.toUpperCase();
  if (operator === "AND" || operator === "OR") {
    return {
      ...condition,
      left: normalizeHavingCondition(condition.left, columns),
      right: normalizeHavingCondition(condition.right, columns),
    };
  }

  const left = condition.left;
  if (left?.type !== "aggr_func") return condition;

  const alias = findAggregationAlias(left, columns);
  if (!alias) return condition;

  return {
    ...condition,
    left: { type: "column_ref", column: alias },
  };
};

export const hasAggregation = (columns: any[]): boolean => {
  return columns?.some(isAggregationColumn) ?? false;
};

export const buildHavingFilter = (
  condition: any,
  columns: any[],
): Record<string, any> => {
  return buildFilter(normalizeHavingCondition(condition, columns));
};

export const buildGroupStage = (
  columns: any[],
  groupBy: any,
): Record<string, any> | null => {
  const groupColumns = Array.isArray(groupBy?.columns) ? groupBy.columns : [];
  const groupId =
    groupColumns.length === 0
      ? null
      : groupColumns.length === 1
        ? `$${getColumnName(groupColumns[0])}`
        : Object.fromEntries(
            groupColumns.map((column: any) => {
              const field = getColumnName(column);
              return [field, `$${field}`];
            }),
          );

  const group: Record<string, any> = { _id: groupId };

  for (const column of columns || []) {
    const expression = getColumnExpression(column);
    if (expression?.type !== "aggr_func") continue;

    const functionName = String(expression.name || "").toUpperCase();
    const alias = getColumnAlias(column, functionName.toLowerCase());
    const argument = expression.args?.expr;

    if (functionName === "COUNT") {
      group[alias] = { $sum: argument?.type === "star" ? 1 : 1 };
      continue;
    }

    const operator = `$${functionName.toLowerCase()}`;
    if (!["$min", "$max", "$sum", "$avg"].includes(operator)) continue;

    group[alias] = {
      [operator]: `$${getColumnName(argument)}`,
    };
  }

  return Object.keys(group).length > 1 ? { $group: group } : null;
};

export const buildAggregationProjection = (
  columns: any[],
  groupBy: any,
): Record<string, any> | null => {
  const groupColumns = Array.isArray(groupBy?.columns) ? groupBy.columns : [];
  if (groupColumns.length === 0) return null;

  const projection: Record<string, any> = { _id: 0 };
  groupColumns.forEach((column: any) => {
    const field = getColumnName(column);
    projection[field] = groupColumns.length === 1 ? "$_id" : `$_id.${field}`;
  });

  (columns || []).forEach((column: any) => {
    if (isAggregationColumn(column)) {
      const expression = getColumnExpression(column);
      const functionName = String(expression.name || "").toLowerCase();
      projection[getColumnAlias(column, functionName)] = 1;
    }
  });

  return projection;
};

export const buildProjection = (
  fields: string[] | "*",
): Record<string, 1 | 0> => {
  if (Array.isArray(fields) && fields.length === 1 && fields[0] === "*")
    return {};
  if (fields === "*") return {};
  return Object.fromEntries(
    normalizeFieldNames(fields)
      .map(normalizeQualifiedField) // Soporte para alias de tabla en campos cualificados
      .map((f) => [f, 1]),
  );
};

export const buildFilter = (condition: any): Record<string, any> => {
  if (!condition) return {};

  const { operator, left, right } = condition;

  if (!operator) return {};

  if (operator.toUpperCase() === "BETWEEN") {
    const field = normalizeFieldName(left?.column || left?.value || left || "");
    const minValue = right?.value.length > 0 ? right.value[0] : undefined;
    const maxValue = right?.value.length > 1 ? right.value[1] : undefined;
    return {
      $and: [{ [field]: { $gte: minValue } }, { [field]: { $lte: maxValue } }],
    };
  }

  if (operator.toUpperCase() === "AND") {
    return {
      $and: [buildFilter(left), buildFilter(right)],
    };
  }

  if (operator.toUpperCase() === "OR") {
    return {
      $or: [buildFilter(left), buildFilter(right)],
    };
  }

  const field = normalizeFieldName(left?.column || left?.value || left || "");
  const value = right?.value !== undefined ? right.value : right;

  const operatorMap: Record<string, string> = {
    "=": "$eq",
    "!=": "$ne",
    "<>": "$ne",
    "<": "$lt",
    ">": "$gt",
    "<=": "$lte",
    ">=": "$gte",
    like: "$regex",
    in: "$in",
    "not in": "$nin",
  };

  const mongoOp = operatorMap[operator.toLowerCase()];

  return mongoOp ? { [field]: { [mongoOp]: value } } : {};
};

export const buildSort = (orderBy: any): Record<string, 1 | -1> | null => {
  if (!orderBy || !Array.isArray(orderBy) || orderBy.length === 0) return null;

  return Object.fromEntries(
    orderBy.map((item: any) => {
      // Extraer el nombre del campo
      const field = item.expr?.column || item.expr?.value || item.expr || "";
      const normalizedField = normalizeFieldName(field);
      const qualifiedField = normalizeQualifiedField(normalizedField);

      // Determinar dirección: 1 para ASC, -1 para DESC
      const direction = item.type?.toUpperCase() === "DESC" ? -1 : 1;
      return [qualifiedField, direction];
    }),
  );
};

export function determineOperation(
  where: any,
  operations: { one: string; many: string },
): string {
  const uniqueFields = ["id", "_id", "email", "username"];

  if (!where) return operations.many;

  const { operator, left } = where;

  if (["and", "or"].includes(operator?.toLowerCase())) {
    return operations.many;
  }

  const field = left?.column || left?.value || left || "";
  const isUniqueField = uniqueFields.includes(field?.toLowerCase?.());

  if (isUniqueField && operator === "=") {
    return operations.one;
  }

  return operations.many;
}
