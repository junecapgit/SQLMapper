import { IColumnAlias, IAliasConfiguration } from '../../types/schema';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Manages column aliases for improved query readability
 */
export class AliasManager {
  private aliases: Map<string, IColumnAlias>;
  private configPath: string;
  private isDirty: boolean;

  constructor(configPath?: string) {
    this.aliases = new Map();
    this.configPath = configPath || this.getDefaultConfigPath();
    this.isDirty = false;
  }

  /**
   * Get default configuration file path
   */
  private getDefaultConfigPath(): string {
    // In Electron, use app data directory
    // For now, use current directory
    return path.join(process.cwd(), 'aliases.json');
  }

  /**
   * Load aliases from file
   */
  public async loadAliases(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const config: IAliasConfiguration = JSON.parse(content);
      
      this.aliases.clear();
      for (const alias of config.aliases) {
        const key = this.makeKey(alias.tableName, alias.columnName);
        this.aliases.set(key, alias);
      }
      
      this.isDirty = false;
    } catch (error) {
      // File doesn't exist or is invalid - start with empty aliases
      this.aliases.clear();
    }
  }

  /**
   * Save aliases to file
   */
  public async saveAliases(projectName?: string): Promise<void> {
    const config: IAliasConfiguration = {
      projectName,
      aliases: Array.from(this.aliases.values()),
      lastModified: new Date()
    };

    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(this.configPath, content, 'utf-8');
    this.isDirty = false;
  }

  /**
   * Add or update an alias
   */
  public setAlias(
    tableId: string,
    tableName: string,
    columnId: string,
    columnName: string,
    alias: string
  ): void {
    const key = this.makeKey(tableName, columnName);
    this.aliases.set(key, {
      tableId,
      tableName,
      columnId,
      columnName,
      alias
    });
    this.isDirty = true;
  }

  /**
   * Get alias for a column
   */
  public getAlias(tableName: string, columnName: string): string | undefined {
    const key = this.makeKey(tableName, columnName);
    return this.aliases.get(key)?.alias;
  }

  /**
   * Remove an alias
   */
  public removeAlias(tableName: string, columnName: string): void {
    const key = this.makeKey(tableName, columnName);
    this.aliases.delete(key);
    this.isDirty = true;
  }

  /**
   * Get all aliases
   */
  public getAllAliases(): IColumnAlias[] {
    return Array.from(this.aliases.values());
  }

  /**
   * Get aliases for a specific table
   */
  public getTableAliases(tableName: string): IColumnAlias[] {
    return Array.from(this.aliases.values()).filter(
      alias => alias.tableName === tableName
    );
  }

  /**
   * Check if an alias exists
   */
  public hasAlias(tableName: string, columnName: string): boolean {
    const key = this.makeKey(tableName, columnName);
    return this.aliases.has(key);
  }

  /**
   * Clear all aliases
   */
  public clearAliases(): void {
    this.aliases.clear();
    this.isDirty = true;
  }

  /**
   * Import aliases from JSON
   */
  public async importFromFile(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    const config: IAliasConfiguration = JSON.parse(content);
    
    let imported = 0;
    for (const alias of config.aliases) {
      const key = this.makeKey(alias.tableName, alias.columnName);
      this.aliases.set(key, alias);
      imported++;
    }
    
    this.isDirty = true;
    return imported;
  }

  /**
   * Export aliases to JSON
   */
  public async exportToFile(filePath: string, projectName?: string): Promise<void> {
    const config: IAliasConfiguration = {
      projectName,
      aliases: Array.from(this.aliases.values()),
      lastModified: new Date()
    };

    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * Export aliases to CSV
   */
  public async exportToCSV(filePath: string): Promise<void> {
    const lines = ['Table,Column,Alias'];
    
    for (const alias of this.aliases.values()) {
      lines.push(`${alias.tableName},${alias.columnName},${alias.alias}`);
    }
    
    await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
  }

  /**
   * Import aliases from CSV
   */
  public async importFromCSV(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    
    let imported = 0;
    for (const line of lines) {
      const [tableName, columnName, alias] = line.split(',').map(s => s.trim());
      if (tableName && columnName && alias) {
        this.setAlias(tableName, tableName, columnName, columnName, alias);
        imported++;
      }
    }
    
    return imported;
  }

  /**
   * Check if there are unsaved changes
   */
  public hasUnsavedChanges(): boolean {
    return this.isDirty;
  }

  /**
   * Create unique key for table-column pair
   */
  private makeKey(tableName: string, columnName: string): string {
    return `${tableName}.${columnName}`;
  }

  /**
   * Get statistics about aliases
   */
  public getStats(): { totalAliases: number; tableCount: number } {
    const tables = new Set<string>();
    for (const alias of this.aliases.values()) {
      tables.add(alias.tableName);
    }

    return {
      totalAliases: this.aliases.size,
      tableCount: tables.size
    };
  }
}
