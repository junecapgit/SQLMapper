import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  AlertTitle,
  IconButton,
  Divider
} from '@mui/material';
import {
  ContentCopy,
  Refresh,
  PlayArrow
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import { JoinType } from '../../types/schema';

const QueryPreview: React.FC = () => {
  const {
    selectedColumns,
    joinType,
    setJoinType,
    generatedQuery,
    warnings,
    isDisconnected,
    disconnectedGroups,
    setGeneratedQuery
  } = useAppStore();

  const [generating, setGenerating] = React.useState(false);

  const handleGenerate = async () => {
    if (selectedColumns.length === 0) return;

    setGenerating(true);
    try {
      const result = await window.electronAPI.generateQuery(selectedColumns, joinType);
      
      if (result.success) {
        if (Array.isArray(result.result)) {
          // Multiple disconnected queries
          const queries = result.result.map((g: any) => g.query.sql).join('\n\n-- DISCONNECTED GROUP --\n\n');
          const allWarnings = result.result.flatMap((g: any) => g.query.warnings);
          allWarnings.unshift('Selected columns span disconnected table groups. Multiple queries generated.');
          setGeneratedQuery(queries, allWarnings, true, result.result);
        } else {
          // Single query
          setGeneratedQuery(result.result.sql, result.result.warnings, false);
        }
      }
    } catch (error) {
      console.error('Failed to generate query:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedQuery);
  };

  React.useEffect(() => {
    if (selectedColumns.length > 0) {
      handleGenerate();
    } else {
      setGeneratedQuery('', [], false);
    }
  }, [selectedColumns, joinType]);

  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Generated Query
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Join Type</InputLabel>
            <Select
              value={joinType}
              label="Join Type"
              onChange={(e) => setJoinType(e.target.value as JoinType)}
            >
              <MenuItem value="INNER">INNER</MenuItem>
              <MenuItem value="LEFT">LEFT</MenuItem>
              <MenuItem value="RIGHT">RIGHT</MenuItem>
              <MenuItem value="FULL OUTER">FULL OUTER</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={handleGenerate} disabled={generating || selectedColumns.length === 0}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>

      {warnings.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Alert severity={isDisconnected ? 'warning' : 'info'}>
            <AlertTitle>{isDisconnected ? 'Disconnected Tables' : 'Information'}</AlertTitle>
            {warnings.map((warning, index) => (
              <Typography key={index} variant="body2">
                • {warning}
              </Typography>
            ))}
          </Alert>
        </Box>
      )}

      {isDisconnected && disconnectedGroups.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Table Groups:
          </Typography>
          {disconnectedGroups.map((group: any, index: number) => (
            <Alert key={index} severity="info" sx={{ mb: 1 }}>
              <Typography variant="body2">
                Group {group.groupId + 1}: {group.tables.join(', ')}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          bgcolor: '#1e1e1e',
          color: '#d4d4d4',
          p: 2,
          borderRadius: 1,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.9rem',
          whiteSpace: 'pre-wrap',
          position: 'relative'
        }}
      >
        {generatedQuery || (
          <Typography variant="body2" sx={{ color: '#888' }}>
            Select columns to generate a query...
          </Typography>
        )}
        {generatedQuery && (
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
            size="small"
            onClick={handleCopy}
          >
            <ContentCopy fontSize="small" sx={{ color: '#fff' }} />
          </IconButton>
        )}
      </Box>

      {selectedColumns.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Select columns from the tables on the left to generate a query
        </Alert>
      )}
    </Paper>
  );
};

export default QueryPreview;
