import React, { useState } from 'react';
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
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon
} from '@mui/icons-material';

const SchoolsTab = ({ 
  schools, 
  onAddSchool, 
  onBulkUpload 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter schools by name (Issue 19)
  const filteredSchools = schools.filter(school => 
    school.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Format location without trailing comma (Issue 18)
  const formatLocation = (city, state) => {
    const parts = [city, state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : '-';
  };
  
  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddSchool}
          sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
        >
          Add School
        </Button>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => onBulkUpload('schools')}
        >
          Bulk Upload Schools
        </Button>
        <TextField
          size="small"
          placeholder="Search by school name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 250 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
          }}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>School Code</strong></TableCell>
              <TableCell><strong>School Name</strong></TableCell>
              <TableCell><strong>Principal Name</strong></TableCell>
              <TableCell><strong>Admin Email</strong></TableCell>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="center"><strong>Teachers</strong></TableCell>
              <TableCell align="center"><strong>Students</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSchools.map((school) => (
              <TableRow key={school.id}>
                <TableCell>
                  <Chip label={school.code} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>{school.name}</TableCell>
                <TableCell>{school.principalName || school.principal_name || '-'}</TableCell>
                <TableCell>{school.adminEmail || school.admin_email || '-'}</TableCell>
                <TableCell>{formatLocation(school.city, school.state)}</TableCell>
                <TableCell>
                  <Chip 
                    label={school.is_active !== false ? 'Active' : 'Inactive'} 
                    size="small" 
                    color={school.is_active !== false ? 'success' : 'error'}
                  />
                </TableCell>
                <TableCell align="center">{school.teachersEnrolled || school.teacher_count || 0}</TableCell>
                <TableCell align="center">{school.studentsEnrolled || school.student_count || 0}</TableCell>
              </TableRow>
            ))}
            {filteredSchools.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  {searchQuery ? 'No schools found matching your search' : 'No schools found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Note:</strong> Each school admin will receive login credentials via email after creation.
      </Alert>
    </Box>
  );
};

export default SchoolsTab;
