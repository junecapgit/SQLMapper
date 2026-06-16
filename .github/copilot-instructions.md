# GitHub Copilot Instructions for SqlMapper

## Project Overview
SqlMapper is a local application that helps users build SQL queries by automatically generating JOIN statements based on database schema relationships. It parses database schemas, understands table relationships, and generates optimized queries with user-selected columns.

## Core Functionality

### 1. Schema Management
- Parse SQL DDL files to extract table and column definitions
- Parse foreign key relationships from CONSTRAINT definitions
- Support for various SQL dialects (PostgreSQL, MySQL, SQL Server, SQLite)
- Store schema in an in-memory graph structure for relationship traversal

### 2. Automatic Join Generation
- Use graph traversal algorithms (BFS/Dijkstra) to find shortest join paths between tables
- Generate INNER JOIN, LEFT JOIN, or RIGHT JOIN based on user preference
- Detect and handle many-to-many relationships through junction tables
- Optimize join order for query performance

### 3. Disconnected Table Detection
- Identify disconnected components in the table relationship graph
- Group selected columns by their connected table groups
- Generate separate queries for each disconnected group
- Alert users when selected columns span disconnected tables

### 4. Alias Management
- Maintain persistent storage of column aliases (preferred display names)
- Apply aliases in SELECT clauses when generating queries
- Support bulk import/export of alias mappings
- Allow per-project or global alias configurations

## Technical Architecture

### Technology Stack
- **Frontend**: React with TypeScript for UI components
- **Backend/Logic**: Node.js with TypeScript for schema parsing and query generation
- **State Management**: Zustand or Redux for application state
- **Graph Operations**: Graph data structures for relationship modeling
- **SQL Parsing**: SQL parser library (node-sql-parser or similar)
- **Styling**: Tailwind CSS or Material-UI for component styling

### Key Modules
1. **SchemaParser**: Parse SQL files and extract metadata
2. **RelationshipGraph**: Graph-based data structure for table relationships
3. **JoinPathFinder**: Algorithm to find optimal join paths
4. **QueryBuilder**: Generate SQL from selected columns and join paths
5. **AliasManager**: CRUD operations for column aliases
6. **UI Components**: Column selector, schema viewer, query preview

## Code Style & Patterns

### General Guidelines
- Use TypeScript for type safety
- Follow functional programming principles where applicable
- Write unit tests for core logic (schema parsing, join generation)
- Use descriptive variable names that reflect database concepts
- Document complex algorithms with inline comments

### Naming Conventions
- Tables: PascalCase in code, preserve original case from schema
- Columns: camelCase in code, preserve original case from schema
- Interfaces: Prefix with 'I' (e.g., ITable, IColumn, IRelationship)
- Classes: PascalCase (e.g., SchemaParser, QueryBuilder)
- Functions: camelCase with verb prefixes (e.g., findJoinPath, generateQuery)

### Error Handling
- Validate schema files before parsing
- Handle circular references in table relationships
- Provide clear error messages for ambiguous join paths
- Warn users about potential performance issues (e.g., multiple joins)

## Development Priorities
1. Core schema parsing and relationship detection
2. Basic join path finding (shortest path algorithm)
3. Query generation with automatic joins
4. UI for column selection
5. Alias management system
6. Disconnected table detection and multi-query generation

## Testing Strategy
- Unit tests for schema parser with various SQL dialects
- Unit tests for join path algorithms with complex schemas
- Integration tests for end-to-end query generation
- UI tests for column selection and query preview
- Test with real-world database schemas

## Security & Performance
- Sanitize SQL input to prevent injection attacks
- Optimize graph traversal for large schemas (1000+ tables)
- Cache computed join paths for frequently used table combinations
- Implement lazy loading for large schema visualizations

## Documentation Requirements
- README with setup instructions and usage examples
- API documentation for core modules
- Example schema files for testing
- FAQ for common use cases and limitations
