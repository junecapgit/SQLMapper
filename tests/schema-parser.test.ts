import { SchemaParser } from '../src/core/parser/SchemaParser';
import * as fs from 'fs';
import * as path from 'path';

describe('SchemaParser', () => {
  let parser: SchemaParser;
  let sampleSchema: string;

  beforeAll(() => {
    parser = new SchemaParser('mysql');
    sampleSchema = fs.readFileSync(
      path.join(__dirname, '../test-data/sample-schema.sql'),
      'utf-8'
    );
  });

  test('should parse CREATE TABLE statements', () => {
    const schema = parser.parseSchema(sampleSchema);
    
    expect(schema.tables.size).toBeGreaterThan(0);
    expect(schema.tables.has('Customers')).toBe(true);
    expect(schema.tables.has('Products')).toBe(true);
  });

  test('should extract columns correctly', () => {
    const schema = parser.parseSchema(sampleSchema);
    const customersTable = schema.tables.get('Customers');
    
    expect(customersTable).toBeDefined();
    expect(customersTable!.columns.length).toBeGreaterThan(0);
    
    const customerIdCol = customersTable!.columns.find(c => c.name === 'CustomerID');
    expect(customerIdCol).toBeDefined();
    expect(customerIdCol!.isPrimaryKey).toBe(true);
  });

  test('should parse foreign key relationships', () => {
    const schema = parser.parseSchema(sampleSchema);
    
    expect(schema.relationships.length).toBeGreaterThan(0);
    
    const orderCustomerRel = schema.relationships.find(
      r => r.fromTable === 'Orders' && r.toTable === 'Customers'
    );
    
    expect(orderCustomerRel).toBeDefined();
    expect(orderCustomerRel!.fromColumns).toContain('CustomerID');
  });

  test('should detect many-to-many relationships', () => {
    const schema = parser.parseSchema(sampleSchema);
    
    const m2mRelationships = schema.relationships.filter(r => r.type === 'many-to-many');
    expect(m2mRelationships.length).toBeGreaterThan(0);
  });
});
