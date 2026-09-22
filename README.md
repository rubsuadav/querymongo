# QueryMongo 🚀

SQL to MongoDB Query Converter CLI - Convierte queries SQL a MongoDB format de forma simple y poderosa.

## 📋 Características

✅ **Convertir SELECT queries** - Con proyecciones, filtros, LIKE, IN y límites  
✅ **Convertir INSERT queries** - Para inserción de documentos únicos o múltiples  
✅ **Convertir UPDATE queries** - Con filtros y actualizaciones en uno o muchos documentos  
✅ **Convertir DELETE queries** - Para eliminación con condiciones complejas  
✅ **Convertir JOIN queries** - INNER JOIN y LEFT JOIN entre colecciones  
✅ **Soporte para ORDER BY y sorting** - Permite ordenar resultados según múltiples campos y direcciones, aplica tanto en queries SELECT como en JOIN  
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
npm run dev interactive
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

---

## 🧪 Testing

```bash
npm test
```

Cobertura: **100%** en líneas y funciones.

## 🔧 Operadores Soportados

| SQL         | MongoDB   | Descripción             |
| ----------- | --------- | ----------------------- |
| `=`         | `$eq`     | Igualdad                |
| `!=` o `<>` | `$ne`     | No igual                |
| `<`         | `$lt`     | Menor que               |
| `>`         | `$gt`     | Mayor que               |
| `<=`        | `$lte`    | Menor o igual           |
| `>=`        | `$gte`    | Mayor o igual           |
| `LIKE`      | `$regex`  | Búsqueda por patrón     |
| `IN`        | `$in`     | Dentro de lista         |
| `NOT IN`    | `$nin`    | Fuera de lista          |
| `AND`       | `$and`    | Operador lógico Y       |
| `OR`        | `$or`     | Operador lógico O       |
| `JOIN`      | `$lookup` | Unión entre colecciones |

## 📦 Dependencias

- **node-sql-parser**: Parseo de queries SQL
- **lodash**: Utilidades funcionales
- **chalk**: Colores en CLI
- **commander**: Interfaz CLI
- **typescript**: Compilador TypeScript

## 🎯 Próximas Mejoras

- [ ] Soporte para GROUP BY y agregaciones
- [ ] Transacciones multi-documento
- [ ] Validación de esquema
- [ ] Soporte para DISTINCT
- [ ] Operadores de texto ($text)

## 📄 Licencia

ISC
