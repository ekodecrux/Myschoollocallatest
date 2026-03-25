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
  
  // Bulk Upload State
  const [bulkUploadOpen, setBulkUploadOpen] = React.useState(false);
  const [bulkFile, setBulkFile] = React.useState(null);
  const [bulkUploading, setBulkUploading] = React.useState(false);
  const [bulkResults, setBulkResults] = React.useState(null);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' });
  
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
  
  // Download Template - Issue 2: Changed admin_email to school_email, postal_code is now mandatory
  const handleDownloadTemplate = () => {
    const headers = ['school_code', 'school_name*', 'school_email*', 'principal_name*', 'mobile_number*', 'postal_code*', 'address', 'city', 'state'];
    const sample = ['SCH001', 'ABC Public School', 'school@abc.com', 'Dr. Smith', '9876543210', '400001', '123 Main St', 'Mumbai', 'Maharashtra'];
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
    const formData = new FormData();
    formData.append('file', bulkFile);
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/bulk-upload/schools`,
        formData,
        { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'multipart/form-data' } }
      );
      setBulkResults(response.data);
      setSnackbar({ open: true, message: `Created ${response.data.created || response.data.success_count || 0} schools successfully!`, severity: 'success' });
      // Close dialog and reset after successful upload
      setBulkUploadOpen(false);
      setBulkFile(null);
      setBulkResults(null);
      handleFetchData();
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.detail || 'Upload failed', severity: 'error' });
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
      <Dialog open={bulkUploadOpen} onClose={() => setBulkUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulk Upload Schools</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            <strong>Required columns (marked with *):</strong> school_name, school_email, principal_name, mobile_number, postal_code<br/>
            <strong>Optional columns:</strong> school_code, address, city, state<br/><br/>
            Auto-generated passwords will be sent to each school&apos;s email.
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
            <Alert severity={bulkResults.failed > 0 || bulkResults.error_count > 0 ? 'warning' : 'success'} sx={{ mt: 2 }}>
              <strong>Results:</strong><br/>
              ✅ Created: {bulkResults.created || bulkResults.success_count || 0}<br/>
              ❌ Failed: {bulkResults.failed || bulkResults.error_count || 0}
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
