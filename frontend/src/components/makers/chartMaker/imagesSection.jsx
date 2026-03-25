import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
// Placeholder component for images section
export const ImagesPanel = ({ store }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Images Gallery</Typography>
      <Typography variant="body2" color="text.secondary">
        Image selection functionality will be available soon.
      </Typography>
    </Box>
  );
};
// define the new custom section
export const ImagesSection = {
  name: 'custom-images',
  Tab: (props) => (
    <Paper sx={{ p: 1, cursor: 'pointer' }} {...props}>
      <Typography>Images</Typography>
    </Paper>
  ),
  Panel: ImagesPanel,
};
