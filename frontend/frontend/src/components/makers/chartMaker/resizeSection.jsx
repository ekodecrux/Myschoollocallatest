import React from 'react';
import { Typography, Box, Paper, Slider } from '@mui/material';
// Placeholder component for resize section
export const ResizePanel = ({ store }) => {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Resize Options</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Canvas resize functionality will be available soon.
      </Typography>
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2">Width</Typography>
        <Slider defaultValue={1920} min={100} max={4000} disabled />
        <Typography variant="body2">Height</Typography>
        <Slider defaultValue={1080} min={100} max={4000} disabled />
      </Box>
    </Box>
  );
};
// define the new custom section
export const ResizeSection = {
  name: 'custom-resize',
  Tab: (props) => (
    <Paper sx={{ p: 1, cursor: 'pointer' }} {...props}>
      <Typography>Resize</Typography>
    </Paper>
  ),
  Panel: ResizePanel,
};
