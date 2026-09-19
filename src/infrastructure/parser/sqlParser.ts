/**
 * Parser SQL que encapsula node-sql-parser
 * Abstrae la dependencia externa y proporciona una interfaz limpia
 */
import pkg from "node-sql-parser";

const { Parser } = pkg;
const sqlParser = new Parser();

export type ParsedQuery = ReturnType<typeof sqlParser.parse>;

export const parseSqlQuery = (sql: string): ParsedQuery | ParsedQuery[] => {
  return sqlParser.parse(sql);
};

export const normalizeQuery = (query: string): string => {
  return query.trim().replace(/;$/, "").replace(/\s+/g, " ");
};
