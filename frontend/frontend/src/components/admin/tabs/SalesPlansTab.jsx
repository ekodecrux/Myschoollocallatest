import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SalesPlansTab = ({ accessToken }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    credits: '',
    duration: '30',
    status: 'DRAFT',
    features: ''
  });

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/sales-plans`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name || '',
        description: plan.description || '',
        price: plan.price || '',
        credits: plan.credits || '',
        duration: plan.duration || '30',
        status: plan.status || 'DRAFT',
        features: Array.isArray(plan.features) ? plan.features.join(', ') : ''
      });
    } else {
      setEditingPlan(null);
      setFormData({ name: '', description: '', price: '', credits: '', duration: '30', status: 'DRAFT', features: '' });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        credits: parseInt(formData.credits),
        duration: parseInt(formData.duration),
        features: formData.features.split(',').map(f => f.trim()).filter(f => f)
      };

      if (editingPlan) {
        await axios.put(`${BACKEND_URL}/api/admin/sales-plans/${editingPlan.id}`, data, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/admin/sales-plans`, data, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      setDialogOpen(false);
      fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
    }
  };

  const handleStatusToggle = async (plan) => {
    try {
      const newStatus = plan.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await axios.patch(`${BACKEND_URL}/api/admin/sales-plans/${plan.id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      fetchPlans();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/admin/sales-plans/${planId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
    }
  };

  const getStatusColor = (status) => {
    const colors = { ACTIVE: 'success', INACTIVE: 'default', DRAFT: 'warning', RETIRED: 'error' };
    return colors[status] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Sales Plans</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add New Plan
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Plan Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center"><CircularProgress size={24} /></TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No sales plans found</TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>{plan.planCode}</TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>₹{plan.price}</TableCell>
                  <TableCell>{plan.credits}</TableCell>
                  <TableCell>{plan.duration} days</TableCell>
                  <TableCell>
                    <Chip label={plan.status} size="small" color={getStatusColor(plan.status)} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => handleOpenDialog(plan)}><EditIcon /></IconButton>
                    <IconButton size="small" onClick={() => handleStatusToggle(plan)}>
                      <Switch checked={plan.status === 'ACTIVE'} size="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(plan.id)}><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Plan Name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Price (₹)" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Credits" value={formData.credits} onChange={(e) => setFormData({...formData, credits: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Duration (days)" value={formData.duration} onChange={(e) => setFormData({...formData, duration: e.target.value})} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.status} label="Status" onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <MenuItem value="DRAFT">Draft</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Features (comma separated)" value={formData.features} onChange={(e) => setFormData({...formData, features: e.target.value})} helperText="e.g., Unlimited downloads, Priority support" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesPlansTab;
