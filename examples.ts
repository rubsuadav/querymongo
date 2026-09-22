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
  // ================== SELECT QUERIES ==================
  {
    title: "📌 SELECT Simple - Todos los documentos",
    sql: "SELECT * FROM users",
    description: "Obtiene todos los documentos de la colección",
  },
  {
    title: "📌 SELECT - Campos específicos",
    sql: "SELECT name, email FROM users",
    description: "Selecciona solo campos específicos",
  },
  {
    title: "🔍 SELECT con WHERE - Igualdad",
    sql: "SELECT * FROM users WHERE status = 'active'",
    description: "Filtra documentos por igualdad",
  },
  {
    title: "🔍 SELECT con WHERE - Comparación",
    sql: "SELECT * FROM products WHERE price > 100",
    description: "Filtra documentos con operador de comparación",
  },
  {
    title: "🔍 SELECT con WHERE - Múltiples condiciones",
    sql: "SELECT * FROM users WHERE age >= 18 AND status = 'active'",
    description: "Filtra con AND (todos los documentos que cumplen ambas)",
  },
  {
    title: "🔍 SELECT con WHERE - OR",
    sql: "SELECT * FROM users WHERE status = 'active' OR status = 'pending'",
    description: "Filtra con OR (documentos que cumplen una u otra condición)",
  },
  {
    title: "📊 SELECT con LIMIT",
    sql: "SELECT * FROM users LIMIT 5",
    description: "Limita el número de documentos retornados",
  },
  {
    title: "📊 SELECT con WHERE y LIMIT",
    sql: "SELECT name, age FROM users WHERE age >= 18 LIMIT 10",
    description: "Proyección, filtro y límite combinados",
  },
  {
    title: "🔗 SELECT con LIKE",
    sql: "SELECT * FROM users WHERE email LIKE '%@gmail.com'",
    description: "Búsqueda con patrón usando LIKE",
  },
  {
    title: "📋 SELECT con IN",
    sql: "SELECT * FROM products WHERE category IN ('electronics', 'books', 'clothing')",
    description: "Filtra por múltiples valores en un campo",
  },

  // ================== INSERT QUERIES ==================
  {
    title: "➕ INSERT Simple",
    sql: "INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 30)",
    description: "Inserta un documento con valores específicos",
  },
  {
    title: "➕ INSERT con múltiples campos",
    sql: "INSERT INTO users (name, email, age, status, created_at) VALUES ('Jane Smith', 'jane@example.com', 28, 'active', '2026-09-21')",
    description: "Inserta documento con más campos",
  },
  {
    title: "➕ INSERT múltiples documentos",
    sql: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com'), ('Bob', 'bob@example.com'), ('Charlie', 'charlie@example.com')",
    description: "Inserta múltiples documentos en una sola operación",
  },
  {
    title: "➕ INSERT con valores numéricos",
    sql: "INSERT INTO products (name, price, quantity, rating) VALUES ('Laptop', 999.99, 5, 4.5)",
    description: "Inserta documento con valores numéricos",
  },

  // ================== UPDATE QUERIES ==================
  {
    title: "✏️ UPDATE con WHERE - Un campo",
    sql: "UPDATE users SET status = 'inactive' WHERE id = 1",
    description: "Actualiza un documento por ID (updateOne)",
  },
  {
    title: "✏️ UPDATE con WHERE - Múltiples campos",
    sql: "UPDATE users SET status = 'active', last_login = '2026-09-21' WHERE email = 'john@example.com'",
    description:
      "Actualiza múltiples campos en documentos que cumplen condición",
  },
  {
    title: "✏️ UPDATE con WHERE - Múltiples documentos",
    sql: "UPDATE products SET discount = 10 WHERE price > 500",
    description: "Actualiza múltiples documentos (updateMany)",
  },
  {
    title: "✏️ UPDATE sin WHERE",
    sql: "UPDATE users SET status = 'archived'",
    description: "Actualiza TODOS los documentos de la colección",
  },

  // ================== DELETE QUERIES ==================
  {
    title: "🗑️ DELETE con WHERE - Un documento",
    sql: "DELETE FROM users WHERE id = 1",
    description: "Elimina un documento por ID (deleteOne)",
  },
  {
    title: "🗑️ DELETE con WHERE - Múltiples documentos",
    sql: "DELETE FROM users WHERE age < 18",
    description:
      "Elimina múltiples documentos que cumplen condición (deleteMany)",
  },
  {
    title: "🗑️ DELETE con WHERE - Múltiples condiciones",
    sql: "DELETE FROM users WHERE status = 'inactive' AND created_at < '2023-01-01'",
    description: "Elimina documentos con múltiples criterios",
  },
  {
    title: "🗑️ DELETE con IN",
    sql: "DELETE FROM products WHERE id IN (1, 5, 10)",
    description: "Elimina documentos cuyo ID está en lista",
  },
  {
    title: "⚠️ DELETE sin WHERE",
    sql: "DELETE FROM users",
    description: "⚠️ Elimina TODOS los documentos de la colección (deleteMany)",
  },

  // ================== JOIN QUERIES ==================
  {
    title: "🔗 INNER JOIN Simple",
    sql: "SELECT u.name, o.order_id FROM users u INNER JOIN orders o ON u.id = o.user_id",
    description: "Join interno entre usuarios y órdenes",
  },
  {
    title: "🔗 LEFT JOIN",
    sql: "SELECT u.name, o.order_id FROM users u LEFT JOIN orders o ON u.id = o.user_id",
    description: "Join izquierdo: todos los usuarios + órdenes si existen",
  },
  {
    title: "🔗 RIGHT JOIN",
    sql: "SELECT u.name, o.order_id FROM users u RIGHT JOIN orders o ON u.id = o.user_id",
    description: "Join derecho: todas las órdenes + usuarios si existen",
  },
  {
    title: "🔗 JOIN con WHERE",
    sql: "SELECT u.name, o.total FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.total > 100",
    description: "Join con filtro adicional",
  },
  {
    title: "🔗 JOIN con LIMIT",
    sql: "SELECT u.name, o.order_date FROM users u INNER JOIN orders o ON u.id = o.user_id LIMIT 5",
    description: "Join con límite de resultados",
  },
  {
    title: "🔗 Múltiples JOINs",
    sql: "SELECT u.name, o.order_id, p.product_name FROM users u INNER JOIN orders o ON u.id = o.user_id INNER JOIN products p ON o.product_id = p.id",
    description: "Múltiples joins encadenados",
  },

  // ================== ORDER BY QUERIES ==================
  {
    title: "⬆️ SELECT con ORDER BY - ASC (Ascendente)",
    sql: "SELECT * FROM users ORDER BY name ASC",
    description: "Ordena documentos alfabéticamente por nombre (A-Z)",
  },
  {
    title: "⬇️ SELECT con ORDER BY - DESC (Descendente)",
    sql: "SELECT * FROM users ORDER BY age DESC",
    description: "Ordena documentos por edad de mayor a menor",
  },
  {
    title: "⬆️⬇️ SELECT con ORDER BY - Múltiples campos",
    sql: "SELECT * FROM users ORDER BY status ASC, name DESC",
    description:
      "Ordena primero por status, luego por nombre dentro de cada status",
  },
  {
    title: "🔍⬇️ SELECT con WHERE y ORDER BY",
    sql: "SELECT name, salary FROM employees WHERE department = 'sales' ORDER BY salary DESC",
    description: "Filtra empleados de ventas y ordena por salario descendente",
  },
  {
    title: "📊⬇️ SELECT con ORDER BY y LIMIT",
    sql: "SELECT * FROM products ORDER BY price DESC LIMIT 10",
    description: "Top 10 productos más caros",
  },
  {
    title: "📊⬆️ SELECT con ORDER BY y LIMIT - Menor valor",
    sql: "SELECT * FROM products ORDER BY price ASC LIMIT 5",
    description: "Los 5 productos más baratos",
  },
  {
    title: "🔗⬇️ JOIN con ORDER BY",
    sql: "SELECT u.name, o.total, o.order_date FROM users u INNER JOIN orders o ON u.id = o.user_id ORDER BY o.order_date DESC",
    description: "Orders ordenadas por fecha más reciente primero",
  },
  {
    title: "🔍⬆️⬇️ SELECT con WHERE, ORDER BY múltiple y LIMIT",
    sql: "SELECT name, age, score FROM students WHERE age >= 18 ORDER BY score DESC, name ASC LIMIT 20",
    description:
      "Filtra mayores de edad, ordena por mejor score luego alfabéticamente, top 20",
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
