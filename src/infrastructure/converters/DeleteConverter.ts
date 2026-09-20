/**
 * Conversor para queries DELETE
 * Convierte DELETE SQL a deleteOne/deleteMany de MongoDB
 */
import type { IConverter } from "../../domain/interfaces/Converter.ts";
import {
  buildFilter,
  determineOperation,
  removeUndefinedFields,
} from "../utils/queryUtils.ts";

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
      operation: determineOperation(where, {
        one: "deleteOne",
        many: "deleteMany",
      }),
      filter: where ? buildFilter(where) : {},
    });
  },
};
