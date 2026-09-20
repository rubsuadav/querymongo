# QueryMongo 🚀

SQL to MongoDB Query Converter CLI - Convierte queries SQL a MongoDB format de forma simple y poderosa.

## 📋 Características

✅ **Convertir SELECT queries** - Con proyecciones, filtros y límites  
✅ **Convertir INSERT queries** - Para inserción de documentos  
✅ **Convertir UPDATE queries** - Con filtros y actualizaciones  
✅ **Convertir DELETE queries** - Para eliminación de documentos  
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

## 🚀 Instalación

```bash
npm install
npm run build
```

## 💻 Uso

### Modo CLI - Interactivo

```bash
npm run dev -- interactive
```

Ingresa queries SQL y recibe instantáneamente el equivalente en MongoDB.

### Usar como librería

```typescript
import { mongoConverter } from "./src/application/MongoConverter.ts";

const result = mongoConverter.convert("SELECT name FROM users WHERE age > 18");
console.log(result);
```

## 📚 Ejemplos de Conversión

### SELECT con proyección

```sql
SELECT name, email FROM users
```

**MongoDB:**

```javascript
db.users.aggregate([{ $project: { name: 1, email: 1 } }]);
```

### SELECT con WHERE y LIMIT

```sql
SELECT * FROM products WHERE price > 100 LIMIT 10
```

**MongoDB:**

```javascript
db.products.aggregate([{ $match: { price: { $gt: 100 } } }, { $limit: 10 }]);
```

### INSERT

```sql
INSERT INTO users (name, email) VALUES ('John', 'john@example.com')
```

**MongoDB:**

```javascript
db.users.insertOne({ name: "John", email: "john@example.com" });
```

### UPDATE

```sql
UPDATE users SET name = "Jane" WHERE id = 1
```

**MongoDB:**

```javascript
db.users.updateOne({ id: 1 }, { $set: { name: "Jane" } });
```

### DELETE

```sql
DELETE FROM users WHERE id = 1
```

**MongoDB:**

```javascript
db.users.deleteOne({ id: 1 });
```

## 🧪 Testing

```bash
npm test
```

Cobertura: **100%** en líneas y funciones.

## 📖 API Reference

### `MongoConverter`

Clase principal para conversiones.

```typescript
class MongoConverter {
  convert(sql: string): Record<string, any>;
}
```

**Parámetros:**

- `sql` (string): Query SQL a convertir

**Retorna:** Objeto con estructura MongoDB

**Lanza:** Error si el query SQL no es soportado

### Exports Públicos

```typescript
export {
  MongoConverter,
  mongoConverter,
} from "./src/application/MongoConverter.ts";
export type { IConverter } from "./src/domain/interfaces/Converter.ts";
```

## 🔧 Operadores Soportados

| SQL         | MongoDB  |
| ----------- | -------- |
| `=`         | `$eq`    |
| `!=` o `<>` | `$ne`    |
| `<`         | `$lt`    |
| `>`         | `$gt`    |
| `<=`        | `$lte`   |
| `>=`        | `$gte`   |
| `LIKE`      | `$regex` |
| `IN`        | `$in`    |
| `NOT IN`    | `$nin`   |

## 📦 Dependencias

- **node-sql-parser**: Parseo de queries SQL
- **lodash**: Utilidades funcionales
- **chalk**: Colores en CLI
- **commander**: Interfaz CLI
- **typescript**: Compilador TypeScript

## 🎯 Próximas Mejoras

- [ ] Soporte para JOIN
- [ ] Soporte para GROUP BY
- [ ] Soporte para ORDER BY
- [ ] Transacciones multi-documento
- [ ] Validación de esquema

## 📄 Licencia

ISC
