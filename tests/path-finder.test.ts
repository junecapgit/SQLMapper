import { RelationshipGraph } from '../src/core/graph/RelationshipGraph';
import { PathFinder } from '../src/core/graph/PathFinder';
import { SchemaParser } from '../src/core/parser/SchemaParser';
import * as fs from 'fs';
import * as path from 'path';

describe('PathFinder', () => {
  let graph: RelationshipGraph;
  let pathFinder: PathFinder;

  beforeAll(() => {
    const parser = new SchemaParser('mysql');
    const sampleSchema = fs.readFileSync(
      path.join(__dirname, '../test-data/sample-schema.sql'),
      'utf-8'
    );
    const schema = parser.parseSchema(sampleSchema);
    
    graph = new RelationshipGraph();
    graph.buildFromSchema(schema);
    pathFinder = new PathFinder(graph);
  });

  test('should find direct path between connected tables', () => {
    const path = pathFinder.findShortestPath('Orders', 'Customers');
    expect(path.length).toBeGreaterThan(0);
  });

  test('should find path through multiple tables', () => {
    const path = pathFinder.findShortestPath('Customers', 'Products');
    expect(path.length).toBeGreaterThan(0);
  });

  test('should return empty path for disconnected tables', () => {
    const path = pathFinder.findShortestPath('Customers', 'AuditLog');
    expect(path.length).toBe(0);
  });

  test('should detect if tables can be connected', () => {
    expect(pathFinder.canConnectAllTables(['Customers', 'Orders', 'Products'])).toBe(true);
    expect(pathFinder.canConnectAllTables(['Customers', 'AuditLog'])).toBe(false);
  });

  test('should find minimal spanning path for multiple tables', () => {
    const path = pathFinder.findMinimalSpanningPath(['Customers', 'Orders', 'OrderDetails']);
    expect(path.length).toBeGreaterThan(0);
    
    const tables = pathFinder.getTablesInPath(path);
    expect(tables).toContain('Customers');
    expect(tables).toContain('Orders');
    expect(tables).toContain('OrderDetails');
  });
});
