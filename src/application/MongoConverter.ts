/**
 * Servicio principal de conversión
 * Orquesta el parsing y la conversión a MongoDB
 */
import {
  parseSqlQuery,
  normalizeQuery,
} from "../infrastructure/parser/sqlParser.ts";
import { getConverter } from "../infrastructure/converters/ConverterFactory.ts";

class MongoConverter {
  convert(sql: string): Record<string, any> {
    try {
      if (!sql || typeof sql !== "string")
        throw new Error("SQL query must be a non-empty string");

      const normalized = normalizeQuery(sql);
      const parsed = parseSqlQuery(normalized);

      const statement = Array.isArray(parsed) ? parsed[0] : parsed;

      if (!statement)
        throw new Error(
          "Could not parse SQL statement. Check your query syntax.",
        );

      const converter = getConverter(normalized);

      if (!converter) {
        throw new Error(
          `Unsupported SQL statement: ${normalized.substring(0, 50)}...`,
        );
      }

      return converter.convert(statement);
    } catch (error: any) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }
}

export const mongoConverter = new MongoConverter();
