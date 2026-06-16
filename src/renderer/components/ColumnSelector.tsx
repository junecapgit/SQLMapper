import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  TextField,
  IconButton,
  Chip,
  Button
} from '@mui/material';
import {
  ExpandMore,
  TableChart,
  Clear,
  Edit,
  Search
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import { IColumnSelection } from '../../types/schema';

const ColumnSelector: React.FC = () => {
  const { schema, selectedColumns, addColumn, removeColumn, clearSelections, updateColumnAlias } = useAppStore();
  const [editingAlias, setEditingAlias] = React.useState<{ tableId: string; columnId: string } | null>(null);
  const [aliasValue, setAliasValue] = React.useState('');
  const [searchTerm, setSearchTerm] = React.useState('');

  if (!schema) return null;

  const isColumnSelected = (tableId: string, columnId: string) => {
    return selectedColumns.some(col => col.tableId === tableId && col.columnId === columnId);
  };

  const handleColumnToggle = (tableName: string, columnName: string) => {
    const isSelected = isColumnSelected(tableName, columnName);
    
    if (isSelected) {
      removeColumn(tableName, columnName);
    } else {
      const selection: IColumnSelection = {
        tableId: tableName,
        tableName: tableName,
        columnId: columnName,
        columnName: columnName
      };
      addColumn(selection);
    }
  };

  const handleAliasEdit = (tableId: string, columnId: string, currentAlias?: string) => {
    setEditingAlias({ tableId, columnId });
    setAliasValue(currentAlias || '');
  };

  const handleAliasSave = async () => {
    if (editingAlias && aliasValue) {
      const col = selectedColumns.find(
        c => c.tableId === editingAlias.tableId && c.columnId === editingAlias.columnId
      );
      
      if (col) {
        await window.electronAPI.setAlias(col.tableName, col.columnName, aliasValue);
        updateColumnAlias(editingAlias.tableId, editingAlias.columnId, aliasValue);
      }
    }
    setEditingAlias(null);
    setAliasValue('');
  };

  const selectedCount = selectedColumns.length;
  const tableCount = new Set(selectedColumns.map(c => c.tableName)).size;

  // Filter tables and columns based on search term
  const filteredTables = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return schema.tables;
    }

    const lowerSearch = searchTerm.toLowerCase();
    return schema.tables
      .map(table => {
        const matchingColumns = table.columns.filter(column => {
          // Check column name and table name
          const nameMatch = column.name.toLowerCase().includes(lowerSearch) ||
            table.name.toLowerCase().includes(lowerSearch);
          
          // Check if column has an alias that matches
          const selectedCol = selectedColumns.find(
            c => c.tableId === table.id && c.columnId === column.id
          );
          const aliasMatch = selectedCol?.alias?.toLowerCase().includes(lowerSearch) || false;
          
          return nameMatch || aliasMatch;
        });
        
        if (matchingColumns.length > 0) {
          return { ...table, columns: matchingColumns };
        }
        return null;
      })
      .filter(table => table !== null) as typeof schema.tables;
  }, [schema.tables, searchTerm, selectedColumns]);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Select Columns
        </Typography>
        {selectedCount > 0 && (
          <Button
            size="small"
            startIcon={<Clear />}
            onClick={clearSelections}
          >
            Clear All
          </Button>
        )}
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder="Search columns or tables..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
          endAdornment: searchTerm && (
            <IconButton size="small" onClick={() => setSearchTerm('')}>
              <Clear fontSize="small" />
            </IconButton>
          )
        }}
        sx={{ mb: 2 }}
      />

      {selectedCount > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`${selectedCount} columns from ${tableCount} tables`}
            color="primary"
            size="small"
          />
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {filteredTables.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No columns found matching "{searchTerm}"
            </Typography>
          </Box>
        ) : (
          filteredTables.map((table) => (
            <Accordion key={table.id}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TableChart />
                  <Typography>{table.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ({table.columns.length} columns)
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                {table.columns.map((column) => {
                  const isSelected = isColumnSelected(table.id, column.id);
                  const selectedCol = selectedColumns.find(
                    c => c.tableId === table.id && c.columnId === column.id
                  );
                  const isEditing = editingAlias?.tableId === table.id && editingAlias?.columnId === column.id;

                  return (
                    <Box key={column.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleColumnToggle(table.name, column.name)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2">
                              {column.name}
                              {column.isPrimaryKey && (
                                <Chip label="PK" size="small" sx={{ ml: 1, height: 16 }} />
                              )}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {column.dataType} {column.nullable ? '' : '(NOT NULL)'}
                            </Typography>
                          </Box>
                        }
                      />
                      {isSelected && (
                        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                          {isEditing ? (
                            <>
                              <TextField
                                size="small"
                                value={aliasValue}
                                onChange={(e) => setAliasValue(e.target.value)}
                                placeholder="Alias"
                                onKeyPress={(e) => e.key === 'Enter' && handleAliasSave()}
                                autoFocus
                              />
                              <Button size="small" onClick={handleAliasSave}>
                                Save
                              </Button>
                            </>
                          ) : (
                            <>
                              {selectedCol?.alias && (
                                <Chip label={selectedCol.alias} size="small" />
                              )}
                              <IconButton
                                size="small"
                                onClick={() => handleAliasEdit(table.id, column.id, selectedCol?.alias)}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </AccordionDetails>
            </Accordion>
          ))
        )}
      </Box>
    </Paper>
  );
};

export default ColumnSelector;
