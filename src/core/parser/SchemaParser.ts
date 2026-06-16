import { Parser } from 'node-sql-parser';
import { ITable, IColumn, IRelationship, ISchemaMetadata } from '../types/schema';

/**
 * Parses SQL DDL files and extracts schema metadata
 * Currently supports MySQL with extensibility for other dialects
 */
export class SchemaParser {
  private parser: Parser;
  private databaseType: 'mysql' | 'postgresql' | 'sqlserver' | 'sqlite';

  constructor(databaseType: 'mysql' | 'postgresql' | 'sqlserver' | 'sqlite' = 'mysql') {
    this.parser = new Parser();
    this.databaseType = databaseType;
  }

  /**
   * Parse SQL DDL and extract complete schema metadata
   */
  public parseSchema(sqlDDL: string): ISchemaMetadata {
    const tables = new Map<string, ITable>();
    const relationships: IRelationship[] = [];

    try {
      // Split DDL into individual statements
      const statements = this.splitStatements(sqlDDL);

      // First pass: extract tables and columns
      for (const statement of statements) {
        if (this.isCreateTableStatement(statement)) {
          const table = this.parseCreateTable(statement);
          if (table) {
            tables.set(table.id, table);
          }
        }
      }

      // Second pass: extract relationships
      for (const statement of statements) {
        if (this.isCreateTableStatement(statement)) {
          const tableRelationships = this.parseForeignKeys(statement, tables);
          relationships.push(...tableRelationships);
        }
      }

      // Third pass: detect many-to-many relationships (junction tables)
      this.detectManyToManyRelationships(tables, relationships);

      return {
        tables,
        relationships,
        databaseType: this.databaseType
      };
    } catch (error) {
      throw new Error(`Failed to parse schema: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Split SQL DDL into individual statements
   */
  private splitStatements(sql: string): string[] {
    // Remove comments
    sql = sql.replace(/--.*$/gm, '');
    sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');

    // Split by semicolon but preserve semicolons in strings
    const statements: string[] = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < sql.length; i++) {
      const char = sql[i];
      
      if ((char === '"' || char === "'") && sql[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }

      if (char === ';' && !inString) {
        if (currentStatement.trim()) {
          statements.push(currentStatement.trim());
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }

    if (currentStatement.trim()) {
      statements.push(currentStatement.trim());
    }

    return statements.filter(s => s.length > 0);
  }

  /**
   * Check if statement is CREATE TABLE
   */
  private isCreateTableStatement(statement: string): boolean {
    return /CREATE\s+TABLE/i.test(statement);
  }

  /**
   * Parse CREATE TABLE statement
   */
  private parseCreateTable(statement: string): ITable | null {
    try {
      // Extract table name
      const tableNameMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
      if (!tableNameMatch) return null;

      const tableName = tableNameMatch[1];
      
      // Extract column definitions
      const columnSection = statement.match(/\(([\s\S]+)\)/);
      if (!columnSection) return null;

      const columns: IColumn[] = [];
      const primaryKeys: string[] = [];
      
      // Parse columns
      const columnLines = this.splitColumnDefinitions(columnSection[1]);
      
      for (const line of columnLines) {
        // Skip constraint definitions
        if (/^\s*(CONSTRAINT|PRIMARY KEY|FOREIGN KEY|UNIQUE|KEY|INDEX)/i.test(line)) {
          // Extract primary key if defined inline
          const pkMatch = line.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);
          if (pkMatch) {
            const pkColumns = pkMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
            primaryKeys.push(...pkColumns);
          }
          continue;
        }

        const column = this.parseColumnDefinition(line);
        if (column) {
          columns.push(column);
          if (column.isPrimaryKey) {
            primaryKeys.push(column.name);
          }
        }
      }

      return {
        id: tableName,
        name: tableName,
        columns,
        primaryKeys,
      };
    } catch (error) {
      console.error(`Failed to parse table: ${error}`);
      return null;
    }
  }

  /**
   * Split column definitions carefully handling nested parentheses
   */
  private splitColumnDefinitions(columnSection: string): string[] {
    const lines: string[] = [];
    let current = '';
    let parenDepth = 0;

    for (let i = 0; i < columnSection.length; i++) {
      const char = columnSection[i];
      
      if (char === '(') parenDepth++;
      if (char === ')') parenDepth--;
      
      if (char === ',' && parenDepth === 0) {
        lines.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current.trim()) {
      lines.push(current.trim());
    }

    return lines;
  }

  /**
   * Parse individual column definition
   */
  private parseColumnDefinition(line: string): IColumn | null {
    // Match: column_name data_type [constraints]
    const match = line.match(/^\s*`?([a-zA-Z0-9_]+)`?\s+([a-zA-Z0-9_]+(?:\([^)]+\))?)(.*)/i);
    if (!match) return null;

    const columnName = match[1];
    const dataType = match[2];
    const constraints = match[3] || '';

    const nullable = !/NOT\s+NULL/i.test(constraints);
    const isPrimaryKey = /PRIMARY\s+KEY/i.test(constraints);
    
    // Extract default value
    const defaultMatch = constraints.match(/DEFAULT\s+([^,\s]+)/i);
    const defaultValue = defaultMatch ? defaultMatch[1].replace(/['"]/g, '') : undefined;

    // Extract comment
    const commentMatch = constraints.match(/COMMENT\s+['"]([^'"]+)['"]/i);
    const comment = commentMatch ? commentMatch[1] : undefined;

    return {
      id: columnName,
      name: columnName,
      dataType,
      nullable,
      isPrimaryKey,
      defaultValue,
      comment
    };
  }

  /**
   * Parse foreign key relationships from CREATE TABLE statement
   */
  private parseForeignKeys(statement: string, tables: Map<string, ITable>): IRelationship[] {
    const relationships: IRelationship[] = [];
    
    // Extract table name
    const tableNameMatch = statement.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?/i);
    if (!tableNameMatch) return relationships;
    
    const fromTable = tableNameMatch[1];

    // Find all FOREIGN KEY constraints
    const fkPattern = /CONSTRAINT\s+`?([a-zA-Z0-9_]+)`?\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+`?([a-zA-Z0-9_]+)`?\s*\(([^)]+)\)/gi;
    
    let match;
    while ((match = fkPattern.exec(statement)) !== null) {
      const constraintName = match[1];
      const fromColumns = match[2].split(',').map(c => c.trim().replace(/`/g, ''));
      const toTable = match[3];
      const toColumns = match[4].split(',').map(c => c.trim().replace(/`/g, ''));

      relationships.push({
        id: `${fromTable}_${toTable}_${constraintName}`,
        fromTable,
        fromColumns,
        toTable,
        toColumns,
        type: 'one-to-many'
      });
    }

    return relationships;
  }

  /**
   * Detect many-to-many relationships via junction tables
   */
  private detectManyToManyRelationships(tables: Map<string, ITable>, relationships: IRelationship[]): void {
    // A junction table typically has:
    // 1. Exactly 2 foreign keys
    // 2. Primary key composed of those foreign key columns
    // 3. Few or no other columns

    for (const [tableId, table] of tables) {
      const tableFKs = relationships.filter(r => r.fromTable === tableId);
      
      if (tableFKs.length === 2) {
        const allFKColumns = tableFKs.flatMap(fk => fk.fromColumns);
        const pkColumns = table.primaryKeys;
        
        // Check if PK consists only of FK columns
        const isPKOnlyFKs = pkColumns.length === allFKColumns.length &&
          pkColumns.every(pk => allFKColumns.includes(pk));
        
        if (isPKOnlyFKs) {
          // Mark relationships as many-to-many
          tableFKs.forEach(fk => {
            fk.type = 'many-to-many';
            fk.isJunctionTable = true;
          });
        }
      }
    }
  }
}
