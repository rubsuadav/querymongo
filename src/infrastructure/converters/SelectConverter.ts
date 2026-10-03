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
  buildSort,
  buildGroupStage,
  buildAggregationProjection,
  hasAggregation,
  buildHavingFilter,
} from "../utils/queryUtils.ts";

export const SelectConverter: IConverter = {
  can: (statement: string): boolean => {
    return statement.toLowerCase().startsWith("select");
  },

  convert: (query: any): Record<string, any> => {
    const { ast } = query;
    const { columns, from, where, limit, orderby, groupby, having } = ast;

    const fields = columns ? extractSelectColumns(columns) : "*";
    const aggregation = hasAggregation(columns) || groupby?.columns?.length > 0;
    const groupStage = aggregation ? buildGroupStage(columns, groupby) : null;
    const aggregationProjection = aggregation
      ? buildAggregationProjection(columns, groupby)
      : null;

    const limitValue = limit?.value?.[0]?.value || limit?.value || limit;
    const sortSpec = buildSort(orderby);

    return removeUndefinedFields({
      collection: from?.[0]?.table || "collection",
      queryType:
        aggregation || (where && fields !== "*" && limitValue)
          ? "aggregation"
          : "find",
      pipeline: [
        { $match: buildFilter(where) || {} },
        groupStage,
        aggregationProjection
          ? { $project: aggregationProjection }
          : !aggregation &&
            fields !== "*" && { $project: buildProjection(fields) },
        having && { $match: buildHavingFilter(having, columns) },
        sortSpec && { $sort: sortSpec },
        limitValue && { $limit: limitValue },
      ].filter(Boolean),
    });
  },
};
