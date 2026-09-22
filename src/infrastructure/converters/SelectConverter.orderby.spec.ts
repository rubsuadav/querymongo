/**
 * Tests para ORDER BY en SelectConverter
 * Valida la conversión de ORDER BY SQL a operador $sort de MongoDB
 */
import { describe, it } from "node:test";
import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { mongoConverter } from "../../application/MongoConverter.ts";

describe("SelectConverter - ORDER BY Support", () => {
  it("should convert simple ORDER BY ASC ", () => {
    const sql = "SELECT * FROM users ORDER BY name ASC";
    const result = mongoConverter.convert(sql);

    ok(result.pipeline);
    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    deepStrictEqual(sortStage, { $sort: { name: 1 } });
  });

  it("should convert simple ORDER BY DESC", () => {
    const sql = "SELECT * FROM users ORDER BY age DESC";
    const result = mongoConverter.convert(sql);

    ok(result.pipeline);
    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    deepStrictEqual(sortStage, { $sort: { age: -1 } });
  });

  it("should convert ORDER BY with multiple fields", () => {
    const sql = "SELECT * FROM users ORDER BY status ASC, name DESC";
    const result = mongoConverter.convert(sql);

    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    deepStrictEqual(sortStage, { $sort: { status: 1, name: -1 } });
  });

  it("should combine WHERE and ORDER BY correctly", () => {
    const sql =
      "SELECT * FROM employees WHERE department = 'sales' ORDER BY salary DESC";
    const result = mongoConverter.convert(sql);

    const matchStage = result.pipeline.find((stage: any) => "$match" in stage);
    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);

    ok(matchStage);
    deepStrictEqual(sortStage, { $sort: { salary: -1 } });
  });

  it("should combine ORDER BY and LIMIT correctly", () => {
    const sql = "SELECT * FROM products ORDER BY price DESC LIMIT 10";
    const result = mongoConverter.convert(sql);

    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    const limitStage = result.pipeline.find((stage: any) => "$limit" in stage);

    deepStrictEqual(sortStage, { $sort: { price: -1 } });
    deepStrictEqual(limitStage, { $limit: 10 });

    // Verificar que $sort viene antes de $limit
    const sortIndex = result.pipeline.findIndex(
      (stage: any) => "$sort" in stage,
    );
    const limitIndex = result.pipeline.findIndex(
      (stage: any) => "$limit" in stage,
    );
    ok(sortIndex < limitIndex, "$sort should come before $limit");
  });

  it("should handle complex queries: WHERE + ORDER BY (multiple) + LIMIT", () => {
    const sql =
      "SELECT name, score FROM students WHERE age >= 18 ORDER BY score DESC, name ASC LIMIT 20";
    const result = mongoConverter.convert(sql);

    strictEqual(result.collection, "students");
    strictEqual(result.queryType, "aggregation");

    const matchStage = result.pipeline.find((stage: any) => "$match" in stage);
    const projectStage = result.pipeline.find(
      (stage: any) => "$project" in stage,
    );
    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    const limitStage = result.pipeline.find((stage: any) => "$limit" in stage);

    ok(matchStage);
    ok(projectStage);
    deepStrictEqual(sortStage, { $sort: { score: -1, name: 1 } });
    deepStrictEqual(limitStage, { $limit: 20 });
  });

  it("should omit $sort when there is no ORDER BY", () => {
    const sql = "SELECT * FROM users WHERE status = 'active'";
    const result = mongoConverter.convert(sql);

    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    strictEqual(
      sortStage,
      undefined,
      "There should be no $sort without ORDER BY",
    );
  });

  it("should handle fields with table alias in ORDER BY", () => {
    const sql = "SELECT u.name FROM users u ORDER BY u.name ASC";
    const result = mongoConverter.convert(sql);

    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    deepStrictEqual(sortStage, { $sort: { name: 1 } });
  });

  it("should preserve the pipeline order: MATCH -> PROJECT -> SORT -> LIMIT", () => {
    const sql =
      "SELECT name, email FROM users WHERE active = true ORDER BY created_at DESC LIMIT 50";
    const result = mongoConverter.convert(sql);

    const stages = result.pipeline.map((stage: any) => Object.keys(stage)[0]);
    ok(stages.includes("$match"));
    ok(stages.includes("$project"));
    ok(stages.includes("$sort"));
    ok(stages.includes("$limit"));

    const matchIdx = stages.indexOf("$match");
    const projectIdx = stages.indexOf("$project");
    const sortIdx = stages.indexOf("$sort");
    const limitIdx = stages.indexOf("$limit");

    ok(matchIdx < projectIdx, "$match should come before $project");
    ok(projectIdx < sortIdx, "$project should come before $sort");
    ok(sortIdx < limitIdx, "$sort should come before $limit");
  });

  it("should handle ORDER BY with table alias in complex queries", () => {
    const sql =
      "SELECT u.name, o.total, o.order_date FROM users u INNER JOIN orders o ON u.id = o.user_id ORDER BY o.order_date DESC";
    const result = mongoConverter.convert(sql);

    const sortStage = result.pipeline.find((stage: any) => "$sort" in stage);
    deepStrictEqual(sortStage, { $sort: { order_date: -1 } });
  });
});
