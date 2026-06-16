import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { SchemaParser } from '../core/parser/SchemaParser';
import { QueryBuilder } from '../core/query/QueryBuilder';
import { AliasManager } from '../core/alias/AliasManager';
import { ISchemaMetadata, IColumnSelection, JoinType } from '../types/schema';

let mainWindow: BrowserWindow | null = null;
let schemaParser: SchemaParser | null = null;
let queryBuilder: QueryBuilder | null = null;
let aliasManager: AliasManager | null = null;
let currentSchema: ISchemaMetadata | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, './preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  // Load app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Import schema
ipcMain.handle('import-schema', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'SQL Files', extensions: ['sql'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'No file selected' };
  }

  try {
    const filePath = result.filePaths[0];
    const content = await fs.readFile(filePath, 'utf-8');
    
    schemaParser = new SchemaParser('mysql');
    currentSchema = schemaParser.parseSchema(content);
    
    queryBuilder = new QueryBuilder(currentSchema);
    aliasManager = new AliasManager();
    await aliasManager.loadAliases();

    return {
      success: true,
      schema: {
        tables: Array.from(currentSchema.tables.values()),
        relationships: currentSchema.relationships,
        databaseType: currentSchema.databaseType
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Generate query
ipcMain.handle('generate-query', async (_event, selections: IColumnSelection[], joinType: JoinType) => {
  if (!queryBuilder) {
    return { success: false, error: 'No schema loaded' };
  }

  try {
    // Apply aliases
    if (aliasManager) {
      selections = selections.map(sel => ({
        ...sel,
        alias: sel.alias || aliasManager!.getAlias(sel.tableName, sel.columnName)
      }));
    }

    const result = queryBuilder.generateQuery(selections, joinType);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Get alias
ipcMain.handle('get-alias', async (_event, tableName: string, columnName: string) => {
  if (!aliasManager) {
    return null;
  }
  return aliasManager.getAlias(tableName, columnName);
});

// Set alias
ipcMain.handle('set-alias', async (_event, tableName: string, columnName: string, alias: string) => {
  if (!aliasManager) {
    return { success: false, error: 'Alias manager not initialized' };
  }

  try {
    aliasManager.setAlias(tableName, tableName, columnName, columnName, alias);
    await aliasManager.saveAliases();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Get all aliases
ipcMain.handle('get-all-aliases', async () => {
  if (!aliasManager) {
    return [];
  }
  return aliasManager.getAllAliases();
});

// Save aliases
ipcMain.handle('save-aliases', async () => {
  if (!aliasManager) {
    return { success: false, error: 'Alias manager not initialized' };
  }

  try {
    await aliasManager.saveAliases();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Export aliases
ipcMain.handle('export-aliases', async () => {
  if (!aliasManager) {
    return { success: false, error: 'Alias manager not initialized' };
  }

  const result = await dialog.showSaveDialog({
    filters: [
      { name: 'JSON Files', extensions: ['json'] },
      { name: 'CSV Files', extensions: ['csv'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'No file selected' };
  }

  try {
    if (result.filePath.endsWith('.csv')) {
      await aliasManager.exportToCSV(result.filePath);
    } else {
      await aliasManager.exportToFile(result.filePath);
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});

// Analyze connectivity
ipcMain.handle('analyze-connectivity', async (_event, selections: IColumnSelection[]) => {
  if (!queryBuilder) {
    return { success: false, error: 'No schema loaded' };
  }

  try {
    const analysis = queryBuilder.analyzeConnectivity(selections);
    return { success: true, analysis };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
});
