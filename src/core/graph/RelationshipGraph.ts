import { IRelationship, ITableNode, ISchemaMetadata } from '../types/schema';

/**
 * Graph-based representation of table relationships
 * Uses adjacency list for efficient traversal
 */
export class RelationshipGraph {
  private nodes: Map<string, ITableNode>;
  private relationships: IRelationship[];

  constructor() {
    this.nodes = new Map();
    this.relationships = [];
  }

  /**
   * Build graph from schema metadata
   */
  public buildFromSchema(schema: ISchemaMetadata): void {
    this.nodes.clear();
    this.relationships = [...schema.relationships];

    // Create nodes for all tables
    for (const [tableId, table] of schema.tables) {
      this.nodes.set(tableId, {
        id: tableId,
        name: table.name,
        adjacentTables: new Map()
      });
    }

    // Add edges (relationships)
    for (const relationship of schema.relationships) {
      this.addEdge(relationship);
    }
  }

  /**
   * Add a relationship as an edge in the graph
   */
  private addEdge(relationship: IRelationship): void {
    const fromNode = this.nodes.get(relationship.fromTable);
    const toNode = this.nodes.get(relationship.toTable);

    if (fromNode && toNode) {
      // Add bidirectional edge
      fromNode.adjacentTables.set(relationship.toTable, relationship);
      
      // Create reverse relationship for bidirectional traversal
      const reverseRelationship: IRelationship = {
        ...relationship,
        id: `${relationship.id}_reverse`,
        fromTable: relationship.toTable,
        fromColumns: relationship.toColumns,
        toTable: relationship.fromTable,
        toColumns: relationship.fromColumns
      };
      
      toNode.adjacentTables.set(relationship.fromTable, reverseRelationship);
    }
  }

  /**
   * Get all tables in the graph
   */
  public getTables(): string[] {
    return Array.from(this.nodes.keys());
  }

  /**
   * Get node for a specific table
   */
  public getNode(tableId: string): ITableNode | undefined {
    return this.nodes.get(tableId);
  }

  /**
   * Get all relationships connected to a table
   */
  public getRelationships(tableId: string): IRelationship[] {
    const node = this.nodes.get(tableId);
    if (!node) return [];
    
    return Array.from(node.adjacentTables.values());
  }

  /**
   * Check if two tables are directly connected
   */
  public areDirectlyConnected(table1: string, table2: string): boolean {
    const node = this.nodes.get(table1);
    return node?.adjacentTables.has(table2) || false;
  }

  /**
   * Get relationship between two directly connected tables
   */
  public getDirectRelationship(fromTable: string, toTable: string): IRelationship | undefined {
    const node = this.nodes.get(fromTable);
    return node?.adjacentTables.get(toTable);
  }

  /**
   * Find all connected components (groups of tables that are connected)
   * Uses depth-first search
   */
  public findConnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const tableId of this.nodes.keys()) {
      if (!visited.has(tableId)) {
        const component = this.dfsComponent(tableId, visited);
        components.push(component);
      }
    }

    return components;
  }

  /**
   * Depth-first search to find all tables in a connected component
   */
  private dfsComponent(startTable: string, visited: Set<string>): string[] {
    const component: string[] = [];
    const stack: string[] = [startTable];

    while (stack.length > 0) {
      const current = stack.pop()!;
      
      if (visited.has(current)) continue;
      
      visited.add(current);
      component.push(current);

      const node = this.nodes.get(current);
      if (node) {
        for (const adjacentTable of node.adjacentTables.keys()) {
          if (!visited.has(adjacentTable)) {
            stack.push(adjacentTable);
          }
        }
      }
    }

    return component;
  }

  /**
   * Check if a set of tables belongs to the same connected component
   */
  public areTablesConnected(tables: string[]): boolean {
    if (tables.length <= 1) return true;

    const components = this.findConnectedComponents();
    
    // Find which component contains the first table
    const firstTableComponent = components.find(comp => comp.includes(tables[0]));
    if (!firstTableComponent) return false;

    // Check if all tables are in the same component
    return tables.every(table => firstTableComponent.includes(table));
  }

  /**
   * Group tables by their connected components
   */
  public groupTablesByComponent(tables: string[]): Map<number, string[]> {
    const components = this.findConnectedComponents();
    const groups = new Map<number, string[]>();

    for (const table of tables) {
      const componentIndex = components.findIndex(comp => comp.includes(table));
      if (componentIndex !== -1) {
        if (!groups.has(componentIndex)) {
          groups.set(componentIndex, []);
        }
        groups.get(componentIndex)!.push(table);
      }
    }

    return groups;
  }

  /**
   * Get all relationships in the graph
   */
  public getAllRelationships(): IRelationship[] {
    return this.relationships;
  }

  /**
   * Get graph statistics
   */
  public getStats(): { tableCount: number; relationshipCount: number; componentCount: number } {
    return {
      tableCount: this.nodes.size,
      relationshipCount: this.relationships.length,
      componentCount: this.findConnectedComponents().length
    };
  }
}
