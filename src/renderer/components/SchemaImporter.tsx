import React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { FolderOpen } from '@mui/icons-material';
import { useAppStore } from '../store/appStore';

const SchemaImporter: React.FC = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { setSchema } = useAppStore();

  const handleImport = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.electronAPI.importSchema();
      
      if (result.success) {
        setSchema(result.schema);
      } else {
        setError(result.error || 'Failed to import schema');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 6,
          textAlign: 'center',
          maxWidth: 500,
        }}
      >
        <FolderOpen sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
        
        <Typography variant="h5" gutterBottom>
          Import Database Schema
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Select a SQL DDL file to get started. SqlMapper will parse your schema and help you build queries with automatic JOINs.
        </Typography>

        <Button
          variant="contained"
          size="large"
          onClick={handleImport}
          disabled={loading}
          startIcon={<FolderOpen />}
        >
          {loading ? 'Loading...' : 'Import SQL File'}
        </Button>

        {error && (
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default SchemaImporter;
