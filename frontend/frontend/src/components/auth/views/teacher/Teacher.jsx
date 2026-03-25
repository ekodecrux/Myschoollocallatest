import * as React from "react";
import TeachersIcon from "../../../../assests/auth/teachersIcon.svg";
import { ReactComponent as AddIcon } from "../../../../assests/AddIcon.svg";
import { ReactComponent as ImportExcelIcon } from "../../../../assests/ImportExcelIcon.svg";
import { Button, FormControl, FormControlLabel, Radio, RadioGroup, Typography, Select, MenuItem, InputLabel, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Snackbar } from "@mui/material";
import AuthSearchField from "../../../../customTheme/authSearchField/AuthSearchField";
import { DataGrid } from "@mui/x-data-grid";
import { teacherColumns, getTeacherColumns, teacherMobileViewColumns } from './constant'
import { useNavigate } from "react-router-dom";
import { BrowserView, isMobile, MobileView } from "react-device-detect";
import { useDispatch, useSelector } from "react-redux";
import { ListUsers, updateUsers } from "../../../../redux/fetchUsersSlice";
import { RefreshToken } from "../../../../redux/authSlice";
import AddNewTeacher from "./addNewTeacher/AddNewTeacher"
import axios from "axios";

export default function Teacher() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = React.useState();
  const [addNewTeacher, setAddNewTeacher] = React.useState(false);
  const [editingTeacher, setEditingTeacher] = React.useState(null);
  const [schools, setSchools] = React.useState([]);
  const [selectedSchool, setSelectedSchool] = React.useState('');
  const { hasMore, usersList, loading } = useSelector((state) => state.usersList)
  const { accessToken, refreshToken, tokenExpiry, userRole } = useSelector((state) => state.login)
  
  // Bulk Upload State
  const [bulkUploadOpen, setBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState(null);
  const [bulkUploading, setBulkUploading] = React.useState(false);
  const [bulkResults, setBulkResults] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  
  // Handle Edit Teacher
  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher);
    setAddNewTeacher(true);
  };
  
  // Fetch schools list for Super Admin filter
  React.useEffect(() => {
    if (userRole === 'SUPER_ADMIN') {
      const fetchSchools = async () => {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/rest/schools/list?limit=500`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          if (response.data?.data) {
            // Transform to ensure consistent 'code' field
            const schoolsData = response.data.data.map(s => ({
              ...s,
              code: s.schoolCode || s.code
            }));
            setSchools(schoolsData);
          }
        } catch (err) {
          console.error('Failed to fetch schools:', err);
        }
      };
      fetchSchools();
    }
  }, [userRole, accessToken]);
  
  // Download Template
  const handleDownloadTemplate = () => {
    const headers = userRole === 'SUPER_ADMIN' 
      ? ['name*', 'email*', 'mobile_number*', 'school_code*', 'address', 'city', 'state']
      : ['name*', 'email*', 'mobile_number*', 'address', 'city', 'state'];
    const sample = userRole === 'SUPER_ADMIN'
      ? ['John Teacher', 'teacher@school.com', '9876543210', 'SCH001', '123 Main St', 'Mumbai', 'Maharashtra']
      : ['John Teacher', 'teacher@school.com', '9876543210', '123 Main St', 'Mumbai', 'Maharashtra'];
    const csvContent = headers.join(',') + '\n' + sample.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  const handleFetchData = React.useCallback((schoolCode = '') => {
    let header = {
      "Content-Type": "application/json",
      'Accept': 'application/json',
      "Authorization": `Bearer ${accessToken}`
    }
    let data = {
      role: "TEACHER",
      limit: 100
    }
    if (schoolCode) {
      data.schoolCode = schoolCode;
    }
    let timestamp = Math.ceil(Date.now() / 1000)
    if (tokenExpiry < timestamp) {
      dispatch(RefreshToken({
        headers: header,
        body: {
          "refreshToken": refreshToken
        }
      })).then(() => {
        dispatch(ListUsers({
          url: "/rest/users/listUsersByRole",
          headers: header,
          method: "GET",
          body: data
        }))
      })
    } else {
      dispatch(ListUsers({
        url: "/rest/users/listUsersByRole",
        headers: header,
        method: "GET",
        body: data
      }))
    }
  }, [accessToken, tokenExpiry, refreshToken, dispatch]);
  
  // Handle Bulk Upload
  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    const formData = new FormData();
    formData.append('file', bulkFile);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/bulk-upload/teachers`,
        formData,
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' } }
      );
      setBulkResults(response.data);
      // Only close dialog if no errors - Issue 4: Show error reasons
      if (response.data.error_count === 0 || !response.data.errors || response.data.errors.length === 0) {
        setSnackbar({ open: true, message: `Created ${response.data.success_count || 0} teachers successfully!`, severity: 'success' });
        setBulkUploadOpen(false);
        setBulkFile(null);
        setBulkResults(null);
        handleFetchData();
      } else {
        // Keep dialog open to show errors
        setSnackbar({ open: true, message: `Upload completed with ${response.data.error_count || 0} errors. Check details below.`, severity: 'warning' });
        handleFetchData();
      }
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Upload failed', severity: 'error' });
    }
    setBulkUploading(false);
  };
  
  const handleAddNewTeacher = () => {
    setAddNewTeacher(true);
  }
  const handleSearchText = (e) => {
    setSearchText(e.target.value);
  }
  const handleSchoolFilterChange = (e) => {
    setSelectedSchool(e.target.value);
    // Refetch with school filter
    handleFetchData(e.target.value);
  }
  const handleSearch = async () => {
    if (!searchText || searchText.trim().length < 2) {
      handleFetchData(selectedSchool);
      return;
    }
    
    // Use the search endpoint for robust search across multiple fields
    try {
      let searchUrl = `${process.env.REACT_APP_BACKEND_URL}/api/rest/users/search?query=${encodeURIComponent(searchText)}&role=TEACHER&limit=100`;
      const response = await axios.get(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Transform results to match expected format
      const users = (response.data?.users || []).map(user => ({
        ...user,
        userId: user.id,
        emailId: user.email
      }));
      
      // Update the redux store
      dispatch(updateUsers(users));
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to regular fetch
      handleFetchData(selectedSchool);
    }
  }
  React.useEffect(() => handleFetchData(), [handleFetchData]);
  if (addNewTeacher) {
    return (
      <AddNewTeacher
        editingTeacher={editingTeacher}
        handleCancel={() => {
          setAddNewTeacher(false);
          setEditingTeacher(null);
          handleFetchData(selectedSchool); // Refresh list when returning
        }}
        onTeacherAdded={() => {
          // Auto-refresh the list after adding/editing a teacher
          handleFetchData(selectedSchool);
          setAddNewTeacher(false);
          setEditingTeacher(null);
        }}
      />
    );
  }
  return (
    <div className="schoolContainer">
      <div className="typoContainer">
        <img alt="" src={TeachersIcon} />
        <Typography fontSize="20px" fontWeight={400} fontFamily={"Proxima Nova"}>
          Teachers
        </Typography>
      </div>
      <div className="schoolBtnContainer">
        <div className="imgBtnContainer">
          {/* School Filter for Super Admin */}
          {userRole === 'SUPER_ADMIN' && schools.length > 0 && (
            <FormControl size="small" style={{ minWidth: 200, marginRight: 10 }}>
              <InputLabel id="school-filter-label">Filter by School</InputLabel>
              <Select
                labelId="school-filter-label"
                value={selectedSchool}
                label="Filter by School"
                onChange={handleSchoolFilterChange}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected || selected === '') return <span style={{ color: '#333' }}>All Schools</span>;
                  const school = schools.find(s => s.code === selected || s.schoolCode === selected);
                  return school ? `${school.name} (${school.code || school.schoolCode})` : selected;
                }}
              >
                <MenuItem value="">All Schools</MenuItem>
                {schools.map((school) => (
                  <MenuItem key={school.code || school.schoolCode} value={school.code || school.schoolCode}>
                    {school.name} ({school.code || school.schoolCode})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <AuthSearchField id="signUpEmail" type="text" placeholder="Search by Teacher Code or Name"
            onChange={handleSearchText} 
            inputProps={{ style: { color: '#333', fontWeight: 500 } }}
          />
          <Button variant="outlined" className="authSearchbtn" onClick={handleSearch}>Search</Button>
        </div>
        <MobileView>
          <div className='schoolRadioButtonCaontainer' style={{ display: 'flex', flexDirection: 'column', flex: '1', gap: '1vw', paddingTop: 10 }}>
            <Typography fontSize="20px" fontWeight={400} fontFamily={"Proxima Nova"} marginTop='3px'>
              Search By
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <FormControl >
                <RadioGroup
                  aria-labelledby="filter-radio-group"
                  defaultValue="teachercode"
                  name="radio-buttons-group"
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                >
                  <FormControlLabel value="teachercode" control={<Radio />} label="Teacher Code" />
                  <FormControlLabel value="teachername" control={<Radio />} label="Teacher Name" />
                </RadioGroup>
              </FormControl>
            </div>
          </div>
        </MobileView>
        <div className="btnCombo">
          <Button variant="outline" className="blueBtnBg" startIcon={<AddIcon />} onClick={handleAddNewTeacher}>
            Add New Teacher
          </Button>
          <Button variant="outline" className="blueBtnBg" startIcon={<ImportExcelIcon />} onClick={() => setBulkUploadOpen(true)}>
            Bulk Upload
          </Button>
        </div>
      </div>
      <BrowserView>
        <div className='schoolRadioButtonCaontainer' style={{ display: 'flex', flexDirection: 'row', flex: '1', gap: '1vw' }}>
          <Typography fontSize="20px" fontWeight={400} fontFamily={"Proxima Nova"} marginTop='3px'>
            Search By
          </Typography>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            <FormControl >
              <RadioGroup
                aria-labelledby="filter-radio-group"
                defaultValue="teachercode"
                name="radio-buttons-group"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
              >
                <FormControlLabel value="teachercode" control={<Radio />} label="Teacher Code" />
                <FormControlLabel value="teachername" control={<Radio />} label="Teacher Name" />
              </RadioGroup>
            </FormControl>
          </div>
        </div>
      </BrowserView>
      <DataGrid
        className="teachersRecord"
        getRowId={(row) => row.userId}
        columns={isMobile ? teacherMobileViewColumns : getTeacherColumns(handleEditTeacher)}
        rowHeight={isMobile ? 170 : 40}
        rows={usersList.map((item) => {return {...item, "handleFetchUserData": handleFetchData}})}
        headerHeight={isMobile ? 70 : 56}
        headerWidth={50}
        scrollbarSize={isMobile ? 1 : 5}
        style={{ backgroundColor: 'white', overflow: 'auto', position: 'relative', minHeight: '80vh' }}
        sx={{
          '& .MuiDataGrid-columnHeadersInner': {
            background: "#B3DAFF",
            fontFamily: "Proxima Nova",
            fontSize: 15,
            fontWeight: 600,
          },
          '.MuiDataGrid-columnSeparator': {
            display: 'none',
          },
        }}
        getRowClassName={() => 'textFontProxima'}
      // rowsPerPageOptions={[20]}
      />
      
      {/* Bulk Upload Dialog */}
      <Dialog open={bulkUploadOpen} onClose={() => setBulkUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload Teachers</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Required columns (marked with *):</strong> name, email, mobile_number{userRole === 'SUPER_ADMIN' && ', school_code'}<br/>
            <strong>Optional columns:</strong> address, city, state<br/><br/>
            Auto-generated passwords will be sent to each teacher&apos;s email.
          </Alert>
          <Button variant="outlined" onClick={handleDownloadTemplate} sx={{ mb: 2 }}>
            Download Template
          </Button>
          <br/>
          <Button variant="outlined" component="label" fullWidth sx={{ py: 2 }}>
            {bulkFile ? bulkFile.name : 'Choose CSV/Excel File'}
            <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={(e) => setBulkFile(e.target.files[0])} />
          </Button>
          {bulkResults && (
            <Alert severity={bulkResults.error_count > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
              <strong>Results:</strong><br/>
              ✅ Created: {bulkResults.success_count || 0}<br/>
              ❌ Failed: {bulkResults.error_count || 0}
              {bulkResults.errors && bulkResults.errors.length > 0 && (
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {bulkResults.errors.slice(0, 5).map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setBulkUploadOpen(false); setBulkFile(null); setBulkResults(null); }}>Cancel</Button>
          <Button 
            onClick={handleBulkUpload} 
            variant="contained" 
            disabled={bulkUploading || !bulkFile}
            sx={{ color: bulkUploading ? 'inherit' : 'black' }}
          >
            {bulkUploading ? <CircularProgress size={20} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({...snackbar, open: false})}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}
