/**
 * Servicio principal de conversión
 * La conversión de queries MongoDB a queries compatibles con Mongoose
 */

class MongooseConverter {
  convert(mongoResult: Record<string, any>): string {
    const {
      collection,
      queryType,
      pipeline,
      operation,
      filter,
      update,
      documents,
    } = mongoResult;

    const formattedFilter = JSON.stringify(filter, null, 2);
    const formattedInsert = JSON.stringify(documents, null, 2);
    const formattedUpdate = JSON.stringify(update, null, 2);

    // SELECT OPERATIONS
    if (queryType === "aggregation" || queryType === "find") {
      const hasLookup: boolean = pipeline.some((stage: any) => stage.$lookup);
      const hasGroup: boolean = pipeline.some((stage: any) => stage.$group);

      if (queryType === "aggregation" || hasLookup || hasGroup) {
        const formattedPipeline = JSON.stringify(pipeline, null, 2);
        return `await ${collection}.aggregate(${formattedPipeline})`;
      }

      const match = pipeline[0]?.$match || {};
      const formattedMatch = JSON.stringify(match, null, 2);
      const project = pipeline.find((p: any) => p.$project)?.$project || {};

      if (Object.keys(project).length > 0) {
        return `await ${collection}.find(${formattedMatch}, ${JSON.stringify(project, null, 2)})`;
      }
      return `await ${collection}.find(${formattedMatch})`;
    }

    switch (operation) {
      // INSERT OPERATIONS
      case "insertOne":
        return `await ${collection}.insertOne(${formattedInsert})`;
      case "insertMany":
        return `await ${collection}.insertMany(${formattedInsert})`;
      // UPDATE OPERATIONS
      case "updateOne":
        return `await ${collection}.updateOne(${formattedFilter}, ${formattedUpdate})`;
      case "updateMany":
        return `await ${collection}.updateMany(${formattedFilter}, ${formattedUpdate})`;
      // DELETE OPERATIONS
      case "deleteOne":
        return `await ${collection}.deleteOne(${formattedFilter})`;
      case "deleteMany":
        return `await ${collection}.deleteMany(${formattedFilter})`;
      default:
        return "";
    }
  }
}

export const mongooseConverter = new MongooseConverter();
