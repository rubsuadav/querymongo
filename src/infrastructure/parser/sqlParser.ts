/**
 * Parser SQL que encapsula node-sql-parser
 * Abstrae la dependencia externa y proporciona una interfaz limpia
 */
import sqlParser from "node-sql-parser";

const parser = new sqlParser.Parser();

export type ParsedQuery = ReturnType<typeof parser.parse>;

export const parseSqlQuery = (sql: string): ParsedQuery | ParsedQuery[] => {
  return parser.parse(sql);
};

export const normalizeQuery = (query: string): string => {
  return query.trim().replace(/;$/, "").replace(/\s+/g, " ");
};
