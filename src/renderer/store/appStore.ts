import { create } from 'zustand';
import { ITable, IRelationship, IColumnSelection, JoinType } from '../../types/schema';

interface AppState {
  schema: { tables: ITable[]; relationships: IRelationship[] } | null;
  selectedColumns: IColumnSelection[];
  joinType: JoinType;
  generatedQuery: string;
  warnings: string[];
  isDisconnected: boolean;
  disconnectedGroups: any[];
  
  setSchema: (schema: { tables: ITable[]; relationships: IRelationship[] }) => void;
  addColumn: (column: IColumnSelection) => void;
  removeColumn: (tableId: string, columnId: string) => void;
  clearSelections: () => void;
  setJoinType: (joinType: JoinType) => void;
  setGeneratedQuery: (query: string, warnings: string[], isDisconnected: boolean, groups?: any[]) => void;
  updateColumnAlias: (tableId: string, columnId: string, alias: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  schema: null,
  selectedColumns: [],
  joinType: 'INNER',
  generatedQuery: '',
  warnings: [],
  isDisconnected: false,
  disconnectedGroups: [],

  setSchema: (schema) => set({ schema }),

  addColumn: (column) => set((state) => ({
    selectedColumns: [...state.selectedColumns, column]
  })),

  removeColumn: (tableId, columnId) => set((state) => ({
    selectedColumns: state.selectedColumns.filter(
      col => !(col.tableId === tableId && col.columnId === columnId)
    )
  })),

  clearSelections: () => set({ selectedColumns: [], generatedQuery: '', warnings: [] }),

  setJoinType: (joinType) => set({ joinType }),

  setGeneratedQuery: (query, warnings, isDisconnected, groups = []) => set({
    generatedQuery: query,
    warnings,
    isDisconnected,
    disconnectedGroups: groups
  }),

  updateColumnAlias: (tableId, columnId, alias) => set((state) => ({
    selectedColumns: state.selectedColumns.map(col =>
      col.tableId === tableId && col.columnId === columnId
        ? { ...col, alias }
        : col
    )
  }))
}));
