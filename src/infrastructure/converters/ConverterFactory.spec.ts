/**
 * Tests para ConverterFactory
 * Verifica el routing correcto a los converters apropiados según el tipo de query
 */
import { test, describe } from "node:test";
import { equal, ok } from "node:assert";
import { getConverter } from "./ConverterFactory.ts";

describe("ConverterFactory", () => {
  test("should return SelectConverter for SELECT queries", () => {
    const converter = getConverter("SELECT * FROM users");
    ok(converter);
    equal(converter?.can("SELECT * FROM users"), true);
  });

  test("should return CreateConverter for INSERT queries", () => {
    const converter = getConverter("INSERT INTO users (name) VALUES ('John')");
    ok(converter);
    equal(converter?.can("INSERT INTO users (name) VALUES ('John')"), true);
  });

  test("should return UpdateConverter for UPDATE queries", () => {
    const converter = getConverter('UPDATE users SET name = "Jane"');
    ok(converter);
    equal(converter?.can('UPDATE users SET name = "Jane"'), true);
  });

  test("should return DeleteConverter for DELETE queries", () => {
    const converter = getConverter("DELETE FROM users WHERE id = 1");
    ok(converter);
    equal(converter?.can("DELETE FROM users WHERE id = 1"), true);
  });

  test("should return JoinConverter for SELECT with INNER JOIN", () => {
    const converter = getConverter(
      "SELECT * FROM users u INNER JOIN orders o ON u.id = o.user_id",
    );
    ok(converter);
  });

  test("should return JoinConverter for SELECT with LEFT JOIN", () => {
    const converter = getConverter(
      "SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id",
    );
    ok(converter);
  });

  test("should return JoinConverter for SELECT with RIGHT JOIN", () => {
    const converter = getConverter(
      "SELECT * FROM users u RIGHT JOIN orders o ON u.id = o.user_id",
    );
    ok(converter);
  });

  test("should return null for unsupported query types", () => {
    const converter = getConverter("GRANT SELECT ON users TO john");
    equal(converter, null);
  });

  test("should prioritize JoinConverter over SelectConverter", () => {
    const converter = getConverter(
      "SELECT u.name FROM users u INNER JOIN orders o ON u.id = o.user_id",
    );
    // JoinConverter should be selected because it appears first in CONVERTERS array
    ok(
      converter?.can(
        "SELECT u.name FROM users u INNER JOIN orders o ON u.id = o.user_id",
      ),
    );
  });
});
