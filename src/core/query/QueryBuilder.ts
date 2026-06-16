import {
  IColumnSelection,
  IGeneratedQuery,
  IJoinClause,
  IJoinCondition,
  IRelationship,
  ISchemaMetadata,
  IDisconnectedGroup,
  JoinType
} from '../../types/schema';
import { RelationshipGraph } from '../graph/RelationshipGraph';
import { PathFinder } from '../graph/PathFinder';

/**
 * Generates SQL queries with automatic JOIN statements
 */
export class QueryBuilder {
  private schema: ISchemaMetadata;
  private graph: RelationshipGraph;
  private pathFinder: PathFinder;

  constructor(schema: ISchemaMetadata) {
    this.schema = schema;
    this.graph = new RelationshipGraph();
    this.graph.buildFromSchema(schema);
    this.pathFinder = new PathFinder(this.graph);
  }

  /**
   * Generate query from column selections
   * Handles both connected and disconnected tables
   */
  public generateQuery(
    selections: IColumnSelection[],
    joinType: JoinType = 'INNER'
  ): IGeneratedQuery | IDisconnectedGroup[] {
    if (selections.length === 0) {
      return {
        sql: '',
        tables: [],
        joins: [],
        isComplete: false,
        warnings: ['No columns selected']
      };
    }

    // Get unique tables involved
    const tables = this.getUniqueTables(selections);

    // Check if all tables are connected
    const isConnected = this.pathFinder.canConnectAllTables(tables);

    if (!isConnected) {
      // Generate multiple queries for disconnected groups
      return this.generateDisconnectedQueries(selections, joinType);
    }

    // Generate single query
    return this.generateSingleQuery(selections, joinType);
  }

  /**
   * Generate a single query when all tables are connected
   */
  private generateSingleQuery(
    selections: IColumnSelection[],
    joinType: JoinType
  ): IGeneratedQuery {
    const tables = this.getUniqueTables(selections);
    const warnings: string[] = [];

    // Find join path
    const relationships = this.pathFinder.findMinimalSpanningPath(tables);

    // Build JOIN clauses
    const joins = this.buildJoinClauses(relationships, joinType);

    // Build SELECT clause
    const selectClause = this.buildSelectClause(selections);

    // Build FROM clause (use first table)
    const fromTable = tables[0];

    // Build complete query
    let sql = `SELECT\n${selectClause}\nFROM ${fromTable}`;

    if (joins.length > 0) {
      sql += '\n' + joins.map(join => this.formatJoinClause(join)).join('\n');
    }

    sql += ';';

    // Add warnings for complex queries
    if (joins.length > 5) {
      warnings.push(`Query contains ${joins.length} joins - may impact performance`);
    }

    return {
      sql,
      tables,
      joins,
      isComplete: true,
      warnings
    };
  }

  /**
   * Generate multiple queries for disconnected table groups
   */
  private generateDisconnectedQueries(
    selections: IColumnSelection[],
    joinType: JoinType
  ): IDisconnectedGroup[] {
    const tables = this.getUniqueTables(selections);
    const groups = this.graph.groupTablesByComponent(tables);
    const disconnectedGroups: IDisconnectedGroup[] = [];

    let groupId = 0;
    for (const [componentIndex, componentTables] of groups) {
      // Filter selections for this component
      const componentSelections = selections.filter(sel =>
        componentTables.includes(sel.tableName)
      );

      const query = this.generateSingleQuery(componentSelections, joinType);
      
      disconnectedGroups.push({
        groupId: groupId++,
        tables: componentTables,
        columns: componentSelections,
        query
      });
    }

    return disconnectedGroups;
  }

  /**
   * Build SELECT clause with columns and aliases
   */
  private buildSelectClause(selections: IColumnSelection[]): string {
    const columns = selections.map(sel => {
      const fullColumn = `${sel.tableName}.${sel.columnName}`;
      return sel.alias ? `  ${fullColumn} AS ${sel.alias}` : `  ${fullColumn}`;
    });

    return columns.join(',\n');
  }

  /**
   * Build JOIN clauses from relationships
   */
  private buildJoinClauses(
    relationships: IRelationship[],
    joinType: JoinType
  ): IJoinClause[] {
    return relationships.map(rel => ({
      type: joinType,
      leftTable: rel.fromTable,
      rightTable: rel.toTable,
      conditions: rel.fromColumns.map((fromCol: string, index: number): IJoinCondition => ({
        leftColumn: `${rel.fromTable}.${fromCol}`,
        rightColumn: `${rel.toTable}.${rel.toColumns[index]}`,
        operator: '=' as const
      }))
    }));
  }

  /**
   * Format JOIN clause as SQL
   */
  private formatJoinClause(join: IJoinClause): string {
    const conditions = join.conditions
      .map((cond: IJoinCondition) => `${cond.leftColumn} ${cond.operator} ${cond.rightColumn}`)
      .join(' AND ');

    return `${join.type} JOIN ${join.rightTable} ON ${conditions}`;
  }

  /**
   * Get unique tables from selections
   */
  private getUniqueTables(selections: IColumnSelection[]): string[] {
    const tableSet = new Set<string>();
    selections.forEach(sel => tableSet.add(sel.tableName));
    return Array.from(tableSet);
  }

  /**
   * Validate selections before generating query
   */
  public validateSelections(selections: IColumnSelection[]): string[] {
    const errors: string[] = [];

    if (selections.length === 0) {
      errors.push('No columns selected');
      return errors;
    }

    // Check if all tables exist in schema
    for (const sel of selections) {
      if (!this.schema.tables.has(sel.tableName)) {
        errors.push(`Table "${sel.tableName}" not found in schema`);
      } else {
        const table = this.schema.tables.get(sel.tableName)!;
        const columnExists = table.columns.some((col) => col.name === sel.columnName);
        if (!columnExists) {
          errors.push(`Column "${sel.columnName}" not found in table "${sel.tableName}"`);
        }
      }
    }

    return errors;
  }

  /**
   * Get information about disconnected tables
   */
  public analyzeConnectivity(selections: IColumnSelection[]): {
    isFullyConnected: boolean;
    componentCount: number;
    components: string[][];
  } {
    const tables = this.getUniqueTables(selections);
    const groups = this.graph.groupTablesByComponent(tables);
    const components = Array.from(groups.values());

    return {
      isFullyConnected: components.length === 1,
      componentCount: components.length,
      components
    };
  }

  /**
   * Update schema (in case schema is reloaded)
   */
  public updateSchema(schema: ISchemaMetadata): void {
    this.schema = schema;
    this.graph.buildFromSchema(schema);
    this.pathFinder = new PathFinder(this.graph);
  }
}
