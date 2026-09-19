/**
 * Servicio principal de conversión
 * Orquesta el parsing y la conversión a MongoDB
 */
import {
  parseSqlQuery,
  normalizeQuery,
} from "../infrastructure/parser/sqlParser.ts";
import { getConverter } from "../infrastructure/converters/ConverterFactory.ts";

export class MongoConverter {
  convert(sql: string): Record<string, any> {
    const normalized = normalizeQuery(sql);
    const parsed = parseSqlQuery(normalized);

    const statement = Array.isArray(parsed) ? parsed[0] : parsed;
    const converter = getConverter(normalized);

    if (!converter) {
      throw new Error(
        `Unsupported SQL statement: ${normalized.substring(0, 50)}...`,
      );
    }

    return converter.convert(statement);
  }
}

export const mongoConverter = new MongoConverter();
