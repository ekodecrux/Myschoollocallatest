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
  Alert
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const ImageApprovalsTab = ({ 
  pendingImages,
  onApprove,
  onReject
}) => {
  return (
    <Box>
      {pendingImages.length === 0 ? (
        <Alert severity="info">No pending image approvals</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell><strong>Preview</strong></TableCell>
                <TableCell><strong>Submitted By</strong></TableCell>
                <TableCell><strong>Category</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingImages.map((image) => (
                <TableRow key={image.id}>
                  <TableCell>
                    <img 
                      src={image.url} 
                      alt="Preview" 
                      style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=No+Image'; }}
                    />
                  </TableCell>
                  <TableCell>{image.submitted_by_name || image.submittedBy || image.submitted_by_email || '-'}</TableCell>
                  <TableCell>{image.category || '-'}</TableCell>
                  <TableCell>{image.submitted_at || image.createdAt ? new Date(image.submitted_at || image.createdAt).toLocaleDateString() : '-'}</TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      color="success" 
                      onClick={() => onApprove(image.id)}
                      sx={{ minWidth: 32, mr: 1 }}
                    >
                      <CheckIcon fontSize="small" />
                    </Button>
                    <Button 
                      size="small" 
                      color="error" 
                      onClick={() => onReject(image.id)}
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

export default ImageApprovalsTab;
