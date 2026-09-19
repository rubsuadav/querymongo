#!/usr/bin/env node

/**
 * Ejemplos de uso de QueryMongo
 * Demuestra diferentes formas de usar la librería
 */
import { mongoConverter } from "./src/application/MongoConverter.ts";
import chalk from "chalk";

interface Example {
  title: string;
  sql: string;
  description?: string;
}

const examples: Example[] = [
  {
    title: "📌 SELECT Simple",
    sql: "SELECT name, email FROM users",
    description: "Selecciona campos específicos",
  },
  {
    title: "🔍 SELECT con WHERE",
    sql: "SELECT * FROM products WHERE price > 100",
    description: "Filtra documentos con condición",
  },
  {
    title: "📊 SELECT con WHERE y LIMIT",
    sql: "SELECT name, age FROM users WHERE age >= 18 LIMIT 10",
    description: "Proyección, filtro y límite combinados",
  },
  {
    title: "➕ INSERT Simple",
    sql: "INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 30)",
    description: "Insertar un documento",
  },
  {
    title: "✏️ UPDATE con WHERE",
    sql: 'UPDATE users SET age = 31 WHERE name = "John Doe"',
    description: "Actualizar documentos que cumplen condición",
  },
  {
    title: "🗑️ DELETE con WHERE",
    sql: "DELETE FROM users WHERE age < 18",
    description: "Eliminar documentos que cumplen condición",
  },
];

console.log(chalk.bold.blue("\n🚀 QueryMongo - Ejemplos de Uso\n"));
console.log(chalk.gray("Convierte queries SQL a MongoDB format\n"));

examples.forEach((example, index) => {
  console.log(chalk.bold.cyan(`\n${index + 1}. ${example.title}`));
  if (example.description) {
    console.log(chalk.gray(`   ${example.description}`));
  }

  console.log(chalk.yellow("\n   SQL:"));
  console.log(chalk.white(`   ${example.sql}`));

  try {
    const result = mongoConverter.convert(example.sql);

    console.log(chalk.green("\n   📋 MongoDB Query:"));
    const resultStr = JSON.stringify(result, null, 4)
      .split("\n")
      .map((line) => `   ${line}`)
      .join("\n");
    console.log(resultStr);
  } catch (error) {
    console.error(
      chalk.red(
        `   ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      ),
    );
  }
});

console.log(chalk.bold.green("\n✨ Todos los ejemplos completados\n"));
