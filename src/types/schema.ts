/**
 * Core type definitions for SqlMapper
 */

export interface IColumn {
  id: string;
  name: string;
  dataType: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface ITable {
  id: string;
  name: string;
  schema?: string;
  columns: IColumn[];
  primaryKeys: string[];
  comment?: string;
}

export type RelationshipType = 'one-to-many' | 'many-to-many' | 'one-to-one';

export interface IRelationship {
  id: string;
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
  type: RelationshipType;
  isJunctionTable?: boolean;
}

export interface ISchemaMetadata {
  tables: Map<string, ITable>;
  relationships: IRelationship[];
  databaseType: 'mysql' | 'postgresql' | 'sqlserver' | 'sqlite';
}

export interface IColumnSelection {
  tableId: string;
  tableName: string;
  columnId: string;
  columnName: string;
  alias?: string;
}

export type JoinType = 'INNER' | 'LEFT' | 'RIGHT' | 'FULL OUTER';

export interface IJoinClause {
  type: JoinType;
  leftTable: string;
  rightTable: string;
  conditions: IJoinCondition[];
}

export interface IJoinCondition {
  leftColumn: string;
  rightColumn: string;
  operator: '=' | '!=' | '<' | '>' | '<=' | '>=';
}

export interface IQueryConfiguration {
  selectedColumns: IColumnSelection[];
  joinType: JoinType;
  whereConditions?: string[];
  groupBy?: string[];
  orderBy?: { column: string; direction: 'ASC' | 'DESC' }[];
  limit?: number;
}

export interface IGeneratedQuery {
  sql: string;
  tables: string[];
  joins: IJoinClause[];
  isComplete: boolean;
  warnings: string[];
}

export interface IDisconnectedGroup {
  groupId: number;
  tables: string[];
  columns: IColumnSelection[];
  query: IGeneratedQuery;
}

export interface IColumnAlias {
  tableId: string;
  tableName: string;
  columnId: string;
  columnName: string;
  alias: string;
}

export interface IAliasConfiguration {
  projectName?: string;
  aliases: IColumnAlias[];
  lastModified: Date;
}

export interface ITableNode {
  id: string;
  name: string;
  adjacentTables: Map<string, IRelationship>;
}

export interface IPathNode {
  table: string;
  relationship?: IRelationship;
  distance: number;
  previous?: string;
}
