import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  People as PeopleIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Image as ImageIcon,
  CreditCard as CreditCardIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Import custom hooks
import { useAdminData, useUserSearch } from './hooks/useAdminData';

// Import tab components
import {
  SchoolsTab,
  TeachersTab,
  StudentsTab,
  UserManagementTab,
  ImageApprovalsTab,
  CreditRequestsTab,
  AnalyticsTab,
  UserLogsTab,
  SalesPlansTab
} from './tabs';

// Import dialog components
import {
  SchoolFormDialog,
  BulkUploadDialog,
  EditUserDialog,
  DeleteConfirmDialog
} from './dialogs';

// Import credits display
import CreditsDisplay from '../common/CreditsDisplay';

import { validateField, FIELD_RULES } from '../../utils/fieldValidation';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPanel = () => {
  const { accessToken, userRole } = useSelector((state) => state.login);
  const [tabValue, setTabValue] = useState(0);
  
  // Use custom hooks for data fetching
  const {
    stats,
    schools,
    teachers,
    students,
    usersWithoutSchool,
    pendingImages,
    creditRequests,
    fetchStats,
    fetchSchools,
    fetchTeachers,
    fetchStudents,
    fetchUsersWithoutSchool,
    fetchPendingImages,
    fetchCreditRequests,
    fetchAllData
  } = useAdminData(accessToken, userRole);

  const {
    searchQuery,
    setSearchQuery,
    searchResults,
    searchLoading,
    searchUsers
  } = useUserSearch(accessToken);

  // Dialog states
  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState('');
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Form states
  const [schoolForm, setSchoolForm] = useState({
    name: '', adminEmail: '', adminName: '', adminPhone: '', city: '', state: '', postalCode: ''
  });
  const [schoolFormErrors, setSchoolFormErrors] = useState({});
  const [bulkSchoolCodeUpdates, setBulkSchoolCodeUpdates] = useState({});

  // Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Load data on mount
  useEffect(() => {
    fetchAllData();
    if (userRole === 'SUPER_ADMIN') {
      fetchUsersWithoutSchool();
    }
  }, [fetchAllData, fetchUsersWithoutSchool, userRole]);

  // School form validation
  const validateSchoolField = (field, value) => {
    const rules = {
      name: { required: true, maxLength: 40 },
      adminName: { required: true, maxLength: 40 },
      adminEmail: { required: true, maxLength: 30, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
      adminPhone: { required: true, exactLength: 10, pattern: /^\d{10}$/ },
      city: { maxLength: 35 },
      state: { maxLength: 35 }
    };

    const rule = rules[field];
    if (!rule) return '';

    if (rule.required && !value) return 'This field is required';
    if (rule.maxLength && value?.length > rule.maxLength) return `Maximum ${rule.maxLength} characters`;
    if (rule.exactLength && value?.length !== rule.exactLength) return `Must be exactly ${rule.exactLength} digits`;
    if (rule.pattern && value && !rule.pattern.test(value)) {
      if (field === 'adminEmail') return 'Invalid email format';
      if (field === 'adminPhone') return 'Must be 10 digits';
    }
    return '';
  };

  const handleSchoolFormChange = (field, value) => {
    setSchoolForm(prev => ({ ...prev, [field]: value }));
    setSchoolFormErrors(prev => ({ ...prev, [field]: validateSchoolField(field, value) }));
  };

  // Create school
  const handleCreateSchool = async () => {
    // Validate all fields
    const errors = {};
    Object.keys(schoolForm).forEach(field => {
      const error = validateSchoolField(field, schoolForm[field]);
      if (error) errors[field] = error;
    });
    
    if (Object.keys(errors).length > 0) {
      setSchoolFormErrors(errors);
      setSnackbar({ open: true, message: 'Please fix validation errors', severity: 'error' });
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
      setSnackbar({ open: true, message: 'School created successfully!', severity: 'success' });
      setSchoolDialogOpen(false);
      setSchoolForm({ name: '', adminEmail: '', adminName: '', adminPhone: '', city: '', state: '', postalCode: '' });
      fetchSchools();
      fetchStats();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to create school', severity: 'error' });
    }
  };

  // Bulk upload
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
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' } }
      );
      setBulkUploadResults(response.data);
      setSnackbar({ open: true, message: `Successfully uploaded ${response.data.success_count || 0} records`, severity: 'success' });
      
      // Refresh appropriate list
      if (bulkUploadType === 'schools') fetchSchools();
      else if (bulkUploadType === 'teachers') fetchTeachers();
      else if (bulkUploadType === 'students') fetchStudents();
      fetchStats();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Upload failed', severity: 'error' });
    }
    setBulkUploading(false);
  };

  const openBulkUploadDialog = (type) => {
    setBulkUploadType(type);
    setBulkUploadFile(null);
    setBulkUploadResults(null);
    setBulkUploadDialogOpen(true);
  };

  const downloadTemplate = (type) => {
    const templates = {
      schools: ['school_name*', 'admin_email*', 'admin_name*', 'mobile_number*', 'principal_name', 'address', 'city', 'state', 'postal_code'],
      teachers: ['name*', 'email*', 'mobile_number*', 'school_code', 'address', 'city', 'state', 'postal_code'],
      students: ['name*', 'email*', 'mobile_number*', 'school_code*', 'teacher_code*', 'class_name*', 'section_name', 'roll_number']
    };
    const headers = templates[type] || [];
    const csvContent = headers.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
  };

  // Edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      mobileNumber: user.mobileNumber,
      className: user.className,
      sectionName: user.sectionName,
      rollNumber: user.rollNumber,
      credits: user.credits || 0
    });
    setEditUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/rest/users/manage`,
        { action: 'update', userId: editingUser.id, ...editFormData },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      setEditUserDialogOpen(false);
      fetchTeachers();
      fetchStudents();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to update user', severity: 'error' });
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      await axios.put(
        `${BACKEND_URL}/api/rest/users/manage`,
        { action: 'delete', userId: userToDelete.id },
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

  // Toggle user status
  const handleToggleUserStatus = async (user) => {
    try {
      const newStatus = !user.disabled;
      await axios.post(
        `${BACKEND_URL}/api/rest/users/disableAccount`,
        { userId: user.id, disable: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: `User ${newStatus ? 'disabled' : 'enabled'} successfully`, severity: 'success' });
      fetchTeachers();
      fetchStudents();
      fetchStats();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to update user status', severity: 'error' });
    }
  };

  // Bulk school code update
  const handleBulkSchoolCodeUpdate = async () => {
    const updates = Object.entries(bulkSchoolCodeUpdates)
      .filter(([_, code]) => code && code.trim())
      .map(([userId, schoolCode]) => ({ userId, schoolCode }));

    if (updates.length === 0) {
      setSnackbar({ open: true, message: 'No school codes to update', severity: 'warning' });
      return;
    }

    try {
      await axios.patch(
        `${BACKEND_URL}/api/rest/users/bulkUpdateSchoolCodes`,
        { updates },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'School codes updated successfully', severity: 'success' });
      setBulkSchoolCodeUpdates({});
      fetchUsersWithoutSchool();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Failed to update school codes', severity: 'error' });
    }
  };

  // Image approval/rejection
  const handleApproveImage = async (imageId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/rest/images/admin/approveImage`,
        { imageId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'Image approved', severity: 'success' });
      fetchPendingImages();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to approve image', severity: 'error' });
    }
  };

  const handleRejectImage = async (imageId) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/rest/images/admin/rejectImage`,
        { imageId },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: 'Image rejected', severity: 'success' });
      fetchPendingImages();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to reject image', severity: 'error' });
    }
  };

  // Credit request approval
  const handleApproveCreditRequest = async (requestId, approved) => {
    try {
      await axios.post(
        `${BACKEND_URL}/api/rest/users/approveCreditRequest`,
        { requestId, approved },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setSnackbar({ open: true, message: `Credit request ${approved ? 'approved' : 'rejected'}`, severity: 'success' });
      fetchCreditRequests();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to process request', severity: 'error' });
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
          🎛️ Admin Panel
          {userRole === 'SUPER_ADMIN' && <Chip label="Super Admin" color="primary" size="small" />}
          {userRole === 'SCHOOL_ADMIN' && <Chip label="School Admin" color="secondary" size="small" />}
        </Typography>
        {/* Real-time Credits Display */}
        <CreditsDisplay showLabel={true} size="medium" refreshInterval={15000} />
      </Box>

      {/* Stats Cards - Responsive Grid */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, md: 3 } }}>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{stats.totalImages || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Total Images</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{stats.totalUsers || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Total Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#fff3e0', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{stats.totalStudents || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Students</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#fce4ec', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{stats.totalTeachers || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Teachers</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#e1f5fe', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{stats.activeUsers || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Active Users</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2}>
          <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main', fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>{stats.disabledUsers || 0}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Disabled Users</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs - Responsive */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, v) => setTabValue(v)} 
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { 
              minWidth: { xs: 'auto', sm: 80 }, 
              fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
              p: { xs: '6px 8px', sm: '12px 16px' }
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {userRole === 'SUPER_ADMIN' && <Tab icon={<AnalyticsIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label="Analytics" />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<BusinessIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label="Schools" />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<PeopleIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label="Users" />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<ImageIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label={`Images (${pendingImages?.length || 0})`} />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<CreditCardIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label={`Credits (${creditRequests?.length || 0})`} />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<HistoryIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label="User Logs" />}
          {userRole === 'SUPER_ADMIN' && <Tab icon={<MoneyIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label="Sales Plans" />}
          <Tab icon={<PersonIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label="Teachers" />
          <Tab icon={<PersonIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />} label="Students" />
        </Tabs>

        {/* Tab Panels */}
        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={0}>
            <AnalyticsTab accessToken={accessToken} />
          </TabPanel>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={1}>
            <SchoolsTab
              schools={schools}
              onAddSchool={() => setSchoolDialogOpen(true)}
              onBulkUpload={openBulkUploadDialog}
            />
          </TabPanel>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={2}>
            <UserManagementTab
              usersWithoutSchool={usersWithoutSchool}
              bulkSchoolCodeUpdates={bulkSchoolCodeUpdates}
              onBulkSchoolCodeUpdate={handleBulkSchoolCodeUpdate}
              onSchoolCodeChange={(userId, code) => setBulkSchoolCodeUpdates(prev => ({ ...prev, [userId]: code }))}
            />
          </TabPanel>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={3}>
            <ImageApprovalsTab
              pendingImages={pendingImages}
              onApprove={handleApproveImage}
              onReject={handleRejectImage}
            />
          </TabPanel>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={4}>
            <CreditRequestsTab
              creditRequests={creditRequests}
              onApprove={handleApproveCreditRequest}
            />
          </TabPanel>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={5}>
            <UserLogsTab accessToken={accessToken} />
          </TabPanel>
        )}

        {userRole === 'SUPER_ADMIN' && (
          <TabPanel value={tabValue} index={6}>
            <SalesPlansTab accessToken={accessToken} />
          </TabPanel>
        )}

        <TabPanel value={tabValue} index={userRole === 'SUPER_ADMIN' ? 7 : 0}>
          <TeachersTab
            teachers={teachers}
            userRole={userRole}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searchLoading={searchLoading}
            onSearch={searchUsers}
            onSearchChange={setSearchQuery}
            onBulkUpload={openBulkUploadDialog}
            onEditUser={handleEditUser}
            onDeleteUser={(user) => { setUserToDelete(user); setDeleteConfirmOpen(true); }}
            onToggleStatus={handleToggleUserStatus}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={userRole === 'SUPER_ADMIN' ? 8 : 1}>
          <StudentsTab
            students={students}
            userRole={userRole}
            searchQuery={searchQuery}
            searchResults={searchResults}
            searchLoading={searchLoading}
            onSearch={searchUsers}
            onSearchChange={setSearchQuery}
            onBulkUpload={openBulkUploadDialog}
            onEditUser={handleEditUser}
            onDeleteUser={(user) => { setUserToDelete(user); setDeleteConfirmOpen(true); }}
            onToggleStatus={handleToggleUserStatus}
          />
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      <SchoolFormDialog
        open={schoolDialogOpen}
        onClose={() => setSchoolDialogOpen(false)}
        schoolForm={schoolForm}
        schoolFormErrors={schoolFormErrors}
        onFormChange={handleSchoolFormChange}
        onSubmit={handleCreateSchool}
      />

      <BulkUploadDialog
        open={bulkUploadDialogOpen}
        onClose={() => setBulkUploadDialogOpen(false)}
        uploadType={bulkUploadType}
        uploadFile={bulkUploadFile}
        uploading={bulkUploading}
        uploadResults={bulkUploadResults}
        onFileChange={setBulkUploadFile}
        onUpload={handleBulkUpload}
        onDownloadTemplate={downloadTemplate}
      />

      <EditUserDialog
        open={editUserDialogOpen}
        onClose={() => setEditUserDialogOpen(false)}
        editingUser={editingUser}
        editFormData={editFormData}
        onFormChange={(field, value) => setEditFormData(prev => ({ ...prev, [field]: value }))}
        onSave={handleSaveUser}
      />

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        user={userToDelete}
        onConfirm={handleDeleteUser}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel;
