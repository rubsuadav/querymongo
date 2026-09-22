/**
 * Conversor para queries SELECT con JOIN
 * Convierte queries SELECT con JOIN a aggregation pipeline de MongoDB
 */
import type { IConverter } from "../../domain/interfaces/Converter.ts";
import {
  buildProjection,
  buildFilter,
  removeUndefinedFields,
  extractSelectColumns,
  buildSort,
} from "../utils/queryUtils.ts";

export const JoinConverter: IConverter = {
  can: (statement: string): boolean => {
    const regex = /\b(INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN)\b/i;
    return (
      statement.toLowerCase().startsWith("select") && regex.test(statement)
    );
  },

  convert: (query: any): Record<string, any> => {
    const { ast } = query;
    const { from, columns, where, limit, orderby } = ast;

    const mainTable = from[0].table;
    const pipeline: any[] = [];

    const columnNames = columns ? extractSelectColumns(columns) : ["*"];
    const limitValue = limit?.value?.[0]?.value || limit?.value || limit;
    const sortSpec = buildSort(orderby);

    from.slice(1).forEach((join: any, index: number) => {
      if (join.join) {
        pipeline.push({
          $lookup: {
            from: join.table,
            localField: join.on.left.column,
            foreignField: join.on.right.column,
            as: join.as || join.table,
          },
        });

        const isLeftJoin = join.join.includes("LEFT");
        const nextIsInnerJoin = from[index + 2]?.join?.includes("INNER");

        if (isLeftJoin || !nextIsInnerJoin) {
          pipeline.push({
            $unwind: {
              path: `$${join.as || join.table}`,
              preserveNullAndEmptyArrays: isLeftJoin,
            },
          });
        }
      }
    });

    if (where) pipeline.push({ $match: buildFilter(where) });
    pipeline.push({ $project: buildProjection(columnNames) });
    if (sortSpec) pipeline.push({ $sort: sortSpec });
    if (limitValue) pipeline.push({ $limit: limitValue });

    return removeUndefinedFields({
      collection: mainTable,
      pipeline,
    });
  },
};
