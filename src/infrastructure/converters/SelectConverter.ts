/**
 * Conversor para queries SELECT
 * Convierte SELECT SQL a aggregation pipeline o find query de MongoDB
 */
import type { IConverter } from "../../domain/interfaces/Converter.ts";
import {
  buildProjection,
  buildFilter,
  removeUndefinedFields,
  extractSelectColumns,
} from "../utils/queryUtils.ts";

export const SelectConverter: IConverter = {
  can: (statement: string): boolean => {
    return statement.toLowerCase().startsWith("select");
  },

  convert: (query: any): Record<string, any> => {
    const { ast } = query;
    const { columns, from, where, limit } = ast;

    const fields = columns ? extractSelectColumns(columns) : "*";

    const limitValue = limit?.value?.[0]?.value || limit?.value || limit;

    return removeUndefinedFields({
      collection: from?.[0]?.table || "collection",
      queryType: where && fields !== "*" && limitValue ? "aggregation" : "find",
      pipeline: [
        { $match: buildFilter(where) || {} },
        fields !== "*" && { $project: buildProjection(fields) },
        limitValue && { $limit: limitValue },
      ].filter(Boolean),
    });
  },
};
