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
  Chip,
  TextField,
  Alert
} from '@mui/material';

const UserManagementTab = ({ 
  usersWithoutSchool,
  bulkSchoolCodeUpdates,
  onBulkSchoolCodeUpdate,
  onSchoolCodeChange
}) => {
  return (
    <Box>
      <Alert severity="warning" sx={{ mb: 2 }}>
        These users registered without a school code. Assign them to a school using the input fields below.
      </Alert>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Role</strong></TableCell>
              <TableCell><strong>Assign School Code</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {usersWithoutSchool.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip label={user.role || user.userRole} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    placeholder="Enter school code"
                    value={bulkSchoolCodeUpdates[user.id] || ''}
                    onChange={(e) => onSchoolCodeChange(user.id, e.target.value)}
                    sx={{ width: 150 }}
                  />
                </TableCell>
              </TableRow>
            ))}
            {usersWithoutSchool.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">All users have school codes assigned</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {usersWithoutSchool.length > 0 && (
        <Button
          variant="contained"
          onClick={onBulkSchoolCodeUpdate}
          disabled={Object.keys(bulkSchoolCodeUpdates).length === 0}
          sx={{ mt: 2, bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
        >
          Update School Codes
        </Button>
      )}
    </Box>
  );
};

export default UserManagementTab;
