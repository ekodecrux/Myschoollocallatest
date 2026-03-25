import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, IconButton, Grid, Card, CardContent,
  CardActions, Dialog, DialogTitle, DialogContent, DialogActions, Switch,
  FormControlLabel, Chip, Divider, Select, MenuItem, FormControl, InputLabel,
  Snackbar, Alert, Tabs, Tab, Tooltip
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Today, CalendarMonth, School, Subject,
  Assignment, Dashboard, PlayArrow, Close
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import DigitalBoard from '../digitalBoard/DigitalBoard';
import './LessonPlans.css';

const subjectList = ['Mathematics', 'English', 'Science', 'Social Studies', 'Hindi', 'Art', 'Computer', 'Physical Education', 'Music', 'Other'];
const classList = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12'];

const getDateStr = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const LessonPlans = () => {
  const navigate = useNavigate();
  const [plansList, setPlansList] = useState([]);
  const [filterDate, setFilterDate] = useState(getDateStr(new Date()));
  const [activeTab, setActiveTab] = useState(0);
  const [busy, setBusy] = useState(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [viewPlan, setViewPlan] = useState(null);
  const [boardMode, setBoardMode] = useState(false);
  const [boardPlan, setBoardPlan] = useState(null);
  
  const [form, setForm] = useState({
    title: '',
    subject: '',
    class_name: '',
    date: getDateStr(new Date()),
    objectives: '',
    content: '',
    activities: '',
    homework: '',
    notes: '',
    use_digital_board: true
  });
  
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  useEffect(() => {
    loadPlans();
  }, [filterDate, activeTab]);

  const loadPlans = async () => {
    setBusy(true);
    try {
      const tkn = localStorage.getItem('token');
      if (!tkn) return;
      
      const endpoint = activeTab === 0 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/rest/lesson-plans/today`
        : `${process.env.REACT_APP_BACKEND_URL}/api/rest/lesson-plans?date=${filterDate}`;
      
      const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${tkn}` } });
      
      if (res.ok) {
        const d = await res.json();
        setPlansList(d.lesson_plans || []);
      }
    } catch (e) {
      setToast({ show: true, msg: 'Failed to load plans', type: 'error' });
    }
    setBusy(false);
  };

  const createPlan = async () => {
    try {
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/lesson-plans`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${tkn}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setToast({ show: true, msg: 'Plan created', type: 'success' });
        setShowCreateModal(false);
        clearForm();
        loadPlans();
      }
    } catch (e) {
      setToast({ show: true, msg: 'Create failed', type: 'error' });
    }
  };

  const updatePlan = async () => {
    if (!editPlan) return;
    
    try {
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/lesson-plans/${editPlan.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${tkn}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        setToast({ show: true, msg: 'Plan updated', type: 'success' });
        setEditPlan(null);
        clearForm();
        loadPlans();
      }
    } catch (e) {
      setToast({ show: true, msg: 'Update failed', type: 'error' });
    }
  };

  const removePlan = async (id) => {
    if (!window.confirm('Delete this lesson plan?')) return;
    
    try {
      const tkn = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/lesson-plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      
      setToast({ show: true, msg: 'Deleted', type: 'info' });
      loadPlans();
    } catch (e) {
      setToast({ show: true, msg: 'Delete failed', type: 'error' });
    }
  };

  const toggleBoardPreview = async (plan) => {
    try {
      const tkn = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/lesson-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${tkn}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ use_digital_board: !plan.use_digital_board })
      });
      
      loadPlans();
      setToast({ 
        show: true, 
        msg: `Board preview ${!plan.use_digital_board ? 'ON' : 'OFF'}`, 
        type: 'success' 
      });
    } catch (e) {
      // silent
    }
  };

  const previewPlan = (plan) => {
    if (plan.use_digital_board) {
      setBoardPlan(plan);
      setBoardMode(true);
    } else {
      setViewPlan(plan);
    }
  };

  const openInBoard = (plan) => {
    const qs = new URLSearchParams({
      lessonId: plan.id,
      title: plan.title,
      content: encodeURIComponent(`${plan.title}\n\nObjectives:\n${plan.objectives || '-'}\n\nContent:\n${plan.content || '-'}\n\nActivities:\n${plan.activities || '-'}`)
    });
    navigate(`/auth/digital-board?${qs.toString()}`);
  };

  const clearForm = () => {
    setForm({
      title: '',
      subject: '',
      class_name: '',
      date: getDateStr(new Date()),
      objectives: '',
      content: '',
      activities: '',
      homework: '',
      notes: '',
      use_digital_board: true
    });
  };

  const startEdit = (plan) => {
    setForm({
      title: plan.title || '',
      subject: plan.subject || '',
      class_name: plan.class_name || '',
      date: plan.date || getDateStr(new Date()),
      objectives: plan.objectives || '',
      content: plan.content || '',
      activities: plan.activities || '',
      homework: plan.homework || '',
      notes: plan.notes || '',
      use_digital_board: plan.use_digital_board !== false
    });
    setEditPlan(plan);
  };

  if (boardMode && boardPlan) {
    return (
      <DigitalBoard 
        lessonData={boardPlan}
        isPreview={true}
        onClose={() => {
          setBoardMode(false);
          setBoardPlan(null);
        }}
      />
    );
  }

  return (
    <Box className="lesson-plans-container" data-testid="lesson-plans">
      <Paper className="lesson-plans-header" elevation={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Assignment sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight="bold">Lesson Plans</Typography>
          
          <Box sx={{ flex: 1 }} />
          
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ minHeight: 40 }}>
            <Tab icon={<Today />} label="Today" sx={{ minHeight: 40 }} />
            <Tab icon={<CalendarMonth />} label="By Date" sx={{ minHeight: 40 }} />
          </Tabs>
          
          {activeTab === 1 && (
            <TextField
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              size="small"
              sx={{ width: 160 }}
              InputLabelProps={{ shrink: true }}
            />
          )}
          
          <Button variant="contained" startIcon={<Add />} onClick={() => setShowCreateModal(true)}>
            New Plan
          </Button>
        </Box>
      </Paper>

      <Box className="lesson-plans-grid">
        {busy ? (
          <Typography color="textSecondary" sx={{ p: 4, textAlign: 'center' }}>Loading...</Typography>
        ) : plansList.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="textSecondary">No plans for this date.</Typography>
            <Button variant="outlined" startIcon={<Add />} onClick={() => setShowCreateModal(true)} sx={{ mt: 2 }}>
              Create Plan
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={2}>
            {plansList.map((p) => (
              <Grid item xs={12} sm={6} md={4} key={p.id}>
                <Card className="lesson-card">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" noWrap sx={{ flex: 1 }}>{p.title}</Typography>
                      <Tooltip title={p.use_digital_board ? 'Board Preview' : 'Normal'}>
                        <Chip 
                          icon={<Dashboard />} 
                          label={p.use_digital_board ? 'Board' : 'Normal'}
                          size="small"
                          color={p.use_digital_board ? 'primary' : 'default'}
                          onClick={() => toggleBoardPreview(p)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip icon={<School />} label={p.class_name} size="small" variant="outlined" />
                      <Chip icon={<Subject />} label={p.subject} size="small" variant="outlined" />
                    </Box>
                    
                    {p.objectives && (
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }} noWrap>
                        <strong>Objectives:</strong> {p.objectives}
                      </Typography>
                    )}
                    
                    {p.content && (
                      <Typography variant="body2" color="textSecondary" noWrap>
                        <strong>Content:</strong> {p.content}
                      </Typography>
                    )}
                  </CardContent>
                  
                  <Divider />
                  
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => previewPlan(p)} color="primary"><Visibility /></IconButton>
                      </Tooltip>
                      <Tooltip title="Open in Board">
                        <IconButton size="small" onClick={() => openInBoard(p)} color="secondary"><PlayArrow /></IconButton>
                      </Tooltip>
                    </Box>
                    <Box>
                      <Tooltip title="Edit"><IconButton size="small" onClick={() => startEdit(p)}><Edit /></IconButton></Tooltip>
                      <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => removePlan(p.id)}><Delete /></IconButton></Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={showCreateModal || !!editPlan} onClose={() => { setShowCreateModal(false); setEditPlan(null); clearForm(); }} maxWidth="md" fullWidth>
        <DialogTitle>{editPlan ? 'Edit Plan' : 'New Lesson Plan'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Subject</InputLabel>
                <Select value={form.subject} label="Subject" onChange={(e) => setForm({ ...form, subject: e.target.value })}>
                  {subjectList.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select value={form.class_name} label="Class" onChange={(e) => setForm({ ...form, class_name: e.target.value })}>
                  {classList.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth type="date" label="Date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Learning Objectives" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Content / Topics" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Activities" value={form.activities} onChange={(e) => setForm({ ...form, activities: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} label="Homework" value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={<Switch checked={form.use_digital_board} onChange={(e) => setForm({ ...form, use_digital_board: e.target.checked })} />}
                label="Open in Digital Board for preview"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowCreateModal(false); setEditPlan(null); clearForm(); }}>Cancel</Button>
          <Button variant="contained" onClick={editPlan ? updatePlan : createPlan}>{editPlan ? 'Update' : 'Create'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!viewPlan} onClose={() => setViewPlan(null)} maxWidth="md" fullWidth>
        {viewPlan && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{viewPlan.title}</span>
                <IconButton onClick={() => setViewPlan(null)}><Close /></IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Class</Typography>
                  <Typography>{viewPlan.class_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">Subject</Typography>
                  <Typography>{viewPlan.subject}</Typography>
                </Grid>
                <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Objectives</Typography>
                  <Typography>{viewPlan.objectives || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Content</Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{viewPlan.content || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Activities</Typography>
                  <Typography>{viewPlan.activities || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Homework</Typography>
                  <Typography>{viewPlan.homework || '-'}</Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => openInBoard(viewPlan)} startIcon={<Dashboard />}>Open in Board</Button>
              <Button onClick={() => setViewPlan(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={toast.show} autoHideDuration={3000} onClose={() => setToast({ ...toast, show: false })}>
        <Alert severity={toast.type}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LessonPlans;
