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
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  Typography
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
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedImage) {
      onApprove(selectedImage.id);
      setDialogOpen(false);
      setSelectedImage(null);
    }
  };

  const handleReject = () => {
    if (selectedImage) {
      onReject(selectedImage.id);
      setDialogOpen(false);
      setSelectedImage(null);
    }
  };

  return (
    <Box>
      {pendingImages.length === 0 ? (
        <Alert severity="info">No pending image approvals</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell><strong>Preview</strong></TableCell>
                  <TableCell><strong>Title/Name</strong></TableCell>
                  <TableCell><strong>Submitted By</strong></TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingImages.map((image) => (
                  <TableRow key={image.id} hover sx={{ cursor: 'pointer' }}>
                    <TableCell onClick={() => handleImageClick(image)}>
                      <img 
                        src={image.url} 
                        alt="Preview" 
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/60?text=No+Image'; }}
                      />
                    </TableCell>
                    <TableCell onClick={() => handleImageClick(image)}>
                      {image.title || image.original_filename || image.filename || 'Unnamed'}
                    </TableCell>
                    <TableCell>{image.submitted_by_name || image.submittedBy || image.submitted_by_email || '-'}</TableCell>
                    <TableCell>{image.category || '-'}</TableCell>
                    <TableCell>{image.submitted_at || image.createdAt ? new Date(image.submitted_at || image.createdAt).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="success" 
                        onClick={() => onApprove(image.id)}
                        sx={{ minWidth: 32, mr: 1 }}
                      >
                        <CheckIcon fontSize="small" />
                      </Button>
                      <Button 
                        size="small" 
                        variant="contained"
                        color="error" 
                        onClick={() => onReject(image.id)}
                        sx={{ 
                          minWidth: 32,
                          backgroundColor: '#d32f2f',
                          color: '#ffffff',
                          '&:hover': {
                            backgroundColor: '#b71c1c',
                            color: '#ffffff'
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Image Preview Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogContent sx={{ textAlign: 'center', p: 3 }}>
              {selectedImage && (
                <>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {selectedImage.title || selectedImage.original_filename || selectedImage.filename || 'Unnamed Image'}
                  </Typography>
                  <img 
                    src={selectedImage.url} 
                    alt={selectedImage.title || 'Preview'} 
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: 8 }}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Found'; }}
                  />
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Submitted by: {selectedImage.submitted_by_name || selectedImage.submitted_by_email || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Category: {selectedImage.category || 'N/A'}
                    </Typography>
                    {selectedImage.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Description: {selectedImage.description}
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
              <Button 
                variant="contained" 
                color="success" 
                onClick={handleApprove}
                startIcon={<CheckIcon />}
                sx={{ minWidth: 120 }}
              >
                Approve
              </Button>
              <Button 
                variant="contained" 
                onClick={handleReject}
                startIcon={<CloseIcon />}
                sx={{ 
                  minWidth: 120,
                  backgroundColor: '#d32f2f',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: '#b71c1c',
                    color: '#ffffff'
                  }
                }}
              >
                Reject
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default ImageApprovalsTab;
