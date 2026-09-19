/**
 * Factory que orquesta los conversores
 * Implementa Strategy Pattern + Factory Pattern
 * Centraliza la lógica de selección de conversor
 */
import type { IConverter } from "../../domain/interfaces/Converter.ts";
import { SelectConverter } from "./SelectConverter.ts";
import { CreateConverter } from "./CreateConverter.ts";
import { UpdateConverter } from "./UpdateConverter.ts";
import { DeleteConverter } from "./DeleteConverter.ts";

const CONVERTERS: IConverter[] = [
  SelectConverter,
  CreateConverter,
  UpdateConverter,
  DeleteConverter,
];

export const getConverter = (statement: string): IConverter | null => {
  return CONVERTERS.find((converter) => converter.can(statement)) || null;
};
