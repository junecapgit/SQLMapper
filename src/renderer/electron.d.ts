import { IColumnSelection } from '../types/schema';

declare global {
  interface Window {
    electronAPI: {
      importSchema: () => Promise<any>;
      generateQuery: (selections: IColumnSelection[], joinType: string) => Promise<any>;
      analyzeConnectivity: (selections: IColumnSelection[]) => Promise<any>;
      setAlias: (tableName: string, columnName: string, alias: string) => Promise<any>;
      getAlias: (tableName: string, columnName: string) => Promise<string | null>;
      getAllAliases: () => Promise<any[]>;
      saveAliases: () => Promise<any>;
      exportAliases: () => Promise<any>;
    };
  }
}

export {};
