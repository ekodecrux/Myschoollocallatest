import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Button, Paper, Dialog, DialogContent, IconButton } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import { Login } from '../auth/login/Login';

const ProtectedMakerRoute = ({ children }) => {
  const { isLoggedin, accessToken } = useSelector((state) => state.login);
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);

  if (!isLoggedin || !accessToken) {
    return (
      <>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            p: 4
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 400,
              borderRadius: 2
            }}
          >
            <LockIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Login Required
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to access the Makers and Micro Scheduler tools.
              Your designs will be saved to your account.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => setShowLoginDialog(true)}
              sx={{ 
                mr: 2,
                '&:hover': {
                  backgroundColor: '#1565c0',
                  color: '#ffffff'
                }
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  borderColor: '#1976d2'
                }
              }}
            >
              Go Back
            </Button>
          </Paper>
        </Box>
        
        {/* Login Dialog - No duplicate header */}
        <Dialog 
          open={showLoginDialog} 
          onClose={() => setShowLoginDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { position: 'relative' }
          }}
        >
          <IconButton 
            onClick={() => setShowLoginDialog(false)}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8, 
              zIndex: 10,
              backgroundColor: 'rgba(255,255,255,0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 0 }}>
            <Login handleCloseModal={() => {
              setShowLoginDialog(false);
              setTimeout(() => {
                navigate(location.pathname, { replace: true });
              }, 100);
            }} />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return children;
};

export default ProtectedMakerRoute;
