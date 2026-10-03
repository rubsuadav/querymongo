# QueryMongo 🚀

[![npm version](https://img.shields.io/npm/v/querymongo.svg)](https://www.npmjs.com/package/querymongo)
[![npm downloads](https://img.shields.io/npm/dm/querymongo.svg)](https://www.npmjs.com/package/querymongo)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Last Commit](https://img.shields.io/github/last-commit/rubsuadav/querymongo.svg)](https://github.com/rubsuadav/querymongo/commits)
[![Coverage Status](https://coveralls.io/repos/github/rubsuadav/querymongo/badge.svg?branch=main)](https://coveralls.io/github/rubsuadav/querymongo?branch=main)

SQL to MongoDB Query Converter CLI - Convierte queries SQL a MongoDB format de forma simple y poderosa.

## 📋 Características

✅ **Convertir SELECT queries** - Con proyecciones, filtros, LIKE, IN y límites  
✅ **Convertir INSERT queries** - Para inserción de documentos únicos o múltiples  
✅ **Convertir UPDATE queries** - Con filtros y actualizaciones en uno o muchos documentos  
✅ **Convertir DELETE queries** - Para eliminación con condiciones complejas  
✅ **Convertir JOIN queries** - INNER JOIN y LEFT JOIN entre colecciones  
✅ **Soporte para ORDER BY y sorting** - Permite ordenar resultados según múltiples campos y direcciones, aplica tanto en queries SELECT como en JOIN  
✅ **Soporte para agregaciones, GROUP BY y HAVING** - COUNT, SUM, AVG, MIN, MAX y filtros de grupos convertidos a `$group` y `$match`  
✅ **CLI interactiva** - Modo interactivo para pruebas rápidas  
✅ **API TypeScript** - Para uso como librería en tus proyectos

## 🏗️ Arquitectura

Proyecto implementado siguiendo **principios SOLID**, **Clean Code** y **DRY**:

```
src/
├── domain/
│   └── interfaces/
│       └── Converter.ts         # Interface strategy para conversores
├── infrastructure/
│   ├── parser/
│   │   └── sqlParser.ts         # Wrapper sobre node-sql-parser
│   ├── converters/
│   │   ├── SelectConverter.ts   # Estrategia SELECT
│   │   ├── CreateConverter.ts   # Estrategia INSERT
│   │   ├── UpdateConverter.ts   # Estrategia UPDATE
│   │   ├── DeleteConverter.ts   # Estrategia DELETE
│   │   ├── JoinConverter.ts     # Estrategia JOIN
│   │   └── ConverterFactory.ts  # Factory + Strategy Pattern
│   └── utils/
│       └── queryUtils.ts        # Utilidades compartidas (DRY)
├── application/
|   ├── MongooseConverter.ts     # Orquestador específico para Mongoose
│   └── MongoConverter.ts        # Orquestador principal
├── cli/
│   └── main.ts                  # Interfaz CLI
└── index.ts                     # Exports públicos
```

### Patrones Aplicados

- **Strategy Pattern**: Cada tipo de query (SELECT, INSERT, etc) es una estrategia diferente
- **Factory Pattern**: `ConverterFactory` selecciona la estrategia correcta
- **Dependency Inversion**: Se depende de la interface `IConverter`, no de implementaciones
- **Single Responsibility**: Cada conversor tiene un propósito único

## 💻 Uso

### 🚀 Instalación Global - CLI

Para instalar QueryMongo globalmente en tu máquina:

```bash
npm i querymongo -g
```

Luego ejecuta desde cualquier directorio:

```bash
querymongo
```

### 🛠️ Desarrollo Local

Para trabajar en el desarrollo del proyecto:

```bash
git clone https://github.com/rubsuadav/querymongo
cd querymongo
npm install
npm run dev
```

Esto abrirá la CLI interactiva donde puedes ingresar queries SQL y recibir instantáneamente el equivalente en MongoDB.

### 📦 Uso como Librería

```typescript
import { mongoConverter } from "querymongo";

const sql = "SELECT name, email FROM users WHERE age > 18";
const result = mongoConverter.convert(sql);
console.log(result);
```

## 📚 Ejemplos de Conversión

### SELECT - Casos Básicos

#### SELECT simple (todos los documentos)

```sql
SELECT * FROM users
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {}
    },
    {
      "$project": {}
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find({}, {});
```

#### SELECT con campos específicos

```sql
SELECT name, email FROM users
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {}
    },
    {
      "$project": {
        "name": 1,
        "email": 1
      }
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find({}, { name: 1, email: 1 });
```

### SELECT - Filtros y Condiciones

#### SELECT con WHERE simple

```sql
SELECT * FROM users WHERE status = 'active'
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {
        "status": {
          "$eq": "active"
        }
      }
    },
    {
      "$project": {}
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find({ status: { $eq: "active" } }, {});
```

#### SELECT con comparación

```sql
SELECT * FROM products WHERE price > 100
```

**Salida del Conversor:**

```json
{
  "collection": "products",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {
        "price": {
          "$gt": 100
        }
      }
    },
    {
      "$project": {}
    }
  ]
}
```

**Mongoose Query:**

```typescript
await products.find({ price: { $gt: 100 } }, {});
```

#### SELECT con múltiples condiciones (AND)

```sql
SELECT * FROM users WHERE age >= 18 AND status = 'active'
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {
        "$and": [
          {
            "age": {
              "$gte": 18
            }
          },
          {
            "status": {
              "$eq": "active"
            }
          }
        ]
      }
    },
    {
      "$project": {}
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find(
  { $and: [{ age: { $gte: 18 } }, { status: { $eq: "active" } }] },
  {},
);
```

#### SELECT con múltiples condiciones (OR)

```sql
SELECT * FROM users WHERE status = 'active' OR status = 'pending'
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {
        "$or": [
          {
            "status": {
              "$eq": "active"
            }
          },
          {
            "status": {
              "$eq": "pending"
            }
          }
        ]
      }
    },
    {
      "$project": {}
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find(
  { $or: [{ status: { $eq: "active" } }, { status: { $eq: "pending" } }] },
  {},
);
```

#### SELECT con LIKE (búsqueda por patrón)

```sql
SELECT * FROM users WHERE email LIKE '%@gmail.com'
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {
        "email": {
          "$regex": "%@gmail.com"
        }
      }
    },
    {
      "$project": {}
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find({ email: { $regex: "%@gmail.com" } }, {});
```

#### SELECT con IN

```sql
SELECT * FROM products WHERE category IN ('electronics', 'books', 'clothing')
```

**Salida del Conversor:**

```json
{
  "collection": "products",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {
        "category": {
          "$in": [
            {
              "type": "single_quote_string",
              "value": "electronics"
            },
            {
              "type": "single_quote_string",
              "value": "books"
            },
            {
              "type": "single_quote_string",
              "value": "clothing"
            }
          ]
        }
      }
    },
    {
      "$project": {}
    }
  ]
}
```

**Mongoose Query:**

```typescript
await products.find(
  { category: { $in: ["electronics", "books", "clothing"] } },
  {},
);
```

### SELECT - Proyecciones y Límites

#### SELECT con LIMIT

```sql
SELECT * FROM users LIMIT 5
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$match": {}
    },
    {
      "$project": {}
    },
    {
      "$limit": 5
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find({}, {}).limit(5);
```

#### SELECT con campos, filtro y límite

```sql
SELECT name, age FROM users WHERE age >= 18 LIMIT 10
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "aggregation",
  "pipeline": [
    {
      "$match": {
        "age": {
          "$gte": 18
        }
      }
    },
    {
      "$project": {
        "name": 1,
        "age": 1
      }
    },
    {
      "$limit": 10
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.find({ age: { $gte: 18 } }, { name: 1, age: 1 }).limit(10);
```

---

### AGGREGATIONS - Agregaciones y GROUP BY

Las funciones SQL `COUNT`, `SUM`, `AVG`, `MIN` y `MAX` se convierten en acumuladores de MongoDB dentro de una etapa `$group`. Cuando no existe `GROUP BY`, MongoDB usa `_id: null` y devuelve un único documento con los totales.

#### Agregaciones sin GROUP BY

```sql
SELECT SUM(runtime) AS totalRuntime,
       AVG(runtime) AS averageRuntime,
       MIN(runtime) AS minimumRuntime,
       MAX(runtime) AS maximumRuntime,
       COUNT(*) AS count
FROM movies
```

**Salida del Conversor:**

```json
{
  "collection": "movies",
  "queryType": "aggregation",
  "pipeline": [
    {
      "$match": {}
    },
    {
      "$group": {
        "_id": null,
        "totalRuntime": { "$sum": "$runtime" },
        "averageRuntime": { "$avg": "$runtime" },
        "minimumRuntime": { "$min": "$runtime" },
        "maximumRuntime": { "$max": "$runtime" },
        "count": { "$sum": 1 }
      }
    }
  ]
}
```

**Mongoose Query:**

```typescript
await movies.aggregate([
  {
    $match: {},
  },
  {
    $group: {
      _id: null,
      totalRuntime: { $sum: "$runtime" },
      averageRuntime: { $avg: "$runtime" },
      minimumRuntime: { $min: "$runtime" },
      maximumRuntime: { $max: "$runtime" },
      count: { $sum: 1 },
    },
  },
]);
```

#### GROUP BY con COUNT

```sql
SELECT category, COUNT(*) AS count
FROM products
GROUP BY category
```

**Salida del Conversor:**

```json
{
  "collection": "products",
  "queryType": "aggregation",
  "pipeline": [
    { "$match": {} },
    {
      "$group": {
        "_id": "$category",
        "count": { "$sum": 1 }
      }
    },
    {
      "$project": {
        "_id": 0,
        "category": "$_id",
        "count": 1
      }
    }
  ]
}
```

**Mongoose Query:**

```typescript
await products.aggregate([
  { $match: {} },
  {
    $group: {
      _id: "$category",
      count: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      category: "$_id",
      count: 1,
    },
  },
]);
```

#### GROUP BY con WHERE y ORDER BY

```sql
SELECT category,
       SUM(price) AS total,
       AVG(price) AS average
FROM products
WHERE active = true
GROUP BY category
ORDER BY total DESC
```

**Salida del Conversor:**

```json
{
  "collection": "products",
  "queryType": "aggregation",
  "pipeline": [
    { "$match": { "active": { "$eq": true } } },
    {
      "$group": {
        "_id": "$category",
        "total": { "$sum": "$price" },
        "average": { "$avg": "$price" }
      }
    },
    {
      "$project": {
        "_id": 0,
        "category": "$_id",
        "total": 1,
        "average": 1
      }
    },
    { "$sort": { "total": -1 } }
  ]
}
```

**Mongoose Query:**

```typescript
await products.aggregate([
  { $match: { active: { $eq: true } } },
  {
    $group: {
      _id: "$category",
      total: { $sum: "$price" },
      average: { $avg: "$price" },
    },
  },
  {
    $project: {
      _id: 0,
      category: "$_id",
      total: 1,
      average: 1,
    },
  },
  { $sort: { total: -1 } },
]);
```

#### GROUP BY con HAVING por alias

```sql
SELECT category, COUNT(*) AS total
FROM products
GROUP BY category
HAVING total > 5
ORDER BY total DESC
```

`WHERE` filtra documentos antes de agrupar. `HAVING` filtra los grupos después de calcular sus agregaciones.

**Salida del Conversor:**

```json
{
  "collection": "products",
  "queryType": "aggregation",
  "pipeline": [
    { "$match": {} },
    {
      "$group": {
        "_id": "$category",
        "total": { "$sum": 1 }
      }
    },
    {
      "$project": {
        "_id": 0,
        "category": "$_id",
        "total": 1
      }
    },
    {
      "$match": {
        "total": { "$gt": 5 }
      }
    },
    { "$sort": { "total": -1 } }
  ]
}
```

**Mongoose Query:**

```typescript
await products.aggregate([
  { $match: {} },
  {
    $group: {
      _id: "$category",
      total: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      category: "$_id",
      total: 1,
    },
  },
  { $match: { total: { $gt: 5 } } },
  { $sort: { total: -1 } },
]);
```

#### HAVING con expresión agregada

```sql
SELECT category, SUM(price) AS total
FROM products
GROUP BY category
HAVING SUM(price) >= 100
```

La expresión `SUM(price)` se resuelve mediante el alias `total` generado en el `$group`:

```json
{
  "$match": {
    "total": {
      "$gte": 100
    }
  }
}
```

#### JOIN con GROUP BY y HAVING

```sql
SELECT u.country, COUNT(*) AS total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.country
HAVING total >= 10
ORDER BY total DESC
```

El pipeline mantiene el orden relacional correcto:

```text
$lookup -> $unwind -> $group -> $project -> $match (HAVING) -> $sort
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$lookup": {
        "from": "orders",
        "localField": "id",
        "foreignField": "user_id",
        "as": "o"
      }
    },
    {
      "$unwind": {
        "path": "$o",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$group": {
        "_id": "$country",
        "total": { "$sum": 1 }
      }
    },
    {
      "$project": {
        "_id": 0,
        "country": "$_id",
        "total": 1
      }
    },
    { "$match": { "total": { "$gte": 10 } } },
    { "$sort": { "total": -1 } }
  ]
}
```

#### JOIN con GROUP BY

```sql
SELECT u.country, COUNT(*) AS total
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.country
ORDER BY total DESC
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "queryType": "find",
  "pipeline": [
    {
      "$lookup": {
        "from": "orders",
        "localField": "id",
        "foreignField": "user_id",
        "as": "o"
      }
    },
    {
      "$unwind": {
        "path": "$o",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$group": {
        "_id": "$country",
        "total": { "$sum": 1 }
      }
    },
    {
      "$project": {
        "_id": 0,
        "country": "$_id",
        "total": 1
      }
    },
    { "$sort": { "total": -1 } }
  ]
}
```

**Mongoose Query:**

```typescript
await users.aggregate([
  {
    $lookup: {
      from: "orders",
      localField: "id",
      foreignField: "user_id",
      as: "o",
    },
  },
  {
    $unwind: {
      path: "$o",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $group: {
      _id: "$country",
      total: { $sum: 1 },
    },
  },
  {
    $project: {
      _id: 0,
      country: "$_id",
      total: 1,
    },
  },
  { $sort: { total: -1 } },
]);
```

---

### INSERT - Inserción de Documentos

#### INSERT simple

```sql
INSERT INTO users (name, email, age) VALUES ('John Doe', 'john@example.com', 30)
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "insertOne",
  "documents": {
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30
  }
}
```

**Mongoose Query:**

```typescript
await users.insertOne({ name: "John Doe", email: "john@example.com", age: 30 });
```

#### INSERT múltiple en una sola operación

```sql
INSERT INTO users (name, email) VALUES
  ('Alice', 'alice@example.com'),
  ('Bob', 'bob@example.com'),
  ('Charlie', 'charlie@example.com')
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "insertMany",
  "documents": [
    { "name": "Alice", "email": "alice@example.com" },
    { "name": "Bob", "email": "bob@example.com" },
    { "name": "Charlie", "email": "charlie@example.com" }
  ]
}
```

**Mongoose Query:**

```typescript
await users.insertMany([
  { name: "Alice", email: "alice@example.com" },
  { name: "Bob", email: "bob@example.com" },
  { name: "Charlie", email: "charlie@example.com" },
]);
```

#### INSERT con valores numéricos y tipos diversos

```sql
INSERT INTO products (name, price, quantity, rating)
VALUES ('Laptop', 999.99, 5, 4.5)
```

**Salida del Conversor:**

```json
{
  "collection": "products",
  "operation": "insertOne",
  "documents": {
    "name": "Laptop",
    "price": 999.99,
    "quantity": 5,
    "rating": 4.5
  }
}
```

**Mongoose Query:**

```typescript
await products.insertOne({
  name: "Laptop",
  price: 999.99,
  quantity: 5,
  rating: 4.5,
});
```

---

### UPDATE - Actualización de Documentos

#### UPDATE con WHERE (updateOne)

```sql
UPDATE users SET status = 'inactive' WHERE id = 1
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "updateOne",
  "filter": {
    "id": {
      "$eq": 1
    }
  },
  "update": {
    "$set": {
      "status": "inactive"
    }
  }
}
```

**Mongoose Query:**

```typescript
await users.updateOne({ id: { $eq: 1 } }, { $set: { status: "inactive" } });
```

#### UPDATE múltiples campos

```sql
UPDATE users SET status = 'active', last_login = '2026-09-21' WHERE email = 'john@example.com'
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "updateOne",
  "filter": {
    "email": {
      "$eq": "john@example.com"
    }
  },
  "update": {
    "$set": {
      "status": "active",
      "last_login": "2026-09-21"
    }
  }
}
```

**Mongoose Query:**

```typescript
await users.updateOne(
  { email: { $eq: "john@example.com" } },
  { $set: { status: "active", last_login: "2026-09-21" } },
);
```

#### UPDATE múltiples documentos (updateMany)

```sql
UPDATE products SET discount = 10 WHERE price > 500
```

**Salida del Conversor:**

```json
{
  "collection": "products",
  "operation": "updateMany",
  "filter": { "price": { "$gt": 500 } },
  "update": { "$set": { "discount": 10 } }
}
```

**Mongoose Query:**

```typescript
await products.updateMany({ price: { $gt: 500 } }, { $set: { discount: 10 } });
```

#### UPDATE todos los documentos

```sql
UPDATE users SET status = 'archived'
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "updateMany",
  "filter": {},
  "update": { "$set": { "status": "archived" } }
}
```

**Mongoose Query:**

```typescript
await users.updateMany({}, { $set: { status: "archived" } });
```

---

### DELETE - Eliminación de Documentos

#### DELETE con WHERE (deleteOne)

```sql
DELETE FROM users WHERE id = 1
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "deleteOne",
  "filter": {
    "id": {
      "$eq": 1
    }
  }
}
```

**Mongoose Query:**

```typescript
await users.deleteOne({ id: { $eq: 1 } });
```

#### DELETE múltiples documentos

```sql
DELETE FROM users WHERE age < 18
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "deleteMany",
  "filter": { "age": { "$lt": 18 } }
}
```

**Mongoose Query:**

```typescript
await users.deleteMany({ age: { $lt: 18 } });
```

#### DELETE con múltiples condiciones (AND)

```sql
DELETE FROM users WHERE status = 'inactive' AND created_at < '2023-01-01'
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "deleteMany",
  "filter": {
    "$and": [
      {
        "status": {
          "$eq": "inactive"
        }
      },
      {
        "created_at": {
          "$lt": "2023-01-01"
        }
      }
    ]
  }
}
```

**Mongoose Query:**

```typescript
await users.deleteMany({
  $and: [
    { status: { $eq: "inactive" } },
    { created_at: { $lt: "2023-01-01" } },
  ],
});
```

#### DELETE con IN

```sql
DELETE FROM products WHERE id IN (1, 5, 10)
```

**Salida del Conversor:**

```json
{
  "collection": "products",
  "operation": "deleteMany",
  "filter": { "id": { "$in": [1, 5, 10] } }
}
```

**Mongoose Query:**

```typescript
await products.deleteMany({ id: { $in: [1, 5, 10] } });
```

#### ⚠️ DELETE todos los documentos

```sql
DELETE FROM users
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "operation": "deleteMany",
  "filter": {}
}
```

**Mongoose Query:**

```typescript
await users.deleteMany({});
```

---

### JOIN - Uniones entre Colecciones

#### INNER JOIN simple

```sql
SELECT u.name, o.order_id FROM users u INNER JOIN orders o ON u.id = o.user_id
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "pipeline": [
    {
      "$lookup": {
        "from": "orders",
        "localField": "id",
        "foreignField": "user_id",
        "as": "o"
      }
    },
    {
      "$unwind": {
        "path": "$o",
        "preserveNullAndEmptyArrays": false
      }
    },
    {
      "$project": {
        "name": 1,
        "order_id": 1
      }
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.aggregate([
  {
    $lookup: {
      from: "orders",
      localField: "id",
      foreignField: "user_id",
      as: "o",
    },
  },
  {
    $unwind: {
      path: "$o",
      preserveNullAndEmptyArrays: false,
    },
  },
  {
    $project: {
      name: 1,
      order_id: 1,
    },
  },
]);
```

#### LEFT JOIN

```sql
SELECT u.name, o.order_id FROM users u LEFT JOIN orders o ON u.id = o.user_id
```

**Salida del Conversor:**

```json
{
  "collection": "users",
  "pipeline": [
    {
      "$lookup": {
        "from": "orders",
        "localField": "id",
        "foreignField": "user_id",
        "as": "o"
      }
    },
    {
      "$unwind": {
        "path": "$o",
        "preserveNullAndEmptyArrays": true
      }
    },
    {
      "$project": {
        "name": 1,
        "order_id": 1
      }
    }
  ]
}
```

**Mongoose Query:**

```typescript
await users.aggregate([
  {
    $lookup: {
      from: "orders",
      localField: "id",
      foreignField: "user_id",
      as: "o",
    },
  },
  {
    $unwind: {
      path: "$o",
      preserveNullAndEmptyArrays: true,
    },
  },
  {
    $project: {
      name: 1,
      order_id: 1,
    },
  },
]);
```

---

## 🧪 Testing

```bash
npm test
```

Cobertura: **100%** en líneas y funciones.

## 🔧 Operadores Soportados

| SQL         | MongoDB         | Descripción                            |
| ----------- | --------------- | -------------------------------------- |
| `=`         | `$eq`           | Igualdad                               |
| `!=` o `<>` | `$ne`           | No igual                               |
| `<`         | `$lt`           | Menor que                              |
| `>`         | `$gt`           | Mayor que                              |
| `<=`        | `$lte`          | Menor o igual                          |
| `>=`        | `$gte`          | Mayor o igual                          |
| `WHERE`     | `$match`        | Condición de filtrado                  |
| `LIKE`      | `$regex`        | Búsqueda por patrón                    |
| `IN`        | `$in`           | Dentro de lista                        |
| `NOT IN`    | `$nin`          | Fuera de lista                         |
| `AND`       | `$and`          | Operador lógico Y                      |
| `OR`        | `$or`           | Operador lógico O                      |
| `JOIN`      | `$lookup`       | Unión entre colecciones                |
| `ORDER BY`  | `$sort`         | Ordenamiento de resultados             |
| `BETWEEN`   | `$gte` y `$lte` | Rango de valores                       |
| `LIMIT`     | `$limit`        | Límite de resultados                   |
| `COUNT`     | `$sum: 1`       | Conteo de documentos                   |
| `SUM`       | `$sum`          | Suma de valores                        |
| `AVG`       | `$avg`          | Promedio de valores                    |
| `MIN`       | `$min`          | Valor mínimo                           |
| `MAX`       | `$max`          | Valor máximo                           |
| `GROUP BY`  | `$group`        | Agrupamiento de resultados             |
| `HAVING`    | `$match`        | Filtrado de grupos después de `$group` |

## 📦 Dependencias

- **node-sql-parser**: Parseo de queries SQL
- **lodash**: Utilidades funcionales
- **chalk**: Colores en CLI
- **commander**: Interfaz CLI
- **typescript**: Compilador TypeScript

## 🎯 Próximas Mejoras

- [ ] OFFSET clause (pagination)
- [ ] Subqueries en WHERE

## 📄 Licencia

ISC
