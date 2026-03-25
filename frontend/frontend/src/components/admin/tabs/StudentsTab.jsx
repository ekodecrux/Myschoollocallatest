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
  TextField,
  Alert,
  Tooltip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  AccountBalanceWallet as CreditsIcon
} from '@mui/icons-material';

const StudentsTab = ({ 
  students,
  schools = [],
  userRole,
  searchQuery,
  searchResults,
  searchLoading,
  onSearch,
  onSearchChange,
  onBulkUpload,
  onEditUser,
  onDeleteUser,
  onToggleStatus,
  onManageCredits
}) => {
  const [schoolFilter, setSchoolFilter] = useState('');
  const [creditsDialog, setCreditsDialog] = useState({ open: false, user: null, credits: 0 });
  
  // Filter by search and school
  let displayStudents = searchQuery.length >= 2 
    ? searchResults.filter(u => u.role === 'STUDENT') 
    : students;
  
  if (schoolFilter) {
    displayStudents = displayStudents.filter(s => s.schoolCode === schoolFilter);
  }

  const handleCreditsOpen = (student) => {
    setCreditsDialog({ open: true, user: student, credits: student.credits || 0 });
  };

  const handleCreditsClose = () => {
    setCreditsDialog({ open: false, user: null, credits: 0 });
  };

  const handleCreditsSave = () => {
    if (onManageCredits && creditsDialog.user) {
      onManageCredits(creditsDialog.user.id, creditsDialog.credits);
    }
    handleCreditsClose();
  };

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => onBulkUpload('students')}
          sx={{ '&:hover': { backgroundColor: 'primary.main', color: 'white' } }}
        >
          Bulk Upload Students
        </Button>
        
        {/* School Filter */}
        {userRole === 'SUPER_ADMIN' && schools.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Filter by School</InputLabel>
            <Select
              value={schoolFilter}
              label="Filter by School"
              onChange={(e) => setSchoolFilter(e.target.value)}
            >
              <MenuItem value="">All Schools</MenuItem>
              {schools.map(school => (
                <MenuItem key={school.code} value={school.code}>
                  {school.name} ({school.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Search Box */}
      <TextField
        fullWidth
        placeholder="Search by name, email, student code, class, section, roll number..."
        value={searchQuery}
        onChange={(e) => {
          onSearchChange(e.target.value);
          onSearch(e.target.value);
        }}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>
        }}
      />

      {/* Students Table - School Code/Name at beginning (Issue 34) */}
      <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100 }}><strong>School Code</strong></TableCell>
              <TableCell sx={{ minWidth: 150 }}><strong>School Name</strong></TableCell>
              <TableCell sx={{ minWidth: 100 }}><strong>Student Code</strong></TableCell>
              <TableCell sx={{ minWidth: 150 }}><strong>Name</strong></TableCell>
              <TableCell sx={{ minWidth: 100 }}><strong>Teacher Code</strong></TableCell>
              <TableCell sx={{ minWidth: 80 }}><strong>Class</strong></TableCell>
              <TableCell sx={{ minWidth: 80 }}><strong>Section</strong></TableCell>
              <TableCell sx={{ minWidth: 80 }}><strong>Roll No</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 100 }}><strong>Credits</strong></TableCell>
              <TableCell sx={{ minWidth: 100 }}><strong>Status</strong></TableCell>
              {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN' || userRole === 'TEACHER') && (
                <TableCell sx={{ minWidth: 150 }}><strong>Actions</strong></TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayStudents.map((student) => (
              <TableRow 
                key={student.id} 
                sx={{ 
                  opacity: student.disabled ? 0.6 : 1, 
                  bgcolor: student.disabled ? '#fff3f3' : 'inherit' 
                }}
              >
                <TableCell>
                  <Chip label={student.schoolCode || student.school_code || '-'} size="small" color="secondary" variant="outlined" />
                </TableCell>
                <TableCell>{student.schoolName || student.school_name || '-'}</TableCell>
                <TableCell>
                  <Chip label={student.studentCode || student.student_code || '-'} size="small" color="info" variant="outlined" />
                </TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.teacherCode || student.teacher_code || '-'}</TableCell>
                <TableCell>{student.className || student.class_name || '-'}</TableCell>
                <TableCell>{student.sectionName || student.section_name || '-'}</TableCell>
                <TableCell>{student.rollNumber || student.roll_number || '-'}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={student.credits || 0} 
                    size="small" 
                    color="info"
                    icon={<CreditsIcon fontSize="small" />}
                    onClick={() => handleCreditsOpen(student)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={student.disabled ? 'Account Disabled - Click to Enable' : 'Account Active - Click to Disable'}>
                    <Chip 
                      icon={student.disabled ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      label={student.disabled ? 'Disabled' : 'Active'}
                      size="small"
                      color={student.disabled ? 'error' : 'success'}
                      variant="outlined"
                      onClick={() => onToggleStatus(student)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Tooltip>
                </TableCell>
                {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN' || userRole === 'TEACHER') && (
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEditUser(student)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Manage Credits">
                      <IconButton size="small" color="info" onClick={() => handleCreditsOpen(student)}>
                        <CreditsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => onDeleteUser(student)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {displayStudents.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  {searchLoading ? 'Searching...' : 'No students found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Manage Credits Dialog (Issue 36) */}
      <Dialog open={creditsDialog.open} onClose={handleCreditsClose} maxWidth="xs" fullWidth>
        <DialogTitle>Manage Credits - {creditsDialog.user?.name}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="number"
            label="Credits"
            value={creditsDialog.credits}
            onChange={(e) => setCreditsDialog({ ...creditsDialog, credits: parseInt(e.target.value) || 0 })}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><CreditsIcon /></InputAdornment>
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreditsClose}>Cancel</Button>
          <Button variant="contained" onClick={handleCreditsSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Alert severity="info" sx={{ mt: 2 }}>
        <strong>Bulk Upload:</strong> Download template (includes teacher_code column), fill details, and upload. Students will be assigned to teachers based on teacher code.
      </Alert>
    </Box>
  );
};

export default StudentsTab;
