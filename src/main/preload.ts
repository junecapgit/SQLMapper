import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  importSchema: () => ipcRenderer.invoke('import-schema'),
  generateQuery: (selections: any, joinType: string) => 
    ipcRenderer.invoke('generate-query', selections, joinType),
  getAlias: (tableName: string, columnName: string) =>
    ipcRenderer.invoke('get-alias', tableName, columnName),
  setAlias: (tableName: string, columnName: string, alias: string) =>
    ipcRenderer.invoke('set-alias', tableName, columnName, alias),
  getAllAliases: () => ipcRenderer.invoke('get-all-aliases'),
  saveAliases: () => ipcRenderer.invoke('save-aliases'),
  exportAliases: () => ipcRenderer.invoke('export-aliases'),
  analyzeConnectivity: (selections: any) =>
    ipcRenderer.invoke('analyze-connectivity', selections)
});
