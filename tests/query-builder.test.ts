import { QueryBuilder } from '../src/core/query/QueryBuilder';
import { SchemaParser } from '../src/core/parser/SchemaParser';
import { IColumnSelection } from '../src/types/schema';
import * as fs from 'fs';
import * as path from 'path';

describe('QueryBuilder', () => {
  let queryBuilder: QueryBuilder;

  beforeAll(() => {
    const parser = new SchemaParser('mysql');
    const sampleSchema = fs.readFileSync(
      path.join(__dirname, '../test-data/sample-schema.sql'),
      'utf-8'
    );
    const schema = parser.parseSchema(sampleSchema);
    queryBuilder = new QueryBuilder(schema);
  });

  test('should generate query for single table', () => {
    const selections: IColumnSelection[] = [
      { tableId: 'Customers', tableName: 'Customers', columnId: 'CustomerName', columnName: 'CustomerName' },
      { tableId: 'Customers', tableName: 'Customers', columnId: 'Email', columnName: 'Email' }
    ];

    const result = queryBuilder.generateQuery(selections, 'INNER');
    
    expect(result).not.toBeInstanceOf(Array);
    if (!Array.isArray(result)) {
      expect(result.sql).toContain('SELECT');
      expect(result.sql).toContain('Customers.CustomerName');
      expect(result.sql).toContain('FROM Customers');
    }
  });

  test('should generate query with JOINs for multiple tables', () => {
    const selections: IColumnSelection[] = [
      { tableId: 'Customers', tableName: 'Customers', columnId: 'CustomerName', columnName: 'CustomerName' },
      { tableId: 'Orders', tableName: 'Orders', columnId: 'OrderDate', columnName: 'OrderDate' }
    ];

    const result = queryBuilder.generateQuery(selections, 'INNER');
    
    expect(result).not.toBeInstanceOf(Array);
    if (!Array.isArray(result)) {
      expect(result.sql).toContain('JOIN');
      expect(result.sql).toContain('ON');
      expect(result.joins.length).toBeGreaterThan(0);
    }
  });

  test('should apply aliases when provided', () => {
    const selections: IColumnSelection[] = [
      { 
        tableId: 'Customers', 
        tableName: 'Customers', 
        columnId: 'CustomerName', 
        columnName: 'CustomerName',
        alias: 'Customer'
      }
    ];

    const result = queryBuilder.generateQuery(selections, 'INNER');
    
    expect(result).not.toBeInstanceOf(Array);
    if (!Array.isArray(result)) {
      expect(result.sql).toContain('AS Customer');
    }
  });

  test('should detect disconnected tables and generate multiple queries', () => {
    const selections: IColumnSelection[] = [
      { tableId: 'Customers', tableName: 'Customers', columnId: 'CustomerName', columnName: 'CustomerName' },
      { tableId: 'AuditLog', tableName: 'AuditLog', columnId: 'ActionType', columnName: 'ActionType' }
    ];

    const result = queryBuilder.generateQuery(selections, 'INNER');
    
    expect(Array.isArray(result)).toBe(true);
    if (Array.isArray(result)) {
      expect(result.length).toBe(2);
      expect(result[0].groupId).toBeDefined();
      expect(result[1].groupId).toBeDefined();
    }
  });

  test('should analyze connectivity correctly', () => {
    const connected: IColumnSelection[] = [
      { tableId: 'Customers', tableName: 'Customers', columnId: 'CustomerName', columnName: 'CustomerName' },
      { tableId: 'Orders', tableName: 'Orders', columnId: 'OrderDate', columnName: 'OrderDate' }
    ];

    const analysis = queryBuilder.analyzeConnectivity(connected);
    expect(analysis.isFullyConnected).toBe(true);
    expect(analysis.componentCount).toBe(1);

    const disconnected: IColumnSelection[] = [
      { tableId: 'Customers', tableName: 'Customers', columnId: 'CustomerName', columnName: 'CustomerName' },
      { tableId: 'AuditLog', tableName: 'AuditLog', columnId: 'ActionType', columnName: 'ActionType' }
    ];

    const analysis2 = queryBuilder.analyzeConnectivity(disconnected);
    expect(analysis2.isFullyConnected).toBe(false);
    expect(analysis2.componentCount).toBe(2);
  });
});
