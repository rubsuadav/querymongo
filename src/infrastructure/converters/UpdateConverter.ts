/**
 * Conversor para queries UPDATE
 * Convierte UPDATE SQL a updateOne/updateMany de MongoDB
 */
import type { IConverter } from "../../domain/interfaces/Converter.ts";
import {
  buildFilter,
  determineOperation,
  removeUndefinedFields,
} from "../utils/queryUtils.ts";

export const UpdateConverter: IConverter = {
  can: (statement: string): boolean => {
    return statement.toLowerCase().startsWith("update");
  },

  convert: (query: any): Record<string, any> => {
    const { ast } = query;
    const { table, set, where } = ast;

    const collectionName = table?.[0]?.table || "collection";
    const updateData = Object.fromEntries(
      set.map((item: any) => [item.column, item.value?.value || item.value]),
    );

    return removeUndefinedFields({
      collection: collectionName,
      operation: determineOperation(where, {
        one: "updateOne",
        many: "updateMany",
      }),
      filter: where ? buildFilter(where) : {},
      update: { $set: updateData },
    });
  },
};
