import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormHelperText
} from '@mui/material';
import { validateField, FIELD_RULES } from '../../../utils/fieldValidation';

const SchoolFormDialog = ({
  open,
  onClose,
  schoolForm,
  schoolFormErrors,
  onFormChange,
  onSubmit
}) => {
  const handleFieldChange = (field, value) => {
    onFormChange(field, value);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New School</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="School Name *"
              value={schoolForm.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              error={!!schoolFormErrors.name}
              helperText={schoolFormErrors.name}
              inputProps={{ maxLength: 40 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Admin Name *"
              value={schoolForm.adminName}
              onChange={(e) => handleFieldChange('adminName', e.target.value)}
              error={!!schoolFormErrors.adminName}
              helperText={schoolFormErrors.adminName}
              inputProps={{ maxLength: 40 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Admin Email *"
              type="email"
              value={schoolForm.adminEmail}
              onChange={(e) => handleFieldChange('adminEmail', e.target.value)}
              error={!!schoolFormErrors.adminEmail}
              helperText={schoolFormErrors.adminEmail}
              inputProps={{ maxLength: 30 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Admin Phone *"
              value={schoolForm.adminPhone}
              onChange={(e) => handleFieldChange('adminPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              error={!!schoolFormErrors.adminPhone}
              helperText={schoolFormErrors.adminPhone || 'Must be exactly 10 digits'}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="City"
              value={schoolForm.city}
              onChange={(e) => handleFieldChange('city', e.target.value)}
              error={!!schoolFormErrors.city}
              helperText={schoolFormErrors.city}
              inputProps={{ maxLength: 35 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="State"
              value={schoolForm.state}
              onChange={(e) => handleFieldChange('state', e.target.value)}
              error={!!schoolFormErrors.state}
              helperText={schoolFormErrors.state}
              inputProps={{ maxLength: 35 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Postal Code"
              value={schoolForm.postalCode}
              onChange={(e) => handleFieldChange('postalCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputProps={{ maxLength: 6 }}
            />
          </Grid>
        </Grid>
        <FormHelperText sx={{ mt: 2 }}>
          * Required fields. Admin will receive login credentials via email.
        </FormHelperText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={onSubmit}
          variant="contained"
          disabled={!schoolForm.name || !schoolForm.adminEmail || !schoolForm.adminName || !schoolForm.adminPhone || Object.values(schoolFormErrors).some(e => e)}
          sx={{ bgcolor: '#ec4899', '&:hover': { bgcolor: '#db2777' } }}
        >
          Create School
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolFormDialog;
