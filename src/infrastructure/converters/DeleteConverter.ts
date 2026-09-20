/**
 * Conversor para queries DELETE
 * Convierte DELETE SQL a deleteOne/deleteMany de MongoDB
 */
import type { IConverter } from "../../domain/interfaces/Converter.ts";
import { buildFilter, removeUndefinedFields } from "../utils/queryUtils.ts";

export const DeleteConverter: IConverter = {
  can: (statement: string): boolean => {
    return statement.toLowerCase().startsWith("delete");
  },

  convert: (query: any): Record<string, any> => {
    const { ast } = query;
    const { from, where } = ast;

    const collectionName = from?.[0]?.table || "collection";

    return removeUndefinedFields({
      collection: collectionName,
      operation: determineOperation(where),
      filter: where ? buildFilter(where) : {},
    });
  },
};

function determineOperation(where: any): "deleteOne" | "deleteMany" {
  if (!where) return "deleteMany";

  const uniqueFields = ["id", "_id", "email", "username"];

  const { operator, left } = where;

  if (operator?.toLowerCase() === "and" || operator?.toLowerCase() === "or") {
    return "deleteMany";
  }

  const field = left?.column || left?.value || left || "";
  const isUniqueField = uniqueFields.includes(field?.toLowerCase?.());

  if (isUniqueField && operator === "=") {
    return "deleteOne";
  }

  if (
    [">", "<", ">=", "<=", "!=", "<>", "like", "in"].includes(
      operator?.toLowerCase(),
    )
  ) {
    return "deleteMany";
  }

  return "deleteOne";
}
