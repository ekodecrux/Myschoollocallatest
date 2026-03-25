import React from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, isLoading: true };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, isLoading: false };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  componentDidMount() {
    // Simulate initial loading
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 500);
  }
  handleRetry = () => {
    this.setState({ hasError: false, isLoading: true });
    setTimeout(() => {
      this.setState({ isLoading: false });
    }, 500);
  };
  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            gap: 2,
            p: 3
          }}
        >
          <Typography variant="h6" color="text.secondary">
            Something went wrong
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please try refreshing the page
          </Typography>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRetry}
          >
            Try Again
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
export default ErrorBoundary;
