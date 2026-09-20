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
