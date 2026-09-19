/**
 * Tests para verificar las conversiones SQL a MongoDB
 */
import { test, describe } from "node:test";
import { equal, ok, throws } from "node:assert";
import { mongoConverter } from "../application/MongoConverter.ts";

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
  });

  describe("INSERT queries", () => {
    test("should convert INSERT query", () => {
      const sql =
        "INSERT INTO users (name, email) VALUES ('John', 'john@example.com')";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "insertOne");
    });
  });

  describe("UPDATE queries", () => {
    test("should convert UPDATE query", () => {
      const sql = 'UPDATE users SET name = "Jane" WHERE id = 1';
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "updateOne");
      ok(result.update.$set);
    });
  });

  describe("DELETE queries", () => {
    test("should convert DELETE query", () => {
      const sql = "DELETE FROM users WHERE id = 1";
      const result = mongoConverter.convert(sql);

      equal(result.collection, "users");
      equal(result.operation, "deleteOne");
    });
  });

  describe("Error handling", () => {
    test("should throw on unsupported query type", () => {
      const sql = "GRANT SELECT ON users TO john";

      throws(() => mongoConverter.convert(sql), /Unsupported SQL statement/);
    });
  });
});
