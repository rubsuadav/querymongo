/**
 * Tests para Query Utilities
 * Verifica las funciones auxiliares para construir filtros, proyecciones y operaciones
 */
import { test, describe } from "node:test";
import { equal, ok, deepEqual } from "node:assert";
import {
  buildFilter,
  buildProjection,
  removeUndefinedFields,
  extractSelectColumns,
  determineOperation,
} from "../utils/queryUtils.ts";

describe("Query Utilities - buildFilter", () => {
  test("should handle simple equality filter", () => {
    const condition = {
      operator: "=",
      left: { column: "id" },
      right: { value: 1 },
    };
    const filter = buildFilter(condition);

    ok(filter.id?.$eq === 1 || filter.id === 1);
  });

  test("should handle inequality operators", () => {
    const conditions = [
      { op: "!=", expected: "$ne" },
      { op: "<>", expected: "$ne" },
      { op: "<", expected: "$lt" },
      { op: ">", expected: "$gt" },
      { op: "<=", expected: "$lte" },
      { op: ">=", expected: "$gte" },
    ];

    conditions.forEach(({ op, expected }) => {
      const condition = {
        operator: op,
        left: { column: "age" },
        right: { value: 18 },
      };
      const filter = buildFilter(condition);
      ok(filter.age?.[expected] !== undefined);
    });
  });

  test("should handle AND operator", () => {
    const condition = {
      operator: "AND",
      left: { operator: "=", left: { column: "id" }, right: { value: 1 } },
      right: {
        operator: "=",
        left: { column: "status" },
        right: { value: "active" },
      },
    };
    const filter = buildFilter(condition);

    ok(filter.$and && Array.isArray(filter.$and));
    equal(filter.$and.length, 2);
  });

  test("should handle OR operator", () => {
    const condition = {
      operator: "OR",
      left: { operator: "=", left: { column: "id" }, right: { value: 1 } },
      right: { operator: "=", left: { column: "id" }, right: { value: 2 } },
    };
    const filter = buildFilter(condition);

    ok(filter.$or && Array.isArray(filter.$or));
    equal(filter.$or.length, 2);
  });

  test("should handle IN operator", () => {
    const condition = {
      operator: "in",
      left: { column: "status" },
      right: { value: [1, 2, 3] },
    };
    const filter = buildFilter(condition);

    ok(filter.status?.$in);
  });

  test("should handle LIKE operator", () => {
    const condition = {
      operator: "like",
      left: { column: "name" },
      right: { value: "%john%" },
    };
    const filter = buildFilter(condition);

    ok(filter.name?.$regex);
  });

  test("should return empty filter for null condition", () => {
    const filter = buildFilter(null);
    deepEqual(filter, {});
  });

  test("should normalize field names (remove quotes)", () => {
    const condition = {
      operator: "=",
      left: { column: '"email"' },
      right: { value: "test@example.com" },
    };
    const filter = buildFilter(condition);

    ok(filter.email !== undefined);
  });
});

describe("Query Utilities - buildProjection", () => {
  test("should return empty object for wildcard", () => {
    const projection = buildProjection("*");
    deepEqual(projection, {});
  });

  test("should build projection for specific columns", () => {
    const projection = buildProjection(["id", "name", "email"]);

    ok(projection.id === 1);
    ok(projection.name === 1);
    ok(projection.email === 1);
  });

  test("should normalize field names in projection", () => {
    const projection = buildProjection(["`id`", '"name"', "email"]);

    ok(projection.id === 1 || projection["`id`"]);
    ok(projection.email === 1);
  });

  test("should handle qualified field names", () => {
    const projection = buildProjection(["users.id", "users.name"]);

    // Should extract the field part after the dot
    ok(projection.id === 1 || projection.name === 1);
  });
});

describe("Query Utilities - extractSelectColumns", () => {
  test("should return wildcard if no columns provided", () => {
    //@ts-expect-error null is not a valid argument for extractSelectColumns but is used here for testing purposes
    const columns = extractSelectColumns(null);
    deepEqual(columns, ["*"]);
  });

  test("should extract column names from array", () => {
    const columns = [{ expr: { column: "id" } }, { expr: { column: "name" } }];
    const result = extractSelectColumns(columns);

    ok(result.includes("id"));
    ok(result.includes("name"));
  });

  test("should handle object columns without expr property", () => {
    const columns = ["id", "name", "email"];
    const result = extractSelectColumns(columns);

    equal(result.length, 3);
  });

  test("should handle mixed column formats", () => {
    const columns = [
      { expr: { column: "id" } },
      "name",
      { expr: { value: "email" } },
    ];
    const result = extractSelectColumns(columns);

    ok(result.length >= 2);
  });
});

describe("Query Utilities - determineOperation", () => {
  test("should return One operation for unique fields with equality", () => {
    const where = {
      operator: "=",
      left: { column: "id" },
      right: { value: 1 },
    };
    const result = determineOperation(where, {
      one: "deleteOne",
      many: "deleteMany",
    });

    equal(result, "deleteOne");
  });

  test("should return One operation for email with equality", () => {
    const where = {
      operator: "=",
      left: { column: "email" },
      right: { value: "test@example.com" },
    };
    const result = determineOperation(where, {
      one: "updateOne",
      many: "updateMany",
    });

    equal(result, "updateOne");
  });

  test("should return Many operation for non-unique fields with equality", () => {
    const where = {
      operator: "=",
      left: { column: "status" },
      right: { value: "active" },
    };
    const result = determineOperation(where, {
      one: "deleteOne",
      many: "deleteMany",
    });

    equal(result, "deleteMany");
  });

  test("should return Many operation for AND conditions", () => {
    const where = {
      operator: "AND",
      left: { operator: "=", left: { column: "id" }, right: { value: 1 } },
      right: {
        operator: "=",
        left: { column: "status" },
        right: { value: "active" },
      },
    };
    const result = determineOperation(where, {
      one: "deleteOne",
      many: "deleteMany",
    });

    equal(result, "deleteMany");
  });

  test("should return Many operation for comparison operators", () => {
    const operators = [">", "<", ">=", "<=", "!=", "<>", "like"];

    operators.forEach((op) => {
      const where = {
        operator: op,
        left: { column: "age" },
        right: { value: 18 },
      };
      const result = determineOperation(where, {
        one: "updateOne",
        many: "updateMany",
      });

      equal(result, "updateMany");
    });
  });

  test("should return Many for null/no WHERE clause", () => {
    const result1 = determineOperation(null, {
      one: "deleteOne",
      many: "deleteMany",
    });

    const result2 = determineOperation(undefined as any, {
      one: "updateOne",
      many: "updateMany",
    });

    equal(result1, "deleteMany");
    equal(result2, "updateMany");
  });
});

describe("Query Utilities - removeUndefinedFields", () => {
  test("should remove undefined fields from object", () => {
    const obj = {
      name: "John",
      email: undefined,
      age: 30,
      status: undefined,
    };
    const result = removeUndefinedFields(obj);

    ok(result.name);
    ok(result.age);
    ok(!result.email);
    ok(!result.status);
  });

  test("should preserve null and falsy values", () => {
    const obj = {
      name: "John",
      verified: false,
      count: 0,
      notes: null,
      empty: undefined,
    };
    const result = removeUndefinedFields(obj);

    ok(result.verified === false);
    ok(result.count === 0);
    ok(result.notes === null);
    ok(!result.empty);
  });

  test("should return empty object if all fields undefined", () => {
    const obj = { a: undefined, b: undefined };
    const result = removeUndefinedFields(obj);

    deepEqual(result, {});
  });
});
