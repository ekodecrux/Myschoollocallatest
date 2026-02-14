import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { keyframes } from '@mui/system';
const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;
const LoadingSpinner = ({ message = 'Loading...', fullScreen = false, size = 40 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '100vh' : '200px',
        gap: 2,
        animation: `${pulse} 1.5s ease-in-out infinite`
      }}
    >
      <CircularProgress size={size} sx={{ color: '#1976d2' }} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};
export default LoadingSpinner;
