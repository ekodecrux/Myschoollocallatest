import React from 'react';
import {
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const CreditRequestsTab = ({ 
  creditRequests,
  onApprove,
  onReject
}) => {
  return (
    <Box>
      {creditRequests.length === 0 ? (
        <Alert severity="info">No pending credit requests</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Role</strong></TableCell>
                <TableCell><strong>School</strong></TableCell>
                <TableCell><strong>Credits Requested</strong></TableCell>
                <TableCell><strong>Current Credits</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {creditRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.userName || request.userEmail}</TableCell>
                  <TableCell>
                    <Chip label={request.userRole} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{request.schoolName || '-'}</TableCell>
                  <TableCell>
                    <Chip label={`+${request.creditsRequested}`} size="small" color="success" />
                  </TableCell>
                  <TableCell>{request.currentCredits || 0}</TableCell>
                  <TableCell>
                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      color="success" 
                      onClick={() => onApprove(request.id, true)}
                      sx={{ minWidth: 32, mr: 1 }}
                    >
                      <CheckIcon fontSize="small" />
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => onApprove(request.id, false)}
                      sx={{ minWidth: 32 }}
                    >
                      <CloseIcon fontSize="small" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default CreditRequestsTab;
