# SqlMapper - Intelligent SQL Query Builder

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

SqlMapper is a powerful desktop application that helps you build SQL queries by automatically generating JOIN statements based on database schema relationships. Simply select the columns you need, and SqlMapper will figure out how to connect the tables.

## 🚀 Features

### Core Functionality

- **📁 Schema Import** - Load database schemas from SQL DDL files
- **🔗 Automatic JOIN Generation** - Intelligently determines optimal join paths between tables
- **🔍 Disconnected Table Detection** - Identifies when selected columns span unrelated table groups and generates separate queries
- **🏷️ Column Alias Management** - Maintain preferred display names for columns with persistent storage
- **📊 Relationship Visualization** - Understand your database structure with graph-based relationship mapping
- **⚡ Real-time Query Preview** - See generated SQL as you select columns

### Technical Highlights

- **Graph Algorithms** - Uses BFS/Dijkstra for optimal join path finding
- **Multi-dialect Support** - Currently supports MySQL with extensibility for PostgreSQL, SQL Server, and SQLite
- **Junction Table Detection** - Automatically handles many-to-many relationships
- **Smart Query Optimization** - Minimizes number of joins required

## 📋 Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## 🔧 Installation

### Prerequisites

- Node.js 18+ and npm
- Git (for cloning)

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd SqlMapper
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run in development mode:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm run package
   ```

## 🚀 Quick Start

### 1. Import Your Schema

Launch SqlMapper and click **"Import SQL File"**. Select a SQL DDL file containing your database schema.

Example schema format:
```sql
CREATE TABLE Customers (
  CustomerID INT PRIMARY KEY,
  CustomerName VARCHAR(100) NOT NULL,
  Email VARCHAR(100)
);

CREATE TABLE Orders (
  OrderID INT PRIMARY KEY,
  CustomerID INT NOT NULL,
  OrderDate DATE,
  CONSTRAINT fk_order_customer FOREIGN KEY (CustomerID) 
    REFERENCES Customers(CustomerID)
);
```

### 2. Select Columns

Browse tables in the left panel and check the boxes next to columns you want in your query.

### 3. Generate Query

SqlMapper automatically generates the query with appropriate JOINs:

```sql
SELECT
  Customers.CustomerName,
  Customers.Email,
  Orders.OrderDate,
  Orders.TotalAmount
FROM Customers
INNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID;
```

### 4. Handle Disconnected Tables

If you select columns from unrelated table groups, SqlMapper will alert you and generate separate queries:

```
⚠️ Selected columns span 2 disconnected table groups

-- Query 1: Customers, Orders
SELECT Customers.CustomerName, Orders.OrderDate
FROM Customers
INNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID;

-- Query 2: AuditLog
SELECT AuditLog.ActionType, AuditLog.ActionDate
FROM AuditLog;
```

## 📖 Usage Guide

### Join Types

Choose from multiple join types:
- **INNER JOIN** (default) - Only matching rows
- **LEFT JOIN** - All rows from left table
- **RIGHT JOIN** - All rows from right table
- **FULL OUTER JOIN** - All rows from both tables

### Column Aliases

Click the **Edit** icon next to a selected column to set an alias:

```sql
SELECT 
  Customers.CustomerName AS Customer,
  Orders.OrderDate AS Date
FROM Customers
INNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID;
```

Aliases are saved and persist across sessions.

### Export Options

- **Copy to Clipboard** - Click the copy icon in the query preview
- **Export Aliases** - Save your alias configuration as JSON or CSV

## 🏗️ Architecture

### Project Structure

```
SqlMapper/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── index.ts          # App entry and IPC handlers
│   │   └── preload.ts        # Preload script for context bridge
│   ├── renderer/              # React frontend
│   │   ├── components/       # UI components
│   │   │   ├── SchemaImporter.tsx
│   │   │   ├── ColumnSelector.tsx
│   │   │   └── QueryPreview.tsx
│   │   ├── store/            # Zustand state management
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── core/                  # Business logic
│   │   ├── parser/           # Schema parsing
│   │   │   └── SchemaParser.ts
│   │   ├── graph/            # Relationship graph
│   │   │   ├── RelationshipGraph.ts
│   │   │   └── PathFinder.ts
│   │   ├── query/            # Query generation
│   │   │   └── QueryBuilder.ts
│   │   └── alias/            # Alias management
│   │       └── AliasManager.ts
│   └── types/                 # TypeScript definitions
│       └── schema.ts
├── tests/                     # Unit tests
├── test-data/                 # Sample schemas
└── PROJECT_PLAN.md           # Detailed implementation plan
```

### Key Components

#### SchemaParser
Parses SQL DDL files and extracts:
- Table definitions
- Column metadata (types, constraints)
- Primary keys
- Foreign key relationships

#### RelationshipGraph
Graph-based representation of table relationships:
- Tables as nodes
- Foreign keys as edges
- Supports disconnected component detection

#### PathFinder
Finds optimal join paths using graph algorithms:
- Breadth-first search for shortest paths
- Minimal spanning tree for multi-table queries
- Handles complex relationship networks

#### QueryBuilder
Generates SQL from column selections:
- Automatic JOIN clause generation
- Disconnected table handling
- Alias application

#### AliasManager
Persistent column alias storage:
- Per-column preferred names
- JSON/CSV import/export
- Auto-save functionality

## 🛠️ Development

### Tech Stack

- **Desktop Framework:** Electron 28+
- **Frontend:** React 18 + TypeScript
- **UI Library:** Material-UI (MUI)
- **State Management:** Zustand
- **Build Tool:** Vite
- **SQL Parser:** node-sql-parser
- **Testing:** Jest + React Testing Library

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- schema-parser.test.ts
```

### Development Scripts

```bash
# Start development server (hot reload)
npm run dev

# Build TypeScript
npm run build

# Lint code
npm run lint

# Package for distribution
npm run make
```

### Adding Support for Other Databases

1. Extend `SchemaParser` for dialect-specific syntax
2. Update DDL parsing patterns
3. Add dialect-specific data type mappings
4. Test with sample schemas

Example:
```typescript
class PostgreSQLParser extends SchemaParser {
  constructor() {
    super('postgresql');
  }
  
  // Override methods for PostgreSQL-specific syntax
}
```

## 🧪 Testing

The project includes comprehensive test coverage:

### Unit Tests

- **Schema Parser** - DDL parsing, relationship detection
- **Relationship Graph** - Graph operations, connectivity analysis
- **Path Finder** - Join path algorithms
- **Query Builder** - SQL generation, JOIN creation
- **Alias Manager** - CRUD operations, persistence

### Test Data

Sample schemas are provided in `test-data/`:
- `sample-schema.sql` - E-commerce database with various relationship types

### Running Tests

```bash
npm test
```

## 🎯 Roadmap

### Version 0.2.0
- [ ] Live database connections
- [ ] Schema auto-refresh
- [ ] Query execution within app
- [ ] Query history and favorites

### Version 0.3.0
- [ ] WHERE clause builder
- [ ] GROUP BY and aggregation support
- [ ] Query optimization suggestions
- [ ] Performance warnings

### Version 1.0.0
- [ ] PostgreSQL full support
- [ ] SQL Server full support
- [ ] SQLite support
- [ ] Schema diagram visualization
- [ ] Export to various formats

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow existing code style
- Update documentation as needed
- Ensure all tests pass before submitting

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- UI powered by [Material-UI](https://mui.com/)
- SQL parsing via [node-sql-parser](https://github.com/taozhi8833998/node-sql-parser)

## 📞 Support

For questions, issues, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review PROJECT_PLAN.md for detailed architecture

## 🎓 Examples

### Example 1: Simple Join

**Selection:**
- Customers.CustomerName
- Orders.OrderDate

**Generated Query:**
```sql
SELECT
  Customers.CustomerName,
  Orders.OrderDate
FROM Customers
INNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID;
```

### Example 2: Multi-table Join

**Selection:**
- Customers.CustomerName
- Orders.OrderDate
- OrderDetails.Quantity
- Products.ProductName

**Generated Query:**
```sql
SELECT
  Customers.CustomerName,
  Orders.OrderDate,
  OrderDetails.Quantity,
  Products.ProductName
FROM Customers
INNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID
INNER JOIN OrderDetails ON Orders.OrderID = OrderDetails.OrderID
INNER JOIN Products ON OrderDetails.ProductID = Products.ProductID;
```

### Example 3: Many-to-Many Through Junction Table

**Selection:**
- Products.ProductName
- Suppliers.SupplierName

**Generated Query:**
```sql
SELECT
  Products.ProductName,
  Suppliers.SupplierName
FROM Products
INNER JOIN ProductSuppliers ON Products.ProductID = ProductSuppliers.ProductID
INNER JOIN Suppliers ON ProductSuppliers.SupplierID = Suppliers.SupplierID;
```

---

**Built with ❤️ for database developers who hate writing JOIN statements**
