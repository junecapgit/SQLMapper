import { IRelationship, IPathNode } from '../../types/schema';
import { RelationshipGraph } from './RelationshipGraph';

/**
 * Finds optimal join paths between tables using graph algorithms
 */
export class PathFinder {
  private graph: RelationshipGraph;

  constructor(graph: RelationshipGraph) {
    this.graph = graph;
  }

  /**
   * Find shortest path between two tables using BFS
   * Returns array of relationships to traverse
   */
  public findShortestPath(fromTable: string, toTable: string): IRelationship[] {
    if (fromTable === toTable) {
      return [];
    }

    // Check if tables exist
    if (!this.graph.getNode(fromTable) || !this.graph.getNode(toTable)) {
      return [];
    }

    // BFS to find shortest path
    const queue: IPathNode[] = [{
      table: fromTable,
      distance: 0
    }];
    
    const visited = new Set<string>([fromTable]);
    const parentMap = new Map<string, { parent: string; relationship: IRelationship }>();

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.table === toTable) {
        // Reconstruct path
        return this.reconstructPath(toTable, parentMap);
      }

      const node = this.graph.getNode(current.table);
      if (!node) continue;

      for (const [adjacentTable, relationship] of node.adjacentTables) {
        if (!visited.has(adjacentTable)) {
          visited.add(adjacentTable);
          parentMap.set(adjacentTable, {
            parent: current.table,
            relationship
          });
          queue.push({
            table: adjacentTable,
            distance: current.distance + 1
          });
        }
      }
    }

    // No path found
    return [];
  }

  /**
   * Reconstruct path from parent map
   */
  private reconstructPath(
    endTable: string,
    parentMap: Map<string, { parent: string; relationship: IRelationship }>
  ): IRelationship[] {
    const path: IRelationship[] = [];
    let current = endTable;

    while (parentMap.has(current)) {
      const { parent, relationship } = parentMap.get(current)!;
      path.unshift(relationship);
      current = parent;
    }

    return path;
  }

  /**
   * Find paths from one table to multiple target tables
   * Returns map of target table to path
   */
  public findPathsToMultipleTables(
    fromTable: string,
    toTables: string[]
  ): Map<string, IRelationship[]> {
    const paths = new Map<string, IRelationship[]>();

    for (const toTable of toTables) {
      if (toTable !== fromTable) {
        const path = this.findShortestPath(fromTable, toTable);
        if (path.length > 0) {
          paths.set(toTable, path);
        }
      }
    }

    return paths;
  }

  /**
   * Find a path that connects all specified tables (spanning tree)
   * Returns array of relationships needed to join all tables
   */
  public findMinimalSpanningPath(tables: string[]): IRelationship[] {
    if (tables.length <= 1) {
      return [];
    }

    // Start with first table
    const connected = new Set<string>([tables[0]]);
    const relationships: IRelationship[] = [];
    const unconnected = new Set(tables.slice(1));

    // Repeatedly find shortest path from any connected table to any unconnected table
    while (unconnected.size > 0) {
      let shortestPath: IRelationship[] = [];
      let shortestLength = Infinity;
      let targetTable = '';

      // Try all pairs of (connected, unconnected) tables
      for (const connectedTable of connected) {
        for (const unconnectedTable of unconnected) {
          const path = this.findShortestPath(connectedTable, unconnectedTable);
          
          if (path.length > 0 && path.length < shortestLength) {
            shortestPath = path;
            shortestLength = path.length;
            targetTable = unconnectedTable;
          }
        }
      }

      if (shortestPath.length === 0) {
        // No path found - tables are disconnected
        break;
      }

      // Add the path
      relationships.push(...shortestPath);
      
      // Mark all intermediate tables as connected
      let currentTable = shortestPath[0].fromTable;
      connected.add(currentTable);
      
      for (const rel of shortestPath) {
        connected.add(rel.toTable);
      }
      
      unconnected.delete(targetTable);
    }

    // Remove duplicate relationships
    return this.deduplicateRelationships(relationships);
  }

  /**
   * Remove duplicate relationships from path
   */
  private deduplicateRelationships(relationships: IRelationship[]): IRelationship[] {
    const seen = new Set<string>();
    const unique: IRelationship[] = [];

    for (const rel of relationships) {
      // Create a canonical key that's the same regardless of direction
      const tables = [rel.fromTable, rel.toTable].sort();
      const key = `${tables[0]}_${tables[1]}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(rel);
      }
    }

    return unique;
  }

  /**
   * Check if all tables can be connected
   */
  public canConnectAllTables(tables: string[]): boolean {
    if (tables.length <= 1) return true;

    return this.graph.areTablesConnected(tables);
  }

  /**
   * Find all tables involved in a join path
   */
  public getTablesInPath(relationships: IRelationship[]): string[] {
    const tables = new Set<string>();
    
    for (const rel of relationships) {
      tables.add(rel.fromTable);
      tables.add(rel.toTable);
    }

    return Array.from(tables);
  }
}
