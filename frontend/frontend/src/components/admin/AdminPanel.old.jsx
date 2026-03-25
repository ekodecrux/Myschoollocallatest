import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Divider,
  Link,
  FormHelperText,
  Switch,
  Tooltip
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  CreditCard as CreditCardIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { validateField, validateSchoolForm, getFieldConstraints, FIELD_RULES } from '../../utils/fieldValidation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

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
    mandatory: ['name', 'email', 'mobile_number'],  // school_code auto-filled for School Admin
    optional: ['school_code', 'address', 'city', 'state', 'postal_code'],
    sample: [
      { name: 'Teacher Name', email: 'teacher@school.com', mobile_number: '9876543210', school_code: 'SCH123456', address: '456 School Rd', city: 'Delhi', state: 'Delhi', postal_code: '110001' }
    ],
    note: 'Note: School code (e.g., SCH123456) will be auto-filled with your school code if left blank. Get the school code from Schools tab.'
  },
  students: {
    name: 'Students Template',
    mandatory: ['name', 'email', 'mobile_number', 'class_name', 'section'],  // school_code auto-filled for School Admin
    optional: ['school_code', 'roll_number', 'father_name', 'teacher_code', 'address', 'city', 'state', 'postal_code'],
    sample: [
      { name: 'Student Name', email: 'student@school.com', mobile_number: '9876543210', school_code: 'SCH123456', class_name: 'Class 5', section: 'A', roll_number: '101', father_name: 'Parent Name', teacher_code: '', address: '789 Home St', city: 'Bangalore', state: 'Karnataka', postal_code: '560001' }
    ],
    note: 'Note: School code (e.g., SCH123456) will be auto-filled with your school code if left blank. Get the school code from Schools tab. DO NOT enter city/location name.'
  }
};

const AdminPanel = () => {
  const { accessToken, userRole } = useSelector((state) => state.login);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({});
  const [schools, setSchools] = useState([]);
  
  // Bulk upload state
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState('');
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  
  // School form state
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState({
    name: '', adminEmail: '', adminName: '', adminPhone: '', city: '', state: '', postalCode: ''
  });
  const [schoolFormErrors, setSchoolFormErrors] = useState({});
  
  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Users without school codes state
  const [usersWithoutSchool, setUsersWithoutSchool] = useState([]);
  const [bulkSchoolCodeUpdates, setBulkSchoolCodeUpdates] = useState({});

  // Image approvals state
  const [pendingImages, setPendingImages] = useState([]);
  
  // Credit requests state
  const [creditRequests, setCreditRequests] = useState([]);
  
  // Teachers & Students state
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Edit/Delete user state
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/dashboard-stats`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [accessToken]);

  // Fetch schools
  const fetchSchools = useCallback(async () => {
    if (userRole !== 'SUPER_ADMIN') return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rest/schools/list`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setSchools(response.data.data || []);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  }, [accessToken, userRole]);

  // Fetch users without school codes (Super Admin only)
  const fetchUsersWithoutSchool = useCallback(async () => {
    if (userRole !== 'SUPER_ADMIN') return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rest/users/list?noSchoolCode=true`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUsersWithoutSchool(response.data.users || response.data || []);
    } catch (error) {
      console.error('Error fetching users without school:', error);
    }
  }, [accessToken, userRole]);

  // Fetch teachers
  const fetchTeachers = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rest/users/listUsersByRole?role=TEACHER&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setTeachers(response.data?.data?.users || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  }, [accessToken]);

  // Fetch students
  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rest/users/listUsersByRole?role=STUDENT&limit=100`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setStudents(response.data?.data?.users || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, [accessToken]);

  // Search users with semantic search
  const searchUsers = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      // Use enhanced semantic search endpoint
      const response = await axios.get(`${BACKEND_URL}/api/rest/users/semantic-search?query=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setUserSearchResults(response.data?.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback to regular search
      try {
        const fallbackResponse = await axios.get(`${BACKEND_URL}/api/rest/users/search?query=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setUserSearchResults(fallbackResponse.data?.users || []);
      } catch (fallbackError) {
        setUserSearchResults([]);
      }
    } finally {
      setSearchLoading(false);
    }
  }, [accessToken]);

  // Open edit user dialog
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      mobileNumber: user.mobileNumber || '',
      schoolCode: user.schoolCode || '',
      teacherCode: user.teacherCode || '',
      className: user.className || '',
      sectionName: user.sectionName || '',
      rollNumber: user.rollNumber || '',
      fatherName: user.fatherName || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      postalCode: user.postalCode || '',
      credits: user.credits || 0
    });
    setEditUserDialogOpen(true);
  };

  // Save edited user using new manage endpoint
  const handleSaveUser = async () => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/rest/users/manage`,
        { 
          action: 'edit',
          userId: editingUser.id, 
          data: editFormData 
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      setEditUserDialogOpen(false);
      setEditingUser(null);
      fetchTeachers();
      fetchStudents();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to update user', severity: 'error' });
    }
  };

  // Delete user using new manage endpoint
  const handleDeleteUser = async () => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/rest/users/manage`,
        { 
          action: 'delete',
          userId: userToDelete.id 
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchTeachers();
      fetchStudents();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to delete user', severity: 'error' });
    }
  };

  // Toggle user enabled/disabled status
  const handleToggleUserStatus = async (user) => {
    try {
      const newStatus = !user.disabled;
      await axios.post(
        `${BACKEND_URL}/api/rest/users/disableAccount`,
        { 
          userId: user.id,
          disable: newStatus
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ 
        open: true, 
        message: `User ${newStatus ? 'disabled' : 'enabled'} successfully`, 
        severity: 'success' 
      });
      fetchTeachers();
      fetchStudents();
      fetchStats();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to update user status', severity: 'error' });
    }
  };

  // Handle bulk school code update
  const handleBulkSchoolCodeUpdate = async () => {
    const updates = Object.entries(bulkSchoolCodeUpdates)
      .filter(([_, code]) => code && code.trim())
      .map(([userId, schoolCode]) => ({ userId, schoolCode }));
    
    if (updates.length === 0) {
      setSnackbar({ open: true, message: 'No school codes to update', severity: 'warning' });
      return;
    }

    try {
      const response = await axios.patch(
        `${BACKEND_URL}/api/rest/users/bulkUpdateSchoolCodes`,
        { updates },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ 
        open: true, 
        message: `Updated ${response.data.successCount} users successfully`, 
        severity: 'success' 
      });
      setBulkSchoolCodeUpdates({});
      fetchUsersWithoutSchool();
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.detail || 'Failed to update school codes', 
        severity: 'error' 
      });
    }
  };

  // Fetch pending image approvals
  const fetchPendingImages = useCallback(async () => {
    if (userRole !== 'SUPER_ADMIN') return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rest/images/admin/getPendingApprovals`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPendingImages(response.data.pendingImages || []);
    } catch (error) {
      console.error('Error fetching pending images:', error);
    }
  }, [accessToken, userRole]);

  // Fetch credit requests
  const fetchCreditRequests = useCallback(async () => {
    if (userRole !== 'SUPER_ADMIN') return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/rest/users/creditRequests`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setCreditRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching credit requests:', error);
    }
  }, [accessToken, userRole]);

  // Handle image approval
  const handleApproveImage = async (imageId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/rest/images/admin/approveImage`,
        { imageId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'Image approved successfully', severity: 'success' });
      fetchPendingImages();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to approve image', severity: 'error' });
    }
  };

  // Handle image rejection
  const handleRejectImage = async (imageId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/rest/images/admin/rejectImage`,
        { imageId, reason: 'Rejected by admin' },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'Image rejected', severity: 'info' });
      fetchPendingImages();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to reject image', severity: 'error' });
    }
  };

  // Handle credit request approval
  const handleApproveCreditRequest = async (requestId, approved) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/rest/users/approveCreditRequest`,
        { requestId, approved },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ 
        open: true, 
        message: approved ? 'Credit request approved' : 'Credit request rejected', 
        severity: approved ? 'success' : 'info' 
      });
      fetchCreditRequests();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to process request', severity: 'error' });
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSchools();
    fetchUsersWithoutSchool();
    fetchPendingImages();
    fetchCreditRequests();
    fetchTeachers();
    fetchStudents();
  }, [fetchStats, fetchSchools, fetchPendingImages, fetchCreditRequests, fetchTeachers, fetchStudents]);

  // Download template as CSV
  const downloadTemplate = (type) => {
    const template = TEMPLATES[type];
    if (!template) return;
    
    const allColumns = [...template.mandatory, ...template.optional];
    
    // Create CSV header with mandatory marker
    const headerRow = allColumns.map(col => 
      template.mandatory.includes(col) ? `${col}*` : col
    ).join(',');
    
    // Create sample row
    const sampleRow = allColumns.map(col => template.sample[0][col] || '').join(',');
    
    const csvContent = `${headerRow}\n${sampleRow}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Handle bulk upload
  const handleBulkUpload = async () => {
    if (!bulkUploadFile) return;
    
    setBulkUploading(true);
    const formData = new FormData();
    formData.append('file', bulkUploadFile);
    formData.append('type', bulkUploadType);
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/bulk-upload/${bulkUploadType}`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      setBulkUploadResults(response.data);
      setSnackbar({ open: true, message: `Successfully uploaded ${response.data.success_count || 0} records`, severity: 'success' });
      
      // Refresh the appropriate list based on upload type
      if (bulkUploadType === 'schools') {
        fetchSchools();
      } else if (bulkUploadType === 'teachers') {
        fetchTeachers();
      } else if (bulkUploadType === 'students') {
        fetchStudents();
      }
      fetchStats();
    } catch (error) {
      console.error('Bulk upload error:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.detail || 'Bulk upload failed', 
        severity: 'error' 
      });
    }
    setBulkUploading(false);
  };

  const openBulkUploadDialog = (type) => {
    setBulkUploadType(type);
    setBulkUploadFile(null);
    setBulkUploadResults(null);
    setBulkUploadDialogOpen(true);
  };

  // Field validation handlers
  const handleSchoolFieldChange = (field, value, validationField) => {
    setSchoolForm({ ...schoolForm, [field]: value });
    
    // Validate field
    const isRequired = ['name', 'adminEmail', 'adminName', 'adminPhone'].includes(field);
    const result = validateField(validationField, value, isRequired);
    
    setSchoolFormErrors(prev => ({
      ...prev,
      [field]: result.error
    }));
  };

  const validateSchoolFormFields = () => {
    const errors = {};
    
    // Validate School Name
    let result = validateField('schoolName', schoolForm.name, true);
    if (!result.isValid) errors.name = result.error;
    
    // Validate Admin Name
    result = validateField('userName', schoolForm.adminName, true);
    if (!result.isValid) errors.adminName = result.error;
    
    // Validate Admin Email
    result = validateField('email', schoolForm.adminEmail, true);
    if (!result.isValid) errors.adminEmail = result.error;
    
    // Validate Mobile Number
    result = validateField('mobileNumber', schoolForm.adminPhone, true);
    if (!result.isValid) errors.adminPhone = result.error;
    
    // Validate optional fields if provided
    if (schoolForm.city) {
      result = validateField('city', schoolForm.city, false);
      if (!result.isValid) errors.city = result.error;
    }
    if (schoolForm.state) {
      result = validateField('state', schoolForm.state, false);
      if (!result.isValid) errors.state = result.error;
    }
    if (schoolForm.postalCode) {
      result = validateField('postalCode', schoolForm.postalCode, false);
      if (!result.isValid) errors.postalCode = result.error;
    }
    
    setSchoolFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Create school
  const handleCreateSchool = async () => {
    // Validate all fields before submission
    if (!validateSchoolFormFields()) {
      setSnackbar({ open: true, message: 'Please fix the validation errors before submitting', severity: 'error' });
      return;
    }
    
    try {
      await axios.post(
        `${BACKEND_URL}/api/rest/users/add`,
        {
          userRole: 'SCHOOL_ADMIN',
          name: schoolForm.adminName,
          emailId: schoolForm.adminEmail,
          mobileNumber: schoolForm.adminPhone,
          schoolName: schoolForm.name,
          city: schoolForm.city,
          state: schoolForm.state,
          postalCode: schoolForm.postalCode
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'School created successfully! Login credentials sent to admin email.', severity: 'success' });
      setSchoolDialogOpen(false);
      setSchoolForm({ name: '', adminEmail: '', adminName: '', adminPhone: '', city: '', state: '', postalCode: '' });
      setSchoolFormErrors({});
      fetchSchools();
      fetchStats();
    } catch (error) {
      // Parse backend validation errors
      const errorDetail = error.response?.data?.detail;
      let errorMessage = 'Failed to create school';
      
      if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      } else if (Array.isArray(errorDetail)) {
        // Pydantic validation errors
        errorMessage = errorDetail.map(e => `${e.loc?.join(' > ')}: ${e.msg}`).join(', ');
      }
      
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        🎛️ Admin Panel
        {userRole === 'SUPER_ADMIN' && <Chip label="Super Admin" color="primary" size="small" />}
        {userRole === 'SCHOOL_ADMIN' && <Chip label="School Admin" color="secondary" size="small" />}
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.totalImages || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Images</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.totalUsers || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.totalStudents || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Students</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#fce4ec', height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{stats.totalTeachers || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Teachers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#e1f5fe', height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>{stats.activeUsers || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Active Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>{stats.disabledUsers || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Disabled Users</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          {userRole === 'SUPER_ADMIN' && <Tab icon={<BusinessIcon />} label="Schools" />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<PeopleIcon />} label="User Management" />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<ImageIcon />} label={`Image Approvals (${pendingImages.length})`} />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<CreditCardIcon />} label={`Credit Requests (${creditRequests.length})`} />}
          <Tab icon={<PersonIcon />} label="Bulk Teachers" />
          <Tab icon={<SchoolIcon />} label="Bulk Students" />
        </Tabs>

        {/* Schools Tab (Super Admin Only) */}
        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Schools ({schools.length})</Typography>
              <Box>
                <Button 
                  variant="outlined" 
                  startIcon={<UploadIcon />}
                  onClick={() => openBulkUploadDialog('schools')}
                  sx={{ mr: 1 }}
                >
                  Bulk Upload Schools
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => setSchoolDialogOpen(true)}
                >
                  Add School
                </Button>
              </Box>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell><strong>School Code</strong></TableCell>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell><strong>Admin Name</strong></TableCell>
                    <TableCell><strong>Admin Email</strong></TableCell>
                    <TableCell><strong>Mobile</strong></TableCell>
                    <TableCell><strong>City</strong></TableCell>
                    <TableCell><strong>State</strong></TableCell>
                    <TableCell><strong>Teachers</strong></TableCell>
                    <TableCell><strong>Students</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell><Chip label={school.schoolCode || school.code} size="small" color="primary" /></TableCell>
                      <TableCell>{school.name}</TableCell>
                      <TableCell>{school.adminName || '-'}</TableCell>
                      <TableCell>{school.adminEmail || '-'}</TableCell>
                      <TableCell>{school.adminPhone || school.mobile_number || '-'}</TableCell>
                      <TableCell>{school.city || '-'}</TableCell>
                      <TableCell>{school.state || '-'}</TableCell>
                      <TableCell>{school.teachersEnrolled || 0}</TableCell>
                      <TableCell>{school.studentsEnrolled || 0}</TableCell>
                      <TableCell>
                        <Chip 
                          label={school.isActive !== false ? 'Active' : 'Inactive'} 
                          color={school.isActive !== false ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        )}

        {/* User Management Tab (Super Admin Only) */}
        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Users Without School Code ({usersWithoutSchool.length})</Typography>
              <Button 
                variant="contained" 
                onClick={handleBulkSchoolCodeUpdate}
                disabled={Object.keys(bulkSchoolCodeUpdates).length === 0}
              >
                Save All Changes
              </Button>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              These users registered without a school code. Assign them to schools by entering the school code.
            </Alert>
            {usersWithoutSchool.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                All users have school codes assigned.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>School Code</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usersWithoutSchool.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email || user.emailId}</TableCell>
                        <TableCell>
                          <Chip label={user.role || user.userRole} size="small" color="primary" variant="outlined" />
                        </TableCell>
                        <TableCell>{user.mobileNumber || user.mobile_number || '-'}</TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            placeholder="Enter school code"
                            value={bulkSchoolCodeUpdates[user.id] || ''}
                            onChange={(e) => setBulkSchoolCodeUpdates(prev => ({
                              ...prev,
                              [user.id]: e.target.value
                            }))}
                            sx={{ width: 150 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        )}

        {/* Image Approvals Tab (Super Admin Only) */}
        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Pending Image Approvals ({pendingImages.length})</Typography>
              <Button variant="outlined" onClick={fetchPendingImages}>Refresh</Button>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Users submit images for approval. Approved images will be added to the resource library in their respective categories.
            </Alert>
            {pendingImages.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No pending images to review.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {pendingImages.map((image) => (
                  <Grid item xs={12} sm={6} md={4} key={image.id}>
                    <Card>
                      <Box sx={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
                        <img 
                          src={image.url} 
                          alt={image.title} 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                      <CardContent sx={{ pb: 1 }}>
                        <Typography variant="subtitle1" gutterBottom>{image.title}</Typography>
                        <Chip label={image.category} size="small" color="primary" sx={{ mr: 1 }} />
                        {image.subcategory && <Chip label={image.subcategory} size="small" variant="outlined" />}
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          By: {image.submitted_by_name || 'Unknown'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(image.submitted_at).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                      <Box sx={{ display: 'flex', gap: 1, p: 1, pt: 0 }}>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success"
                          startIcon={<CheckIcon />}
                          onClick={() => handleApproveImage(image.id)}
                          fullWidth
                        >
                          Approve
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          startIcon={<CloseIcon />}
                          onClick={() => handleRejectImage(image.id)}
                          fullWidth
                        >
                          Reject
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        )}

        {/* Credit Requests Tab (Super Admin Only) */}
        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Credit Purchase Requests ({creditRequests.length})</Typography>
              <Button variant="outlined" onClick={fetchCreditRequests}>Refresh</Button>
            </Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              School Admins can request additional credits. Approve to add credits to their account.
            </Alert>
            {creditRequests.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No pending credit requests.
              </Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell>Requester</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>School Code</TableCell>
                      <TableCell>Credits Requested</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creditRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.requester_name}</TableCell>
                        <TableCell>{request.requester_email}</TableCell>
                        <TableCell><Chip label={request.school_code} size="small" /></TableCell>
                        <TableCell>
                          <Typography fontWeight="bold" color="primary">{request.credits_requested}</Typography>
                        </TableCell>
                        <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            size="small" 
                            variant="contained" 
                            color="success"
                            onClick={() => handleApproveCreditRequest(request.id, true)}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="error"
                            onClick={() => handleApproveCreditRequest(request.id, false)}
                          >
                            Reject
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        )}

        {/* Bulk Teachers Tab */}
        <TabPanel value={tabValue} index={userRole === 'SUPER_ADMIN' ? 4 : 0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Teachers ({teachers.length})</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={() => downloadTemplate('teachers')}
                sx={{ mr: 1 }}
              >
                Download Template
              </Button>
              <Button 
                variant="contained" 
                startIcon={<UploadIcon />}
                onClick={() => openBulkUploadDialog('teachers')}
              >
                Upload Teachers
              </Button>
            </Box>
          </Box>
          
          {/* Search Box */}
          <TextField
            fullWidth
            placeholder="Search by name, email, mobile, code (TCH/STU/SCH), class, section..."
            value={userSearchQuery}
            onChange={(e) => {
              setUserSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          {/* Teachers Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Mobile</strong></TableCell>
                  <TableCell><strong>Teacher Code</strong></TableCell>
                  <TableCell><strong>School Code</strong></TableCell>
                  <TableCell><strong>School Name</strong></TableCell>
                  <TableCell><strong>Students</strong></TableCell>
                  <TableCell><strong>Credits</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN') && (
                    <TableCell><strong>Actions</strong></TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {(userSearchQuery.length >= 2 ? userSearchResults.filter(u => u.role === 'TEACHER') : teachers).map((teacher) => (
                  <TableRow key={teacher.id} sx={{ opacity: teacher.disabled ? 0.6 : 1, bgcolor: teacher.disabled ? '#fff3f3' : 'inherit' }}>
                    <TableCell>{teacher.name}</TableCell>
                    <TableCell>{teacher.email}</TableCell>
                    <TableCell>{teacher.mobileNumber}</TableCell>
                    <TableCell><Chip label={teacher.teacherCode || '-'} size="small" color="primary" variant="outlined" /></TableCell>
                    <TableCell>{teacher.schoolCode || '-'}</TableCell>
                    <TableCell>{teacher.schoolName || '-'}</TableCell>
                    <TableCell>{teacher.studentCount || 0}</TableCell>
                    <TableCell>{teacher.credits || 0}</TableCell>
                    <TableCell>
                      <Tooltip title={teacher.disabled ? 'Account Disabled - Click to Enable' : 'Account Active - Click to Disable'}>
                        <Chip 
                          icon={teacher.disabled ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          label={teacher.disabled ? 'Disabled' : 'Active'}
                          size="small"
                          color={teacher.disabled ? 'error' : 'success'}
                          variant="outlined"
                          onClick={() => handleToggleUserStatus(teacher)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </TableCell>
                    {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN') && (
                      <TableCell>
                        <Button size="small" onClick={() => handleEditUser(teacher)} sx={{ minWidth: 32 }}>
                          <EditIcon fontSize="small" />
                        </Button>
                        <Button size="small" color="error" onClick={() => { setUserToDelete(teacher); setDeleteConfirmOpen(true); }} sx={{ minWidth: 32 }}>
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(userSearchQuery.length >= 2 ? userSearchResults.filter(u => u.role === 'TEACHER') : teachers).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
                      {searchLoading ? 'Searching...' : 'No teachers found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Bulk Upload:</strong> Download template, fill details, and upload. Login credentials will be sent to each teacher&apos;s email.
          </Alert>
        </TabPanel>

        {/* Bulk Students Tab */}
        <TabPanel value={tabValue} index={userRole === 'SUPER_ADMIN' ? 5 : 1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Students ({students.length})</Typography>
            <Box>
              <Button 
                variant="outlined" 
                startIcon={<DownloadIcon />}
                onClick={() => downloadTemplate('students')}
                sx={{ mr: 1 }}
              >
                Download Template
              </Button>
              <Button 
                variant="contained" 
                startIcon={<UploadIcon />}
                onClick={() => openBulkUploadDialog('students')}
              >
                Upload Students
              </Button>
            </Box>
          </Box>
          
          {/* Search Box */}
          <TextField
            fullWidth
            placeholder="Search by name, email, student code, class, section, roll number..."
            value={userSearchQuery}
            onChange={(e) => {
              setUserSearchQuery(e.target.value);
              searchUsers(e.target.value);
            }}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          
          {/* Students Table */}
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Student Code</strong></TableCell>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>School Code</strong></TableCell>
                  <TableCell><strong>School Name</strong></TableCell>
                  <TableCell><strong>Teacher Code</strong></TableCell>
                  <TableCell><strong>Teacher Name</strong></TableCell>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell><strong>Roll No</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN') && (
                    <TableCell><strong>Actions</strong></TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {(userSearchQuery.length >= 2 ? userSearchResults.filter(u => u.role === 'STUDENT') : students).map((student) => (
                  <TableRow key={student.id} sx={{ opacity: student.disabled ? 0.6 : 1, bgcolor: student.disabled ? '#fff3f3' : 'inherit' }}>
                    <TableCell><Chip label={student.studentCode || '-'} size="small" color="secondary" variant="outlined" /></TableCell>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.schoolCode || '-'}</TableCell>
                    <TableCell>{student.schoolName || '-'}</TableCell>
                    <TableCell>{student.teacherCode || '-'}</TableCell>
                    <TableCell>{student.teacherName || '-'}</TableCell>
                    <TableCell>{student.className || '-'}</TableCell>
                    <TableCell>{student.sectionName || '-'}</TableCell>
                    <TableCell>{student.rollNumber || '-'}</TableCell>
                    <TableCell>
                      <Tooltip title={student.disabled ? 'Account Disabled - Click to Enable' : 'Account Active - Click to Disable'}>
                        <Chip 
                          icon={student.disabled ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          label={student.disabled ? 'Disabled' : 'Active'}
                          size="small"
                          color={student.disabled ? 'error' : 'success'}
                          variant="outlined"
                          onClick={() => handleToggleUserStatus(student)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </TableCell>
                    {(userRole === 'SUPER_ADMIN' || userRole === 'SCHOOL_ADMIN') && (
                      <TableCell>
                        <Button size="small" onClick={() => handleEditUser(student)} sx={{ minWidth: 32 }}>
                          <EditIcon fontSize="small" />
                        </Button>
                        <Button size="small" color="error" onClick={() => { setUserToDelete(student); setDeleteConfirmOpen(true); }} sx={{ minWidth: 32 }}>
                          <DeleteIcon fontSize="small" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {(userSearchQuery.length >= 2 ? userSearchResults.filter(u => u.role === 'STUDENT') : students).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={11} align="center">
                      {searchLoading ? 'Searching...' : 'No students found'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <strong>Bulk Upload:</strong> Download template, fill details, and upload. Login credentials will be sent to each student&apos;s email.
          </Alert>
        </TabPanel>
      </Paper>

      {/* School Dialog */}
      <Dialog open={schoolDialogOpen} onClose={() => { setSchoolDialogOpen(false); setSchoolFormErrors({}); }} maxWidth="sm" fullWidth>
        <DialogTitle>Create New School</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="School Name *"
              value={schoolForm.name}
              onChange={(e) => handleSchoolFieldChange('name', e.target.value, 'schoolName')}
              fullWidth
              error={!!schoolFormErrors.name}
              helperText={schoolFormErrors.name || 'Only alphabets, spaces, dots and hyphens (max 40 chars)'}
              inputProps={{ maxLength: 40 }}
            />
            <Divider><Chip label="Admin Details" size="small" /></Divider>
            <TextField
              label="Admin Name *"
              value={schoolForm.adminName}
              onChange={(e) => handleSchoolFieldChange('adminName', e.target.value, 'userName')}
              fullWidth
              error={!!schoolFormErrors.adminName}
              helperText={schoolFormErrors.adminName || 'Only alphabets and spaces (max 40 chars)'}
              inputProps={{ maxLength: 40 }}
            />
            <TextField
              label="Admin Email *"
              type="email"
              value={schoolForm.adminEmail}
              onChange={(e) => handleSchoolFieldChange('adminEmail', e.target.value, 'email')}
              fullWidth
              error={!!schoolFormErrors.adminEmail}
              helperText={schoolFormErrors.adminEmail || 'Auto-generated password will be sent to this email (max 30 chars)'}
              inputProps={{ maxLength: 30 }}
            />
            <TextField
              label="Mobile Number *"
              value={schoolForm.adminPhone}
              onChange={(e) => handleSchoolFieldChange('adminPhone', e.target.value.replace(/\D/g, ''), 'mobileNumber')}
              fullWidth
              error={!!schoolFormErrors.adminPhone}
              helperText={schoolFormErrors.adminPhone || 'Exactly 10 digits (numbers only)'}
              inputProps={{ maxLength: 10 }}
            />
            <Divider><Chip label="Location (Optional)" size="small" /></Divider>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="City"
                  value={schoolForm.city}
                  onChange={(e) => handleSchoolFieldChange('city', e.target.value, 'city')}
                  fullWidth
                  error={!!schoolFormErrors.city}
                  helperText={schoolFormErrors.city || 'Alphabets only (max 35 chars)'}
                  inputProps={{ maxLength: 35 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="State"
                  value={schoolForm.state}
                  onChange={(e) => handleSchoolFieldChange('state', e.target.value, 'state')}
                  fullWidth
                  error={!!schoolFormErrors.state}
                  helperText={schoolFormErrors.state || 'Alphabets only (max 35 chars)'}
                  inputProps={{ maxLength: 35 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Postal Code"
                  value={schoolForm.postalCode}
                  onChange={(e) => handleSchoolFieldChange('postalCode', e.target.value.replace(/\D/g, ''), 'postalCode')}
                  fullWidth
                  error={!!schoolFormErrors.postalCode}
                  helperText={schoolFormErrors.postalCode || 'Exactly 6 digits'}
                  inputProps={{ maxLength: 6 }}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSchoolDialogOpen(false); setSchoolFormErrors({}); }}>Cancel</Button>
          <Button 
            onClick={handleCreateSchool} 
            variant="contained"
            disabled={!schoolForm.name || !schoolForm.adminEmail || !schoolForm.adminName || !schoolForm.adminPhone || Object.values(schoolFormErrors).some(e => e)}
          >
            Create School
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadDialogOpen} onClose={() => setBulkUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Bulk Upload {bulkUploadType === 'schools' ? 'Schools' : bulkUploadType === 'teachers' ? 'Teachers' : 'Students'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {TEMPLATES[bulkUploadType] && (
              <Alert severity="info">
                <strong>Mandatory columns (marked with *):</strong> {TEMPLATES[bulkUploadType].mandatory.join(', ')}<br/>
                <strong>Optional columns:</strong> {TEMPLATES[bulkUploadType].optional.join(', ')}
                {TEMPLATES[bulkUploadType].note && (
                  <>
                    <br/><br/>
                    <strong style={{ color: '#ed6c02' }}>⚠️ {TEMPLATES[bulkUploadType].note}</strong>
                  </>
                )}
              </Alert>
            )}
            
            {(bulkUploadType === 'teachers' || bulkUploadType === 'students') && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <strong>Important:</strong> School Code is the unique code assigned to each school (e.g., SCH123456). 
                You can find it in the <strong>Schools</strong> tab. Do NOT enter city name, area name, or school name in this field.
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => downloadTemplate(bulkUploadType)}
              >
                Download Template
              </Button>
              <Typography variant="body2" color="text.secondary">
                Download and fill the template with your data
              </Typography>
            </Box>

            <Divider />

            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              {bulkUploadFile ? bulkUploadFile.name : 'Choose CSV/Excel File'}
              <input
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setBulkUploadFile(e.target.files[0])}
              />
            </Button>

            {bulkUploadResults && (
              <Alert severity={bulkUploadResults.error_count > 0 ? 'warning' : 'success'}>
                <strong>Upload Results:</strong><br/>
                ✅ Success: {bulkUploadResults.success_count || 0}<br/>
                ❌ Failed: {bulkUploadResults.error_count || 0}
                {bulkUploadResults.errors && bulkUploadResults.errors.length > 0 && (
                  <>
                    <br/><br/><strong>Errors:</strong>
                    <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                      {bulkUploadResults.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {bulkUploadResults.errors.length > 5 && (
                        <li>...and {bulkUploadResults.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </>
                )}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkUpload} 
            variant="contained" 
            disabled={bulkUploading || !bulkUploadFile}
            startIcon={bulkUploading && <CircularProgress size={20} />}
          >
            {bulkUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onClose={() => setEditUserDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit User: {editingUser?.name} ({editingUser?.role})</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 1 }}>
            <TextField
              label="Name"
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
              fullWidth
            />
            <TextField
              label="Email"
              value={editFormData.email || ''}
              disabled
              fullWidth
            />
            <TextField
              label="Mobile Number"
              value={editFormData.mobileNumber || ''}
              onChange={(e) => setEditFormData({...editFormData, mobileNumber: e.target.value})}
              fullWidth
            />
            <TextField
              label="Credits"
              type="number"
              value={editFormData.credits || 0}
              onChange={(e) => setEditFormData({...editFormData, credits: parseInt(e.target.value) || 0})}
              fullWidth
            />
            {userRole === 'SUPER_ADMIN' && (
              <TextField
                label="School Code"
                value={editFormData.schoolCode || ''}
                onChange={(e) => setEditFormData({...editFormData, schoolCode: e.target.value})}
                fullWidth
              />
            )}
            {userRole === 'SUPER_ADMIN' && editingUser?.role === 'TEACHER' && (
              <TextField
                label="Teacher Code"
                value={editFormData.teacherCode || ''}
                onChange={(e) => setEditFormData({...editFormData, teacherCode: e.target.value})}
                fullWidth
              />
            )}
            {(editingUser?.role === 'STUDENT') && (
              <>
                {userRole === 'SUPER_ADMIN' && (
                  <TextField
                    label="Teacher Code"
                    value={editFormData.teacherCode || ''}
                    onChange={(e) => setEditFormData({...editFormData, teacherCode: e.target.value})}
                    fullWidth
                  />
                )}
                <TextField
                  label="Class"
                  value={editFormData.className || ''}
                  onChange={(e) => setEditFormData({...editFormData, className: e.target.value})}
                  fullWidth
                />
                <TextField
                  label="Section"
                  value={editFormData.sectionName || ''}
                  onChange={(e) => setEditFormData({...editFormData, sectionName: e.target.value})}
                  fullWidth
                />
                <TextField
                  label="Roll Number"
                  value={editFormData.rollNumber || ''}
                  onChange={(e) => setEditFormData({...editFormData, rollNumber: e.target.value})}
                  fullWidth
                />
                <TextField
                  label="Father Name"
                  value={editFormData.fatherName || ''}
                  onChange={(e) => setEditFormData({...editFormData, fatherName: e.target.value})}
                  fullWidth
                />
              </>
            )}
            <TextField
              label="Address"
              value={editFormData.address || ''}
              onChange={(e) => setEditFormData({...editFormData, address: e.target.value})}
              fullWidth
            />
            <TextField
              label="City"
              value={editFormData.city || ''}
              onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
              fullWidth
            />
            <TextField
              label="State"
              value={editFormData.state || ''}
              onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
              fullWidth
            />
            <TextField
              label="Postal Code"
              value={editFormData.postalCode || ''}
              onChange={(e) => setEditFormData({...editFormData, postalCode: e.target.value})}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditUserDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel;
