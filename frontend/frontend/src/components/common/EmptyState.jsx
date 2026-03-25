import React from 'react';
import { Box, Typography } from '@mui/material';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
const EmptyState = ({ 
  message = 'Your digital content will be available soon',
  icon: IconComponent = CloudQueueIcon,
  subMessage = 'We are working on adding more content for you'
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '300px',
        gap: 2,
        p: 4,
        textAlign: 'center'
      }}
    >
      <IconComponent sx={{ fontSize: 80, color: '#bdbdbd' }} />
      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subMessage}
      </Typography>
    </Box>
  );
};
export default EmptyState;
