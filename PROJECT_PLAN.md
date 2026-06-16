# SqlMapper - Project Plan

## Executive Summary
SqlMapper is a local desktop/web application that intelligently generates SQL queries by automatically determining table joins based on database schema relationships. Users select columns from multiple tables, and the application constructs optimized queries with proper JOIN statements.

---

## Core Features

### 1. Schema Import & Parsing
- **Input Formats Supported:**
  - SQL DDL files (CREATE TABLE statements)
  - JSON schema format
  - Database connection for live schema extraction (future enhancement)
  
- **Schema Elements Extracted:**
  - Table names and structures
  - Column names, data types, and constraints
  - Primary keys
  - Foreign key relationships (CONSTRAINT FOREIGN KEY)
  - Indexes (for optimization hints)

### 2. Relationship Mapping
- **Graph-Based Model:**
  - Tables represented as nodes
  - Foreign key relationships as edges
  - Weighted edges (prefer direct FKs over junction tables)
  
- **Relationship Types:**
  - One-to-Many (standard FK)
  - Many-to-Many (through junction tables)
  - Self-referencing relationships

### 3. Intelligent Query Building
- **Column Selection Interface:**
  - Tree view or list view of all tables/columns
  - Multi-select with checkboxes
  - Search/filter functionality
  
- **Automatic Join Generation:**
  - Find shortest path between selected tables using graph algorithms
  - Generate appropriate JOIN syntax (INNER, LEFT, RIGHT, FULL OUTER)
  - Handle junction tables automatically
  - Optimize join order
  
- **Disconnected Table Handling:**
  - Detect when selected columns span unrelated table groups
  - Alert user with clear visualization
  - Option to generate multiple separate queries
  - Highlight which columns belong to which query

### 4. Column Alias Management
- **Alias Storage:**
  - Per-column preferred display names
  - Per-project or global configuration
  - Import/export alias mappings (JSON/CSV)
  
- **Alias Application:**
  - Apply aliases in SELECT clause: `SELECT column_name AS PreferredAlias`
  - Show aliases in UI instead of raw column names
  - Toggle between raw names and aliases

### 5. Query Output & Management
- **Generated Query Features:**
  - Syntax highlighting
  - Copy to clipboard
  - Export to file
  - Query validation/linting
  - Execution (if database connection available)
  
- **Query History:**
  - Save frequently used queries
  - Name and tag queries
  - Recall previous queries

---

## Technical Architecture

### Application Type Options

**Option A: Electron Desktop App (Recommended)**
- **Pros:** Full local control, no server needed, better file access, native feel
- **Cons:** Larger bundle size, platform-specific builds
- **Tech Stack:** Electron + React + TypeScript + Node.js

**Option B: Web Application with Local Backend**
- **Pros:** Easier to deploy, cross-platform by default
- **Cons:** Requires running a local server
- **Tech Stack:** React/Vue frontend + Express/FastAPI backend

**Option C: Browser-Only SPA**
- **Pros:** No installation, works anywhere
- **Cons:** Limited file access, schema must be copy-pasted or uploaded
- **Tech Stack:** React + TypeScript + Web Workers

### Recommended Stack (Electron Desktop App)

#### Frontend
- **Framework:** React 18+ with TypeScript
- **UI Library:** Material-UI or Ant Design
- **State Management:** Zustand (lightweight) or Redux Toolkit
- **Styling:** Tailwind CSS
- **Code Editor:** Monaco Editor (for SQL display)
- **Visualization:** React Flow (for schema diagram) or D3.js

#### Backend/Logic Layer
- **Runtime:** Node.js
- **Language:** TypeScript
- **SQL Parser:** node-sql-parser or @sqltools/formatter
- **Graph Library:** graphlib or custom implementation
- **File Operations:** fs/promises
- **Testing:** Jest + React Testing Library

#### Data Structures
```typescript
interface ITable {
  id: string;
  name: string;
  schema?: string;
  columns: IColumn[];
  primaryKey?: string[];
}

interface IColumn {
  id: string;
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: string;
  alias?: string;
}

interface IRelationship {
  id: string;
  fromTable: string;
  toTable: string;
  fromColumn: string[];
  toColumn: string[];
  type: 'one-to-many' | 'many-to-many' | 'one-to-one';
}

interface IQueryConfiguration {
  selectedColumns: { table: string; column: string; alias?: string }[];
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL OUTER';
  whereConditions?: string[];
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal:** Set up project structure and core parsing

- [ ] Initialize Electron + React + TypeScript project
- [ ] Set up development environment and build tools
- [ ] Implement SQL DDL parser for basic CREATE TABLE statements
- [ ] Create data models (ITable, IColumn, IRelationship)
- [ ] Extract tables, columns, and primary keys from schema
- [ ] Unit tests for parser

**Deliverables:**
- Working parser that can read SQL file and extract schema
- Basic data structures populated from sample schema

### Phase 2: Relationship Mapping (Week 2-3)
**Goal:** Build relationship graph from schema

- [ ] Parse FOREIGN KEY constraints
- [ ] Detect many-to-many relationships (junction tables)
- [ ] Build graph data structure (tables as nodes, FKs as edges)
- [ ] Implement graph traversal utilities
- [ ] Visualize schema relationships (optional for Phase 2)
- [ ] Unit tests for relationship detection

**Deliverables:**
- Graph representation of database schema
- Algorithm to find all relationships between tables

### Phase 3: Path Finding & Join Generation (Week 3-4)
**Goal:** Generate joins automatically

- [ ] Implement shortest path algorithm (Dijkstra or BFS)
- [ ] Find join path between any two tables
- [ ] Generate JOIN SQL syntax from path
- [ ] Handle multiple table joins in sequence
- [ ] Detect disconnected table groups
- [ ] Unit tests for path finding and join generation

**Deliverables:**
- Function that returns join path between tables
- Function that generates SQL JOIN statements

### Phase 4: User Interface (Week 4-5)
**Goal:** Build interactive UI for column selection

- [ ] Schema browser/tree view component
- [ ] Column selection interface (checkboxes)
- [ ] Selected columns panel
- [ ] Query preview panel with syntax highlighting
- [ ] Copy to clipboard functionality
- [ ] Basic error messages and alerts

**Deliverables:**
- Functional UI where users can select columns and see generated query

### Phase 5: Disconnected Table Handling (Week 5-6)
**Goal:** Handle unrelated tables gracefully

- [ ] Detect disconnected components in selection
- [ ] Group selected columns by connected components
- [ ] Generate multiple queries for disconnected groups
- [ ] Visual feedback showing which tables are connected
- [ ] Warning/alert system for user notification

**Deliverables:**
- Multi-query generation for disconnected tables
- Clear user feedback about table connectivity

### Phase 6: Alias Management (Week 6-7)
**Goal:** Implement column alias system

- [ ] UI for managing aliases (add, edit, delete)
- [ ] Persistent storage of aliases (JSON file or local DB)
- [ ] Apply aliases in generated queries
- [ ] Import/export alias mappings
- [ ] Toggle between raw names and aliases in UI

**Deliverables:**
- Full CRUD interface for aliases
- Aliases applied in SELECT statements

### Phase 7: Polish & Enhancement (Week 7-8)
**Goal:** Improve UX and add quality-of-life features

- [ ] Query history/favorites
- [ ] Settings/preferences panel
- [ ] Schema diagram visualization
- [ ] Performance optimization for large schemas
- [ ] Error handling and validation improvements
- [ ] Help documentation and tooltips

**Deliverables:**
- Production-ready application
- User documentation

---

## User Workflow Example

1. **Import Schema:**
   - User opens the app
   - Clicks "Import Schema" and selects a SQL file
   - App parses the file and displays available tables

2. **Select Columns:**
   - User browses tables in left panel
   - Checks boxes next to desired columns:
     - `Customers.CustomerName`
     - `Orders.OrderDate`
     - `OrderDetails.Quantity`
     - `Products.ProductName`

3. **View Generated Query:**
   - App automatically generates:
   ```sql
   SELECT 
     Customers.CustomerName,
     Orders.OrderDate,
     OrderDetails.Quantity,
     Products.ProductName
   FROM Customers
   INNER JOIN Orders ON Customers.CustomerID = Orders.CustomerID
   INNER JOIN OrderDetails ON Orders.OrderID = OrderDetails.OrderID
   INNER JOIN Products ON OrderDetails.ProductID = Products.ProductID
   ```

4. **Handle Disconnected Tables:**
   - If user also selects `Suppliers.CompanyName` (unrelated to Customers)
   - App alerts: "Selected columns span 2 disconnected table groups"
   - Offers to generate 2 separate queries

5. **Apply Aliases:**
   - User sets alias: `CustomerName` → `Customer`
   - Generated query updates to: `SELECT Customers.CustomerName AS Customer, ...`

---

## Testing Strategy

### Unit Tests
- Schema parser with various SQL dialects
- Relationship detection (1-to-many, many-to-many, self-referencing)
- Path finding algorithm with complex schemas
- Query generation with different join types
- Disconnected component detection

### Integration Tests
- End-to-end: Load schema → Select columns → Generate query
- Alias persistence and retrieval
- Multi-query generation for disconnected tables

### Test Data
- Sample schemas from real databases (e.g., Northwind, AdventureWorks)
- Edge cases: circular references, self-joins, orphaned tables

---

## Success Criteria

✅ **Core Functionality:**
- Successfully parse SQL DDL files
- Accurately detect table relationships
- Generate correct JOIN statements for selected columns
- Detect and handle disconnected tables

✅ **User Experience:**
- Intuitive column selection interface
- Clear error messages and warnings
- Fast response time (<1 second for typical schemas)
- Clean, professional UI

✅ **Reliability:**
- Handle edge cases (circular refs, missing FKs)
- Graceful error handling
- No crashes on malformed input

---

## Future Enhancements (Post-MVP)

1. **Database Connection:**
   - Direct connection to live databases
   - Extract schema automatically
   - Execute generated queries

2. **Query Optimization:**
   - Suggest indexes
   - Show query execution plan
   - Optimize join order based on table sizes

3. **Advanced Features:**
   - WHERE clause builder
   - GROUP BY and aggregation support
   - Subquery generation
   - UNION for disconnected tables

4. **Collaboration:**
   - Share schemas and alias mappings
   - Export/import project configurations
   - Version control for schemas

5. **Multi-Database Support:**
   - PostgreSQL, MySQL, SQL Server, Oracle, SQLite
   - Dialect-specific SQL generation
   - Cross-database queries (future)

---

## File Structure (Proposed)

```
SqlMapper/
├── .github/
│   └── copilot-instructions.md
├── src/
│   ├── main/                    # Electron main process
│   │   └── index.ts
│   ├── renderer/                # React app
│   │   ├── components/
│   │   │   ├── SchemaImporter.tsx
│   │   │   ├── ColumnSelector.tsx
│   │   │   ├── QueryPreview.tsx
│   │   │   ├── AliasManager.tsx
│   │   │   └── SchemaVisualization.tsx
│   │   ├── hooks/
│   │   ├── store/              # State management
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── core/                    # Business logic
│   │   ├── parser/
│   │   │   └── SchemaParser.ts
│   │   ├── graph/
│   │   │   ├── RelationshipGraph.ts
│   │   │   └── PathFinder.ts
│   │   ├── query/
│   │   │   └── QueryBuilder.ts
│   │   └── alias/
│   │       └── AliasManager.ts
│   ├── types/
│   │   └── schema.ts           # TypeScript interfaces
│   └── utils/
├── tests/
│   ├── unit/
│   └── integration/
├── test-data/
│   └── sample-schemas/
├── package.json
├── tsconfig.json
├── README.md
└── PROJECT_PLAN.md
```

---

## Questions to Consider

1. **Desktop vs Web:** Prefer Electron desktop app or web-based?
2. **Database Support:** Start with one SQL dialect or support multiple from the start?
3. **Join Type Selection:** Should users manually choose join type (INNER/LEFT/RIGHT) or auto-detect?
4. **Schema Format Priority:** Focus on SQL DDL first, or also support JSON/XML schemas?
5. **Persistence:** Local file storage or embedded database (SQLite) for aliases/history?
