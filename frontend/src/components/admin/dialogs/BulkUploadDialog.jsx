import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link,
  Divider
} from '@mui/material';
import {
  Download as DownloadIcon,
  CloudUpload as UploadIcon
} from '@mui/icons-material';

// Bulk upload templates with mandatory/optional fields
const TEMPLATES = {
  schools: {
    name: 'Schools Template',
    mandatory: ['school_name', 'admin_email', 'admin_name', 'mobile_number'],
    optional: ['principal_name', 'address', 'city', 'state', 'postal_code'],
    sample: [
      { school_name: 'ABC School', admin_email: 'admin@abc.com', admin_name: 'John Doe', mobile_number: '9876543210', principal_name: 'Jane Smith', address: '123 Main St', city: 'Mumbai', state: 'Maharashtra', postal_code: '400001' }
    ]
  },
  teachers: {
    name: 'Teachers Template',
    mandatory: ['name', 'email', 'mobile_number'],
    optional: ['school_code', 'address', 'city', 'state', 'postal_code'],
    sample: [
      { name: 'Teacher Name', email: 'teacher@school.com', mobile_number: '9876543210', school_code: 'SCH123456', address: '456 School Rd', city: 'Delhi', state: 'Delhi', postal_code: '110001' }
    ],
    note: 'Note: School code will be auto-filled with your school code if left blank.'
  },
  students: {
    name: 'Students Template',
    mandatory: ['name', 'email', 'mobile_number', 'class_name'],
    optional: ['school_code', 'teacher_code', 'section_name', 'roll_number', 'address', 'city', 'state', 'postal_code'],
    sample: [
      { name: 'Student Name', email: 'student@email.com', mobile_number: '9876543210', school_code: 'SCH123456', teacher_code: 'TCH001', class_name: 'Class 5', section_name: 'A', roll_number: '101' }
    ],
    note: 'Note: School code and Teacher code are required. Get these from Schools and Teachers tabs.'
  }
};

const BulkUploadDialog = ({
  open,
  onClose,
  uploadType,
  uploadFile,
  uploading,
  uploadResults,
  onFileChange,
  onUpload,
  onDownloadTemplate
}) => {
  const template = TEMPLATES[uploadType] || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Bulk Upload {template.name?.replace(' Template', 's')}</DialogTitle>
      <DialogContent>
        {/* Template Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="primary" gutterBottom>
            Mandatory Fields:
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {template.mandatory?.join(', ')}
          </Typography>
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
            Optional Fields:
          </Typography>
          <Typography variant="body2">
            {template.optional?.join(', ')}
          </Typography>
          
          {template.note && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {template.note}
            </Alert>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Download Template */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={() => onDownloadTemplate(uploadType)}
          >
            Download {template.name}
          </Button>
        </Box>

        {/* File Upload */}
        <Box sx={{ mb: 2 }}>
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => onFileChange(e.target.files[0])}
            style={{ display: 'none' }}
            id="bulk-upload-input"
          />
          <label htmlFor="bulk-upload-input">
            <Button
              variant="contained"
              component="span"
              startIcon={<UploadIcon />}
              sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
            >
              Select File
            </Button>
          </label>
          {uploadFile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {uploadFile.name}
            </Typography>
          )}
        </Box>

        {/* Upload Results */}
        {uploadResults && (
          <Alert 
            severity={uploadResults.errors?.length > 0 ? 'warning' : 'success'} 
            sx={{ mt: 2 }}
          >
            <Typography variant="subtitle2">
              Created: {uploadResults.success_count || uploadResults.created || 0}
            </Typography>
            {uploadResults.errors?.length > 0 && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Errors:</Typography>
                {uploadResults.errors.slice(0, 5).map((error, idx) => (
                  <Typography key={idx} variant="body2">
                    Row {error.row}: {error.error}
                  </Typography>
                ))}
                {uploadResults.errors.length > 5 && (
                  <Typography variant="body2">
                    ...and {uploadResults.errors.length - 5} more errors
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={onUpload}
          disabled={uploading || !uploadFile}
          sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
        >
          {uploading ? <CircularProgress size={24} /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BulkUploadDialog;
