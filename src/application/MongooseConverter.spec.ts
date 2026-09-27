/**
 * Tests para Mongoose Converter
 * Verifica las conversiones de queries MongoDB a queries compatibles con Mongoose
 * Cubre: SELECT, INSERT, UPDATE, DELETE y JOIN queries en formato Mongoose
 */
import { test, describe } from "node:test";
import { equal, ok } from "node:assert";
import { mongooseConverter } from "./MongooseConverter.ts";

describe("MongooseConverter", () => {
  describe("SELECT operations (find queries)", () => {
    test("should convert simple find query without projection", () => {
      const mongoResult = {
        collection: "users",
        queryType: "find",
        pipeline: [{ $match: {} }, { $project: {} }],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.find"));
      ok(result.includes("{}"));
      ok(result.includes("await"));
    });

    test("should convert find query with match condition", () => {
      const mongoResult = {
        collection: "users",
        queryType: "find",
        pipeline: [{ $match: { age: { $gt: 18 } } }, { $project: {} }],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.find"));
      ok(result.includes("$gt"));
      ok(result.includes("18"));
    });

    test("should convert find query with projection", () => {
      const mongoResult = {
        collection: "users",
        queryType: "find",
        pipeline: [{ $match: {} }, { $project: { name: 1, email: 1 } }],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.find"));
      ok(result.includes("name"));
      ok(result.includes("email"));
    });

    test("should convert find query with match and projection", () => {
      const mongoResult = {
        collection: "products",
        queryType: "find",
        pipeline: [
          { $match: { price: { $gt: 100 } } },
          { $project: { name: 1, price: 1 } },
        ],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("products.find"));
      ok(result.includes("$gt"));
      ok(result.includes("price"));
      ok(result.includes("name"));
    });
  });

  describe("SELECT operations (aggregate queries with JOINs)", () => {
    test("should convert simple aggregate with single lookup", () => {
      const mongoResult = {
        collection: "users",
        queryType: "find",
        pipeline: [
          {
            $lookup: {
              from: "orders",
              localField: "id",
              foreignField: "user_id",
              as: "orders",
            },
          },
          { $project: { name: 1, orders: 1 } },
        ],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.aggregate"));
      ok(result.includes("$lookup"));
      ok(result.includes("orders"));
    });

    test("should convert aggregate with multiple lookups", () => {
      const mongoResult = {
        collection: "users",
        queryType: "find",
        pipeline: [
          {
            $lookup: {
              from: "orders",
              localField: "id",
              foreignField: "user_id",
              as: "o",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: "product_id",
              foreignField: "id",
              as: "p",
            },
          },
          { $unwind: { path: "$p", preserveNullAndEmptyArrays: false } },
          { $project: { name: 1, order_id: 1, product_name: 1 } },
        ],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.aggregate"));
      ok(result.includes("$lookup"));
      ok(result.includes("$unwind"));
      ok(result.includes("preserveNullAndEmptyArrays"));
    });

    test("should convert aggregate with lookup and match", () => {
      const mongoResult = {
        collection: "users",
        queryType: "find",
        pipeline: [
          {
            $lookup: {
              from: "orders",
              localField: "id",
              foreignField: "user_id",
              as: "orders",
            },
          },
          { $match: { status: { $eq: "completed" } } },
          { $project: { name: 1, orders: 1 } },
        ],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.aggregate"));
      ok(result.includes("$lookup"));
      ok(result.includes("$match"));
      ok(result.includes("completed"));
    });

    test("should convert aggregate with lookup and limit", () => {
      const mongoResult = {
        collection: "users",
        queryType: "find",
        pipeline: [
          {
            $lookup: {
              from: "orders",
              localField: "id",
              foreignField: "user_id",
              as: "orders",
            },
          },
          { $limit: 10 },
        ],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.aggregate"));
      ok(result.includes("$lookup"));
      ok(result.includes("$limit"));
      ok(result.includes("10"));
    });
  });

  describe("INSERT operations", () => {
    test("should convert insertOne operation", () => {
      const mongoResult = {
        collection: "users",
        operation: "insertOne",
        documents: { name: "John", email: "john@example.com" },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.insertOne"));
      ok(result.includes("John"));
      ok(result.includes("john@example.com"));
      ok(result.includes("await"));
    });

    test("should convert insertMany operation", () => {
      const mongoResult = {
        collection: "users",
        operation: "insertMany",
        documents: [
          { name: "John", email: "john@example.com" },
          { name: "Jane", email: "jane@example.com" },
        ],
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.insertMany"));
      ok(result.includes("John"));
      ok(result.includes("Jane"));
      ok(result.includes("await"));
    });

    test("should convert insertOne with numeric values", () => {
      const mongoResult = {
        collection: "products",
        operation: "insertOne",
        documents: { name: "Widget", price: 29.99, stock: 100 },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("products.insertOne"));
      ok(result.includes("Widget"));
      ok(result.includes("29.99"));
      ok(result.includes("100"));
    });
  });

  describe("UPDATE operations", () => {
    test("should convert updateOne operation", () => {
      const mongoResult = {
        collection: "users",
        operation: "updateOne",
        filter: { id: 1 },
        update: { $set: { name: "Jane" } },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.updateOne"));
      ok(result.includes("$set"));
      ok(result.includes("Jane"));
      ok(result.includes("await"));
    });

    test("should convert updateMany operation", () => {
      const mongoResult = {
        collection: "users",
        operation: "updateMany",
        filter: { age: { $lt: 18 } },
        update: { $set: { status: "minor" } },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.updateMany"));
      ok(result.includes("$set"));
      ok(result.includes("minor"));
    });

    test("should convert updateOne with multiple set fields", () => {
      const mongoResult = {
        collection: "users",
        operation: "updateOne",
        filter: { id: 1 },
        update: { $set: { name: "Jane", age: 30, status: "active" } },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.updateOne"));
      ok(result.includes("Jane"));
      ok(result.includes("30"));
      ok(result.includes("active"));
    });

    test("should convert updateMany with complex filter", () => {
      const mongoResult = {
        collection: "users",
        operation: "updateMany",
        filter: { $and: [{ age: { $lt: 18 } }, { country: "US" }] },
        update: { $set: { verified: false } },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.updateMany"));
      ok(result.includes("$and"));
      ok(result.includes("verified"));
    });
  });

  describe("DELETE operations", () => {
    test("should convert deleteOne operation", () => {
      const mongoResult = {
        collection: "users",
        operation: "deleteOne",
        filter: { id: 1 },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.deleteOne"));
      ok(result.includes("await"));
    });

    test("should convert deleteMany operation", () => {
      const mongoResult = {
        collection: "users",
        operation: "deleteMany",
        filter: { $or: [{ age: { $lt: 18 } }, { status: "banned" }] },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.deleteMany"));
      ok(result.includes("$or"));
    });

    test("should convert deleteOne with simple condition", () => {
      const mongoResult = {
        collection: "logs",
        operation: "deleteMany",
        filter: {},
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("logs.deleteMany"));
      ok(result.includes("{}"));
    });

    test("should convert deleteMany with IN operator", () => {
      const mongoResult = {
        collection: "users",
        operation: "deleteMany",
        filter: { id: { $in: [1, 2, 3] } },
      };

      const result = mongooseConverter.convert(mongoResult);

      ok(result.includes("users.deleteMany"));
      ok(result.includes("$in"));
      ok(result.includes("1"));
      ok(result.includes("2"));
      ok(result.includes("3"));
    });
  });

  describe("Error handling", () => {
    test("should return empty string for unknown operation", () => {
      const mongoResult = {
        collection: "users",
        operation: "unknownOp",
      };

      const result = mongooseConverter.convert(mongoResult);

      equal(result, "");
    });

    test("should handle missing queryType and operation", () => {
      const mongoResult = {
        collection: "users",
        pipeline: [],
      };

      const result = mongooseConverter.convert(mongoResult);

      // Should return empty string for unrecognized input
      equal(result, "");
    });
  });

  describe("Output format validation", () => {
    test("should include await keyword in all operations", () => {
      const findResult = mongooseConverter.convert({
        collection: "users",
        queryType: "find",
        pipeline: [{ $match: {} }, { $project: {} }],
      });

      const insertResult = mongooseConverter.convert({
        collection: "users",
        operation: "insertOne",
        documents: { name: "John" },
      });

      const updateResult = mongooseConverter.convert({
        collection: "users",
        operation: "updateOne",
        filter: { id: 1 },
        update: { $set: { name: "Jane" } },
      });

      const deleteResult = mongooseConverter.convert({
        collection: "users",
        operation: "deleteOne",
        filter: { id: 1 },
      });

      ok(findResult.includes("await"));
      ok(insertResult.includes("await"));
      ok(updateResult.includes("await"));
      ok(deleteResult.includes("await"));
    });

    test("should format JSON with proper indentation", () => {
      const mongoResult = {
        collection: "users",
        operation: "insertOne",
        documents: { name: "John", email: "john@example.com" },
      };

      const result = mongooseConverter.convert(mongoResult);

      // JSON.stringify with null, 2 adds newlines and indentation
      ok(result.includes("\n"));
    });
  });
});
