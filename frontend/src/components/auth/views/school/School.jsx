import * as React from "react";
import home from "../../../../assests/homeScreen/home.png";
import { ReactComponent as AddIcon } from "../../../../assests/AddIcon.svg";
import { ReactComponent as ImportExcelIcon } from "../../../../assests/ImportExcelIcon.svg";
import "./School.css";
import { Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, Snackbar } from "@mui/material";
import AuthSearchField from "../../../../customTheme/authSearchField/AuthSearchField";
import { DataGrid } from "@mui/x-data-grid";
import { columns, data, mobileViewColumns, mobileviewcolumns, getColumnsWithEdit } from './constants'
import { useNavigate } from "react-router-dom";
import { ListUsers, updateUsers } from "../../../../redux/fetchUsersSlice";
import { RefreshToken } from "../../../../redux/authSlice"
import { useDispatch, useSelector } from "react-redux";
import AddNewSchool from "./addNewSchool/AddNewSchool";
import { BrowserView, isMobile, MobileView } from "react-device-detect";
import axios from "axios";

export default function SchoolRegister() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = React.useState();
  const [addNewSchool, setAddNewSchool] = React.useState(false);
  const [editSchoolData, setEditSchoolData] = React.useState(null);
  const { hasMore, usersList, loading } = useSelector((state) => state.usersList)
  const { accessToken, refreshToken, tokenExpiry } = useSelector((state) => state.login)
  
  const [bulkUploadOpen, setBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState(null);
  const [bulkUploading, setBulkUploading] = React.useState(false);
  const [bulkResults, setBulkResults] = React.useState(null);
  const [bulkError, setBulkError] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  
  const hasUploadResults = bulkResults !== null || bulkError !== null;
  
  const handleAddNewSchool = () => {
    setEditSchoolData(null);
    setAddNewSchool(true);
  }
  
  const handleEditSchool = (rowData) => {
    setEditSchoolData(rowData);
    setAddNewSchool(true);
  }
  
  const handleSearchText = (e) => {
    setSearchText(e.target.value);
  }
  
  // Download Template - postal_code is now optional, school_name and principal_name must be text only
  const handleDownloadTemplate = () => {
    const headers = ['school_code*', 'school_name*', 'school_email*', 'principal_name*', 'mobile_number*', 'postal_code', 'address', 'city', 'state'];
    const sample = ['SCH001', 'ABC Public School', 'school@abc.com', 'Dr Smith', '9876543210', '400001', '123 Main St', 'Mumbai', 'Maharashtra'];
    const csvContent = headers.join(',') + '\n' + sample.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schools_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  // Handle Bulk Upload
  const handleFetchData = React.useCallback(() => {
    let header = {
      "Content-Type": "application/json",
      'Accept': 'application/json',
      "Authorization": `Bearer ${accessToken}`
    }
    let data = {
      role: "SCHOOL_ADMIN",
      limit: 100
    }
    let timestamp = Math.ceil(Date.now() / 1000)
    if (tokenExpiry < timestamp) {
      dispatch(RefreshToken({
        headers: header,
        body: {
          "refreshToken": refreshToken
        }
      }))
    }
    dispatch(ListUsers({
      url: "/rest/users/listUsersByRole",
      headers: header,
      method: "GET",
      body: data
    }))
  }, [accessToken, tokenExpiry, refreshToken, dispatch]);
  
  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    setBulkError(null);
    setBulkResults(null);
    const formData = new FormData();
    formData.append('file', bulkFile);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/bulk-upload/schools`,
        formData,
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' } }
      );
      
    
      const created = response.data.created || response.data.success_count || 0;
      const failed = response.data.failed || response.data.error_count || 0;
      const errors = response.data.errors || [];
      
      setBulkResults(response.data);
      
      if (failed > 0 || errors.length > 0) {
        // Has errors - keep dialog open, show results inline (Alert already handles this via bulkResults)
        setSnackbar({ open: true, message: `Created ${created}, Failed ${failed}. See details in dialog.`, severity: 'warning' });
      } else if (created > 0) {
        // All successful - close dialog
        setSnackbar({ open: true, message: `Created ${created} schools successfully!`, severity: 'success' });
        setBulkUploadOpen(false);
        setBulkFile(null);
        setBulkResults(null);
        handleFetchData();
      } else {
        // No schools created - show warning inline
        setBulkResults({ created: 0, failed: 0, errors: ['No schools were created. Please check the file format and ensure all required fields are filled.'] });
        setSnackbar({ open: true, message: `No schools created. Please check the file.`, severity: 'warning' });
      }
    } catch (error) {
      // API error (400, 500, etc) - show error inline in dialog
      const errorMessage = error.response?.data?.detail || 'Upload failed. Please check the file format and required fields.';
      setBulkError(errorMessage);
      setSnackbar({ open: true, message: 'Upload failed. See error details in dialog.', severity: 'error' });
      // Dialog stays open because we only close it on full success
    }
    setBulkUploading(false);
  };
  
  const handleSearch = async () => {
    // If no search text, fetch all schools
    if (!searchText || searchText.trim().length < 1) {
      handleFetchData();
      return;
    }
    
    // Use the search endpoint for comprehensive search across multiple fields
    try {
      const searchUrl = `${process.env.REACT_APP_BACKEND_URL}/api/rest/users/search?query=${encodeURIComponent(searchText)}&role=SCHOOL_ADMIN&limit=100`;
      const response = await axios.get(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Transform results to match expected format for the DataGrid
      const users = (response.data?.users || []).map(user => ({
        ...user,
        id: user.id || user.userId,
        userId: user.id || user.userId,
        schoolCode: user.schoolCode || user.school_code,
        teachersEnrolled: user.teachersEnrolled || 0,
        studentsEnrolled: user.studentsEnrolled || 0
      }));
      
      // Use the updateUsers action to update the redux store
      dispatch(updateUsers(users));
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to regular fetch with school code filter
      let header = {
        "Content-Type": "application/json",
        'Accept': 'application/json',
        "Authorization": `Bearer ${accessToken}`
      };
      dispatch(ListUsers({
        url: `/rest/users/listUsersByRole?search=${encodeURIComponent(searchText)}`,
        headers: header,
        method: "GET",
        body: { role: "SCHOOL_ADMIN", limit: 100 }
      }));
    }
  }
  React.useEffect(() => handleFetchData(), [handleFetchData])
  if (addNewSchool) {
    return (
      <AddNewSchool
        handleCancel={() => {
          setAddNewSchool(false);
          setEditSchoolData(null);
          handleFetchData(); // Refresh list when returning
        }}
        editData={editSchoolData}
        onSchoolAdded={() => {
          handleFetchData(); // Refresh list after adding
        }}
      />
    )
  }
  return (
    <div className="schoolContainer">
      <div className="typoContainer">
        <img alt="" src={home} />
        <Typography fontSize="20px" fontWeight={400} fontFamily={"Proxima Nova"}>
          Schools
        </Typography>
      </div>
      <div className="schoolBtnContainer">
        <div className="imgBtnContainer">
          <AuthSearchField id="signUpEmail" type="text" placeholder="Search by School ID, School Name, School City here"
            onChange={handleSearchText} />
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
                  defaultValue="schoolcode"
                  name="radio-buttons-group"
                  style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                >
                  <FormControlLabel value="schoolcode" control={<Radio />} label="School Code" />
                  <FormControlLabel value="schoolname" control={<Radio />} label="School Name" />
                </RadioGroup>
              </FormControl>
            </div>
          </div>
        </MobileView>
        <div className="btnCombo">
          <Button variant="outline" className="blueBtnBg" startIcon={<AddIcon />} onClick={handleAddNewSchool}>
            Add New School
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
                defaultValue="schoolcode"
                name="radio-buttons-group"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
              >
                <FormControlLabel value="schoolcode" control={<Radio />} label="School Code" />
                <FormControlLabel value="schoolname" control={<Radio />} label="School Name" />
              </RadioGroup>
            </FormControl>
          </div>
        </div>
      </BrowserView>
      <DataGrid
        getRowId={(row) => row.userId}
        columns={isMobile ? mobileViewColumns : getColumnsWithEdit(handleEditSchool)}
        rows={usersList.map((item) => {return {...item, "handleFetchUserData": handleFetchData}})}
        rowHeight={isMobile ? 120 : 40}
        density='comfortable'
        headerHeight={isMobile ? 70 : 56}
        style={{ backgroundColor: 'white', minHeight: '80vh' }}
        scrollbarSize={isMobile ? 1 : 5}
        sx={{
          '& .MuiDataGrid-columnHeadersInner': {
            background: "#B3DAFF",
            fontFamily: "Proxima Nova",
            fontSize: 15,
            fontWeight: 600
          },
          '.MuiDataGrid-columnSeparator': {
            display: 'none',
          },
        }}
        handleFetchUserData={handleFetchData}
        getRowClassName={() => 'textFontProxima'}
      // rowsPerPageOptions={[20]}
      />
      
      {/* Bulk Upload Dialog */}
      <Dialog 
        open={bulkUploadOpen} 
        onClose={(event, reason) => {
          // Prevent closing on backdrop click or escape key when uploading or has results/errors
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            if (bulkUploading || hasUploadResults) return;
          }
          // Only close via explicit button click
          setBulkUploadOpen(false);
          setBulkFile(null);
          setBulkResults(null);
          setBulkError(null);
        }}
        disableEscapeKeyDown={bulkUploading || hasUploadResults}
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Bulk Upload Schools</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Required columns (marked with *):</strong> school_code, school_name, school_email, principal_name, mobile_number<br/>
            <strong>Optional columns:</strong> postal_code, address, city, state<br/><br/>
            <strong>Note:</strong> School name and principal name should only contain letters and spaces.<br/>
            Auto-generated passwords will be sent to each school&apos;s email.
          </Alert>
          <Button variant="outlined" onClick={handleDownloadTemplate} sx={{ mb: 2 }}>
            Download Template
          </Button>
          <br/>
          <Button variant="outlined" component="label" fullWidth sx={{ py: 2 }}>
            {bulkFile ? bulkFile.name : 'Choose CSV/Excel File'}
            <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={(e) => { setBulkFile(e.target.files[0]); setBulkError(null); setBulkResults(null); }} />
          </Button>
          {bulkError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              <strong>Error:</strong> {bulkError}
            </Alert>
          )}
          {bulkResults && (
            <Alert severity={bulkResults.failed > 0 || bulkResults.error_count > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
              <strong>Results:</strong><br/>
              ✅ Created: {bulkResults.created || bulkResults.success_count || 0}<br/>
              ❌ Failed: {bulkResults.failed || bulkResults.error_count || 0}
              {bulkResults.errors && bulkResults.errors.length > 0 && (
                <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
                  {bulkResults.errors.slice(0, 10).map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            data-testid="bulk-upload-cancel-btn"
            onClick={() => { 
              setBulkUploadOpen(false); 
              setBulkFile(null); 
              setBulkResults(null); 
              setBulkError(null); 
            }}
          >
            {hasUploadResults ? 'Close' : 'Cancel'}
          </Button>
          <Button 
            data-testid="bulk-upload-submit-btn"
            onClick={handleBulkUpload} 
            variant="contained" 
            disabled={bulkUploading || !bulkFile}
            sx={{ backgroundColor: '#1976d2', color: 'white', '&:hover': { backgroundColor: '#1565c0' } }}
          >
            {bulkUploading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={snackbar.severity === 'error' ? 10000 : 5000} 
        onClose={() => setSnackbar({...snackbar, open: false})}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%', fontSize: '1rem' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
