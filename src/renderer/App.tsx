import React from 'react';
import { Box, Container, AppBar, Toolbar, Typography } from '@mui/material';
import SchemaImporter from './components/SchemaImporter';
import ColumnSelector from './components/ColumnSelector';
import QueryPreview from './components/QueryPreview';
import { useAppStore } from './store/appStore';

function App() {
  const { schema } = useAppStore();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div">
            SqlMapper - Intelligent SQL Query Builder
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth={false} sx={{ flex: 1, py: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {!schema ? (
          <SchemaImporter />
        ) : (
          <Box sx={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden' }}>
            <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column' }}>
              <ColumnSelector />
            </Box>
            <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
              <QueryPreview />
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default App;
