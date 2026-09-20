/**
 * Tests para MongoDB Converter
 * Verifica las conversiones SQL a MongoDB para todos los tipos de queries
 * Cubre: SELECT, INSERT, UPDATE, DELETE y JOIN queries
 */
import { test, describe } from "node:test";
import { equal, ok, throws, deepEqual } from "node:assert";
import { mongoConverter } from "./MongoConverter.ts";

describe("MongoConverter", () => {
  describe("SELECT queries", () => {
    test("should convert simple SELECT query", () => {
      const sql = "SELECT name, email FROM users";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      ok(result.pipeline.some((stage: any) => stage.$project));
    });

    test("should convert SELECT with WHERE clause", () => {
      const sql = "SELECT * FROM users WHERE id = 1";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      ok(result.pipeline.some((stage: any) => stage.$match));
    });

    test("should convert SELECT with LIMIT", () => {
      const sql = "SELECT name FROM products LIMIT 10";
      const result = mongoConverter.convert(sql);

      ok(result.pipeline.some((stage: any) => stage.$limit === 10));
    });

    test("should convert SELECT with WHERE and LIMIT", () => {
      const sql = "SELECT name, price FROM products WHERE price > 100 LIMIT 5";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "products");
      ok(result.pipeline.some((stage: any) => stage.$match));
      ok(result.pipeline.some((stage: any) => stage.$limit === 5));
    });

    test("should convert SELECT with multiple WHERE conditions", () => {
      const sql = "SELECT * FROM users WHERE age > 18 AND status = 'active'";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      const matchStage = result.pipeline.find((s: any) => s.$match);
      ok(matchStage?.$match?.$and);
    });

    test("should handle SELECT without explicit columns", () => {
      const sql = "SELECT * FROM products";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "products");
      const projectStage = result.pipeline.find((s: any) => s.$project);

      // When selecting *, $project should either not exist or be empty
      ok(!projectStage || Object.keys(projectStage.$project).length === 0);
    });

    test("should handle SELECT with backtick-quoted columns", () => {
      const sql = "SELECT `id`, `name` FROM users";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      const projectStage = result.pipeline.find((s: any) => s.$project);
      ok(projectStage?.$project?.id || projectStage?.$project?.name);
    });
  });

  describe("INSERT queries", () => {
    test("should convert INSERT query", () => {
      const sql =
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "insertOne");
      ok(result.documents);
    });

    test("should convert INSERT with multiple rows as insertMany", () => {
      const sql =
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com'), ('Jane', 'jane@example.com')";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "insertMany");
      ok(Array.isArray(result.documents));
    });

    test("should convert INSERT with numeric values", () => {
      const sql =
        "INSERT INTO products (name, price, stock) VALUES ('Widget', 29.99, 100)";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "products");
      equal(result.operation, "insertOne");
      ok(result.documents);
    });
  });

  describe("UPDATE queries", () => {
    test("should convert UPDATE query with WHERE", () => {
      const sql = 'UPDATE users SET name = "Jane" WHERE id = 1';
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "updateOne");
      ok(result.update.$set);
      ok(result.filter);
    });

    test("should convert UPDATE with multiple SET fields", () => {
      const sql =
        'UPDATE users SET name = "Jane", age = 30, status = "active" WHERE id = 1';
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "updateOne");
      ok(result.update.$set.name);
      ok(result.update.$set.age);
      ok(result.update.$set.status);
    });

    test("should convert UPDATE with multiple WHERE conditions as updateMany", () => {
      const sql =
        'UPDATE users SET status = "inactive" WHERE age < 18 AND country = "US"';
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "updateMany");
      ok(result.filter.$and);
    });

    test("should convert UPDATE without WHERE as updateMany", () => {
      const sql = "UPDATE users SET verified = true";
      const result = mongoConverter.convert(sql);

      equal(result.operation, "updateMany");
      deepEqual(result.filter, {});
    });
  });

  describe("DELETE queries", () => {
    test("should convert DELETE query", () => {
      const sql = "DELETE FROM users WHERE id = 1";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "deleteOne");
    });

    test("should convert DELETE with multiple conditions as deleteMany", () => {
      const sql = "DELETE FROM users WHERE age < 18 OR status = 'banned'";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "deleteMany");
      ok(result.filter.$or);
    });

    test("should convert DELETE without WHERE as deleteMany", () => {
      const sql = "DELETE FROM logs";
      const result = mongoConverter.convert(sql);

      equal(result.operation, "deleteMany");
      deepEqual(result.filter, {});
    });

    test("should convert DELETE with IN operator", () => {
      const sql = "DELETE FROM users WHERE id IN (1, 2, 3)";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      ok(result.filter.id?.$in);
    });
  });

  describe("JOIN queries", () => {
    test("should convert INNER JOIN query", () => {
      const sql =
        "SELECT u.id, u.name, o.order_id FROM users u INNER JOIN orders o ON u.id = o.user_id";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      ok(result.pipeline.some((stage: any) => stage.$lookup));
      ok(result.pipeline.some((stage: any) => stage.$unwind));
    });

    test("should convert LEFT JOIN query", () => {
      const sql =
        "SELECT u.name, o.order_id FROM users u LEFT JOIN orders o ON u.id = o.user_id";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      const unwindStage = result.pipeline.find((s: any) => s.$unwind);
      ok(unwindStage?.$unwind?.preserveNullAndEmptyArrays);
    });

    test("should convert JOIN with WHERE clause", () => {
      const sql =
        "SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id WHERE o.status = 'completed'";
      const result = mongoConverter.convert(sql);

      ok(result.pipeline.some((stage: any) => stage.$match));
      const matchStage = result.pipeline.find((s: any) => s.$match);
      ok(matchStage?.$match?.status);
    });

    test("should convert JOIN with LIMIT", () => {
      const sql =
        "SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id LIMIT 10";
      const result = mongoConverter.convert(sql);

      ok(result.pipeline.some((stage: any) => stage.$limit === 10));
    });

    test("should convert multiple JOINs", () => {
      const sql =
        "SELECT u.name, o.id, p.name FROM users u INNER JOIN orders o ON u.id = o.user_id INNER JOIN products p ON o.product_id = p.id";
      const result = mongoConverter.convert(sql);

      const lookupStages = result.pipeline.filter((s: any) => s.$lookup);
      ok(lookupStages.length >= 2);
    });
  });

  describe("Error handling", () => {
    test("should throw on unsupported query type", () => {
      const sql = "GRANT SELECT ON users TO john";

      throws(() => mongoConverter.convert(sql), /Unsupported SQL statement/);
    });

    test("should throw on unsupported REVOKE query", () => {
      const sql = "REVOKE SELECT ON users FROM john";

      // Parser may throw SyntaxError or our converter throws "Unsupported"
      throws(() => mongoConverter.convert(sql));
    });
  });
});
