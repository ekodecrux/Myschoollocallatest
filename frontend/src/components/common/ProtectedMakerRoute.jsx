import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Button, Paper, Dialog, DialogContent } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { Login } from '../auth/login/Login';
import { SignUp } from '../auth/signUp/SignUp';

const ProtectedMakerRoute = ({ children }) => {
  const { isLoggedin, accessToken } = useSelector((state) => state.login);
  const location = useLocation();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState(0); // 0 = Login, 1 = SignUp

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
                backgroundColor: '#1976d2',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#1565c0',
                  color: '#fff'
                }
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Paper>
        </Box>
        
        {/* Login Dialog */}
        <Dialog 
          open={showLoginDialog} 
          onClose={() => {
            setShowLoginDialog(false);
            setDialogTab(0);
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { overflow: 'visible' }
          }}
        >
          <DialogContent sx={{ p: 0 }}>
            {dialogTab === 0 ? (
              <Login 
                handleCloseModal={() => {
                  setShowLoginDialog(false);
                  setDialogTab(0);
                  setTimeout(() => {
                    navigate(location.pathname, { replace: true });
                  }, 100);
                }}
                hideRegister={false}
                changeTab={() => setDialogTab(1)}
                onRegisterClick={() => setDialogTab(1)}
              />
            ) : (
              <SignUp 
                handleCloseModal={() => {
                  setShowLoginDialog(false);
                  setDialogTab(0);
                }}
                changeTab={() => setDialogTab(0)}
              />
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return children;
};

export default ProtectedMakerRoute;
