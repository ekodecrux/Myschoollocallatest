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

const TeachersTab = ({ 
  teachers,
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
  
  // Filter by search and school (Issue 24)
  let displayTeachers = searchQuery.length >= 2 
    ? searchResults.filter(u => u.role === 'TEACHER') 
    : teachers;
  
  if (schoolFilter) {
    displayTeachers = displayTeachers.filter(t => t.schoolCode === schoolFilter);
  }

  const handleCreditsOpen = (teacher) => {
    setCreditsDialog({ open: true, user: teacher, credits: teacher.credits || 0 });
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
          onClick={() => onBulkUpload('teachers')}
          sx={{ '&:hover': { backgroundColor: 'primary.main', color: 'white' } }}
        >
          Bulk Upload Teachers
        </Button>
        
        {/* School Filter (Issue 24) */}
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
        placeholder="Search by name, email, teacher code, school..."
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

      {/* Teachers Table - School Code/Name at beginning (Issue 22) */}
      <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ minWidth: 100 }}><strong>School Code</strong></TableCell>
              <TableCell sx={{ minWidth: 150 }}><strong>School Name</strong></TableCell>
              <TableCell sx={{ minWidth: 150 }}><strong>Name</strong></TableCell>
              <TableCell sx={{ minWidth: 180 }}><strong>Email</strong></TableCell>
              <TableCell sx={{ minWidth: 120 }}><strong>Mobile</strong></TableCell>
              <TableCell sx={{ minWidth: 100 }}><strong>Teacher Code</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 80 }}><strong>Students</strong></TableCell>
              <TableCell align="center" sx={{ minWidth: 100 }}><strong>Credits</strong></TableCell>
              <TableCell sx={{ minWidth: 100 }}><strong>Status</strong></TableCell>
              {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN') && (
                <TableCell sx={{ minWidth: 150 }}><strong>Actions</strong></TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {displayTeachers.map((teacher) => (
              <TableRow 
                key={teacher.id} 
                sx={{ 
                  opacity: teacher.disabled ? 0.6 : 1, 
                  bgcolor: teacher.disabled ? '#fff3f3' : 'inherit' 
                }}
              >
                <TableCell>
                  <Chip label={teacher.schoolCode || '-'} size="small" color="secondary" variant="outlined" />
                </TableCell>
                <TableCell>{teacher.schoolName || '-'}</TableCell>
                <TableCell>{teacher.name}</TableCell>
                <TableCell>{teacher.email}</TableCell>
                <TableCell>{teacher.mobileNumber || teacher.mobile_number || '-'}</TableCell>
                <TableCell>
                  <Chip label={teacher.teacherCode || teacher.teacher_code || '-'} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell align="center">{teacher.studentCount || teacher.student_count || 0}</TableCell>
                <TableCell align="center">
                  <Chip 
                    label={teacher.credits || 0} 
                    size="small" 
                    color="info"
                    icon={<CreditsIcon fontSize="small" />}
                    onClick={() => handleCreditsOpen(teacher)}
                    sx={{ cursor: 'pointer' }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title={teacher.disabled ? 'Account Disabled - Click to Enable' : 'Account Active - Click to Disable'}>
                    <Chip 
                      icon={teacher.disabled ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                      label={teacher.disabled ? 'Disabled' : 'Active'}
                      size="small"
                      color={teacher.disabled ? 'error' : 'success'}
                      variant="outlined"
                      onClick={() => onToggleStatus(teacher)}
                      sx={{ cursor: 'pointer' }}
                    />
                  </Tooltip>
                </TableCell>
                {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN') && (
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => onEditUser(teacher)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Manage Credits">
                      <IconButton size="small" color="info" onClick={() => handleCreditsOpen(teacher)}>
                        <CreditsIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => onDeleteUser(teacher)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                )}
              </TableRow>
            ))}
            {displayTeachers.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  {searchLoading ? 'Searching...' : 'No teachers found'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Manage Credits Dialog (Issue 23, 33) */}
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
        <strong>Bulk Upload:</strong> Download template, fill details, and upload. Login credentials will be sent to each teacher&apos;s email.
      </Alert>
    </Box>
  );
};

export default TeachersTab;
