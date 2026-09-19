/**
 * Conversor para queries CREATE/INSERT
 * Convierte CREATE/INSERT SQL a insertOne/insertMany de MongoDB
 */
import type { IConverter } from "../../domain/interfaces/Converter.ts";
import { removeUndefinedFields } from "../utils/queryUtils.ts";

export const CreateConverter: IConverter = {
  can: (statement: string): boolean => {
    const lower = statement.toLowerCase();
    return lower.startsWith("insert") || lower.startsWith("create");
  },

  convert: (query: any): Record<string, any> => {
    const { ast } = query;
    const { table, columns, values } = ast;

    const collectionName = table?.[0]?.table || "collection";
    const valuesList = values.values || [];

    const docs = valuesList.map((v: any) => {
      const row = v.value || v;
      return Object.fromEntries(
        columns.map((col: string, idx: number) => [
          col,
          row[idx]?.value || row[idx],
        ]),
      );
    });

    return removeUndefinedFields({
      collection: collectionName,
      operation: docs.length > 1 ? "insertMany" : "insertOne",
      documents: docs.length === 1 ? docs[0] : docs,
    });
  },
};
