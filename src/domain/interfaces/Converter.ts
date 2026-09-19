/**
 * Interface para conversores de queries SQL a MongoDB
 * Implementa Strategy Pattern para permitir diferentes estrategias de conversión
 */
export interface IConverter {
  can(statement: string): boolean;
  convert(query: any): Record<string, any>;
}
