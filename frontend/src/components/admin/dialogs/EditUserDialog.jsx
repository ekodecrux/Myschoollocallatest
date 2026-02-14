import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid
} from '@mui/material';

const EditUserDialog = ({
  open,
  onClose,
  editingUser,
  editFormData,
  onFormChange,
  onSave
}) => {
  if (!editingUser) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit User: {editingUser.name}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              value={editFormData.name || ''}
              onChange={(e) => onFormChange('name', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              value={editFormData.email || ''}
              onChange={(e) => onFormChange('email', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Mobile Number"
              value={editFormData.mobileNumber || ''}
              onChange={(e) => onFormChange('mobileNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
            />
          </Grid>
          {editingUser.role === 'STUDENT' && (
            <>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Class"
                  value={editFormData.className || ''}
                  onChange={(e) => onFormChange('className', e.target.value)}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Section"
                  value={editFormData.sectionName || ''}
                  onChange={(e) => onFormChange('sectionName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Roll Number"
                  value={editFormData.rollNumber || ''}
                  onChange={(e) => onFormChange('rollNumber', e.target.value)}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Credits"
              type="number"
              value={editFormData.credits || 0}
              onChange={(e) => onFormChange('credits', parseInt(e.target.value) || 0)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSave} 
          variant="contained"
          sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
        >
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserDialog;
