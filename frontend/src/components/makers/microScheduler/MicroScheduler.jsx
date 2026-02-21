import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  Tooltip,
  Snackbar,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CardActions,
  Tabs,
  Tab
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  DragIndicator as DragIcon,
  ContentCopy as CopyIcon,
  Today as DayIcon,
  ViewWeek as WeekIcon,
  CalendarMonth as MonthIcon,
  DateRange as YearIcon,
  FolderOpen as LoadIcon,
  Settings as SettingsIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import './MicroScheduler.css';
// Default subjects with colors
const DEFAULT_SUBJECTS = [
  { id: 1, name: 'English', color: '#e91e63', shortName: 'ENG' },
  { id: 2, name: 'Mathematics', color: '#2196f3', shortName: 'MATH' },
  { id: 3, name: 'Science', color: '#4caf50', shortName: 'SCI' },
  { id: 4, name: 'Social Studies', color: '#ff9800', shortName: 'SS' },
  { id: 5, name: 'Hindi', color: '#9c27b0', shortName: 'HIN' },
  { id: 6, name: 'Computer', color: '#00bcd4', shortName: 'COMP' },
  { id: 7, name: 'Art', color: '#f44336', shortName: 'ART' },
  { id: 8, name: 'Physical Education', color: '#795548', shortName: 'PE' },
];
// Default period configuration
const DEFAULT_PERIODS = [
  { id: 1, name: 'Period 1', startTime: '08:00', endTime: '08:45' },
  { id: 2, name: 'Period 2', startTime: '08:45', endTime: '09:30' },
  { id: 3, name: 'Period 3', startTime: '09:45', endTime: '10:30' },
  { id: 4, name: 'Period 4', startTime: '10:30', endTime: '11:15' },
  { id: 5, name: 'Period 5', startTime: '11:30', endTime: '12:15' },
  { id: 6, name: 'Period 6', startTime: '12:15', endTime: '13:00' },
  { id: 7, name: 'Period 7', startTime: '14:00', endTime: '14:45' },
  { id: 8, name: 'Period 8', startTime: '14:45', endTime: '15:30' },
];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLOR_PRESETS = [
  '#e91e63', '#f44336', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3',
  '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#795548', '#607d8b'
];
const MicroScheduler = () => {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    // Get the Monday of current week
    const today = new Date();
    const day = today.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust when day is Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() + diff);
    return monday.toISOString().split('T')[0]; // Store as YYYY-MM-DD
  });
  const [selectedDay, setSelectedDay] = useState(0);
  const [subjects, setSubjects] = useState(DEFAULT_SUBJECTS);
  const [periods, setPeriods] = useState(DEFAULT_PERIODS);
  const [viewMode, setViewMode] = useState('week'); // Changed default to 'week'
  const [leftTab, setLeftTab] = useState(0); // 0=Subjects, 1=Templates, 2=Settings
  // School info
  const [schoolName, setSchoolName] = useState('My School');
  const [className, setClassName] = useState('Class 5-A');
  // Store schedule per specific date: { "2025-12-27": { "0": subject, "1": subject } } // day -> period -> subject
  const [weeklySchedule, setWeeklySchedule] = useState({}); 
  const [draggedSubject, setDraggedSubject] = useState(null);
  const [subjectDialog, setSubjectDialog] = useState({ open: false, mode: 'add', subject: null });
  const [periodDialog, setPeriodDialog] = useState({ open: false, mode: 'add', period: null });
  const [newSubject, setNewSubject] = useState({ name: '', color: '#2196f3', shortName: '' });
  const [newPeriod, setNewPeriod] = useState({ name: '', startTime: '08:00', endTime: '08:45' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [saveDialog, setSaveDialog] = useState(false);
  const [scheduleName, setScheduleName] = useState('');
  const [confirmDeleteDialog, setConfirmDeleteDialog] = useState({ open: false, subjectId: null, subjectName: '' });
  const [savedSchedules, setSavedSchedules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('microSchedulerTemplates') || '[]');
    } catch {
      return [];
    }
  });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const scheduleRef = useRef(null);
  
  // Helper to get dates for current week
  const getCurrentWeekDates = () => {
    const dates = [];
    const startDate = new Date(currentWeekStart);
    for (let i = 0; i < 6; i++) { // Mon-Sat
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  };
  
  // Navigate to next/previous week
  const goToNextWeek = () => {
    const startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() + 7);
    setCurrentWeekStart(startDate.toISOString().split('T')[0]);
  };
  
  const goToPreviousWeek = () => {
    const startDate = new Date(currentWeekStart);
    startDate.setDate(startDate.getDate() - 7);
    setCurrentWeekStart(startDate.toISOString().split('T')[0]);
  };
  
  // Format week display
  const formatWeekDisplay = () => {
    const startDate = new Date(currentWeekStart);
    const endDate = new Date(currentWeekStart);
    endDate.setDate(startDate.getDate() + 5); // Saturday
    const options = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}, ${startDate.getFullYear()}`;
  };
  
  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  
  // Get the day of week (0=Mon, 1=Tue, ... 5=Sat, 6=Sun) for a given date
  const getDayOfWeekMondayBased = (year, month, day) => {
    const jsDay = new Date(year, month, day).getDay(); // 0=Sun, 1=Mon, ... 6=Sat
    return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon, 1=Tue, ... 5=Sat, 6=Sun
  };
  
  // Generate weeks for a month - each week is an array of 6 days (Mon-Sat)
  // Each element is either { day, isCurrentMonth } or null (for empty cells)
  // Now includes days from previous/next month to show complete weeks
  const getWeeksInMonth = (month, year) => {
    const daysInMonth = getDaysInMonth(month, year);
    const daysInPrevMonth = getDaysInMonth(month === 0 ? 11 : month - 1, month === 0 ? year - 1 : year);
    const weeks = [];
    let currentWeek = new Array(6).fill(null); // 6 days: Mon-Sat
    
    // Get the day of week for the 1st of the month
    const firstDayOfWeek = getDayOfWeekMondayBased(year, month, 1); // 0=Mon to 6=Sun
    
    // Fill in days from previous month if the month doesn't start on Monday
    if (firstDayOfWeek !== 0 && firstDayOfWeek !== 6) { // Not starting on Monday or Sunday
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      for (let i = firstDayOfWeek - 1; i >= 0; i--) {
        const prevDay = daysInPrevMonth - i;
        currentWeek[firstDayOfWeek - 1 - i] = { day: prevDay, isCurrentMonth: false, month: prevMonth, year: prevYear };
      }
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = getDayOfWeekMondayBased(year, month, day); // 0=Mon to 6=Sun
      
      // Skip Sundays (dayOfWeek === 6)
      if (dayOfWeek === 6) continue;
      
      // Place day in correct column (0-5 for Mon-Sat)
      currentWeek[dayOfWeek] = { day, isCurrentMonth: true, month, year };
      
      // If it's Saturday (dayOfWeek === 5), push the week and start new
      if (dayOfWeek === 5) {
        weeks.push(currentWeek);
        currentWeek = new Array(6).fill(null);
      }
    }
    
    // Fill in days from next month to complete the last week
    if (currentWeek.some(d => d !== null)) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      let nextDay = 1;
      for (let i = 0; i < 6; i++) {
        if (currentWeek[i] === null) {
          // Check if this slot should have a day from next month
          const lastDayOfMonth = getDayOfWeekMondayBased(year, month, daysInMonth);
          if (i > lastDayOfMonth || lastDayOfMonth === 6) {
            currentWeek[i] = { day: nextDay++, isCurrentMonth: false, month: nextMonth, year: nextYear };
          }
        }
      }
      weeks.push(currentWeek);
    }
    
    return weeks;
  };
  const handleDragStart = (subject) => setDraggedSubject(subject);
  const handleDragOver = (e) => e.preventDefault();
  
  // Handle dropping a subject onto a period in Week view
  const handleDropPeriod = (dayIndex, periodIndex) => {
    if (!draggedSubject) return;
    const weekDates = getCurrentWeekDates();
    const dateKey = weekDates[dayIndex]; // Get actual date for this day
    
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev };
      if (!newSchedule[dateKey]) {
        newSchedule[dateKey] = {};
      }
      newSchedule[dateKey][periodIndex] = draggedSubject;
      return newSchedule;
    });
    setDraggedSubject(null);
  };
  
  // Handle dropping a subject onto a calendar day in Month/Year view
  const handleDropCalendar = (monthIndex, day) => {
    if (!draggedSubject || !day) return;
    const dateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev };
      if (!newSchedule[dateKey]) {
        newSchedule[dateKey] = {};
      }
      // Add to period 0 (first period) for calendar drops
      newSchedule[dateKey][0] = draggedSubject;
      return newSchedule;
    });
    setDraggedSubject(null);
  };
  
  // Clear schedule for a specific date
  const handleClearCalendar = (monthIndex, day) => {
    if (!day) return;
    const dateKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev };
      delete newSchedule[dateKey];
      return newSchedule;
    });
  };
  
  // Get ALL subjects for a specific date (for Month/Year views)
  const getSubjectsForDate = (dateKey) => {
    const daySchedule = weeklySchedule[dateKey];
    if (!daySchedule) return [];
    // Return all subjects found for this date
    const periodKeys = Object.keys(daySchedule).sort();
    return periodKeys.map(key => daySchedule[key]).filter(Boolean);
  };
  
  // Get subject for a specific date (for Month/Year views) - returns first subject (for single display)
  const getSubjectForDate = (dateKey) => {
    const daySchedule = weeklySchedule[dateKey];
    if (!daySchedule) return null;
    // Return first subject found for this date
    const periodKeys = Object.keys(daySchedule).sort();
    return periodKeys.length > 0 ? daySchedule[periodKeys[0]] : null;
  };
  
  // Get subject for current week view
  const getWeekDayPeriodSubject = (dayIndex, periodIndex) => {
    const weekDates = getCurrentWeekDates();
    const dateKey = weekDates[dayIndex];
    return weeklySchedule[dateKey]?.[periodIndex] || null;
  };
  
  // Clear a specific period from current week
  const handleClearPeriod = (dayIndex, periodIndex) => {
    const weekDates = getCurrentWeekDates();
    const dateKey = weekDates[dayIndex];
    
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev };
      if (newSchedule[dateKey]) {
        delete newSchedule[dateKey][periodIndex];
        if (Object.keys(newSchedule[dateKey]).length === 0) {
          delete newSchedule[dateKey];
        }
      }
      return newSchedule;
    });
  };
  
  // Copy current week schedule to next week
  const handleCopyWeekToNext = () => {
    const currentDates = getCurrentWeekDates();
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    
    setWeeklySchedule(prev => {
      const newSchedule = { ...prev };
      currentDates.forEach((currentDate, i) => {
        if (prev[currentDate]) {
          const nextDate = new Date(nextWeekStart);
          nextDate.setDate(nextWeekStart.getDate() + i);
          const nextDateKey = nextDate.toISOString().split('T')[0];
          newSchedule[nextDateKey] = { ...prev[currentDate] };
        }
      });
      return newSchedule;
    });
    
    // Navigate to the next week to show the copied schedule
    setCurrentWeekStart(nextWeekStart.toISOString().split('T')[0]);
    
    setSnackbar({ open: true, message: 'Schedule copied to next week!', severity: 'success' });
  };
  
  // Subject management
  const handleSaveSubject = () => {
    if (!newSubject.name.trim()) {
      setSnackbar({ open: true, message: 'Subject name is required', severity: 'error' });
      return;
    }
    if (subjectDialog.mode === 'add') {
      const subject = {
        id: Date.now(),
        name: newSubject.name,
        color: newSubject.color,
        shortName: newSubject.shortName || newSubject.name.substring(0, 4).toUpperCase()
      };
      setSubjects([...subjects, subject]);
    } else {
      setSubjects(subjects.map(s => 
        s.id === subjectDialog.subject.id 
          ? { ...s, name: newSubject.name, color: newSubject.color, shortName: newSubject.shortName }
          : s
      ));
    }
    setSubjectDialog({ open: false, mode: 'add', subject: null });
    setNewSubject({ name: '', color: '#2196f3', shortName: '' });
    setSnackbar({ open: true, message: subjectDialog.mode === 'add' ? 'Subject added!' : 'Subject updated!', severity: 'success' });
  };
  
  // Show confirmation dialog before deleting subject
  const handleDeleteSubjectClick = (subjectId, subjectName) => {
    setConfirmDeleteDialog({ open: true, subjectId, subjectName });
  };
  
  // Confirm deletion of subject
  const confirmDeleteSubject = () => {
    if (confirmDeleteDialog.subjectId) {
      setSubjects(subjects.filter(s => s.id !== confirmDeleteDialog.subjectId));
      setSnackbar({ open: true, message: 'Subject deleted', severity: 'info' });
    }
    setConfirmDeleteDialog({ open: false, subjectId: null, subjectName: '' });
  };
  
  const handleDeleteSubject = (subjectId) => {
    setSubjects(subjects.filter(s => s.id !== subjectId));
    setSnackbar({ open: true, message: 'Subject deleted', severity: 'info' });
  };
  // Period management
  const handleSavePeriod = () => {
    if (!newPeriod.name.trim()) {
      setSnackbar({ open: true, message: 'Period name is required', severity: 'error' });
      return;
    }
    // Validate time
    if (newPeriod.startTime >= newPeriod.endTime) {
      setSnackbar({ open: true, message: 'End time must be after start time', severity: 'error' });
      return;
    }
    // Check for duplicate/overlapping periods (Issue 12)
    const existingPeriods = periodDialog.mode === 'add' 
      ? periods 
      : periods.filter(p => p.id !== periodDialog.period?.id);
    
    const hasOverlap = existingPeriods.some(p => {
      const newStart = newPeriod.startTime;
      const newEnd = newPeriod.endTime;
      const existStart = p.startTime;
      const existEnd = p.endTime;
      // Check if times overlap
      return (newStart < existEnd && newEnd > existStart);
    });
    
    if (hasOverlap) {
      setSnackbar({ open: true, message: 'This time slot overlaps with an existing period', severity: 'error' });
      return;
    }
    
    if (periodDialog.mode === 'add') {
      setPeriods([...periods, { id: Date.now(), ...newPeriod }]);
    } else {
      setPeriods(periods.map(p => 
        p.id === periodDialog.period.id ? { ...p, ...newPeriod } : p
      ));
    }
    setPeriodDialog({ open: false, mode: 'add', period: null });
    setNewPeriod({ name: '', startTime: '08:00', endTime: '08:45' });
    setSnackbar({ open: true, message: periodDialog.mode === 'add' ? 'Period added!' : 'Period updated!', severity: 'success' });
  };
  const handleDeletePeriod = (periodId) => {
    setPeriods(periods.filter(p => p.id !== periodId));
    setSnackbar({ open: true, message: 'Period deleted', severity: 'info' });
  };
  // Save schedule as template
  const handleSaveSchedule = () => {
    if (!scheduleName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a name', severity: 'error' });
      return;
    }
    const scheduleData = {
      id: editingTemplate?.id || Date.now(),
      name: scheduleName,
      schoolName,
      className,
      subjects,
      periods,
      weeklySchedule,
      savedAt: new Date().toISOString()
    };
    let newList;
    if (editingTemplate) {
      newList = savedSchedules.map(s => s.id === editingTemplate.id ? scheduleData : s);
    } else {
      newList = [...savedSchedules.filter(s => s.name !== scheduleName), scheduleData];
    }
    localStorage.setItem('microSchedulerTemplates', JSON.stringify(newList));
    setSavedSchedules(newList);
    setSaveDialog(false);
    setScheduleName('');
    setEditingTemplate(null);
    setSnackbar({ open: true, message: `Template "${scheduleName}" saved!`, severity: 'success' });
  };
  const handleLoadSchedule = (schedule) => {
    setSchoolName(schedule.schoolName || 'My School');
    setClassName(schedule.className || 'Class 5-A');
    setSubjects(schedule.subjects || DEFAULT_SUBJECTS);
    setPeriods(schedule.periods || DEFAULT_PERIODS);
    setWeeklySchedule(schedule.weeklySchedule || schedule.daySchedule || {});
    setSnackbar({ open: true, message: `Loaded "${schedule.name}"`, severity: 'success' });
  };
  const handleEditTemplate = (schedule) => {
    setEditingTemplate(schedule);
    setScheduleName(schedule.name);
    setSaveDialog(true);
  };
  const handleDeleteTemplate = (id) => {
    const newList = savedSchedules.filter(s => s.id !== id);
    localStorage.setItem('microSchedulerTemplates', JSON.stringify(newList));
    setSavedSchedules(newList);
    setSnackbar({ open: true, message: 'Template deleted', severity: 'info' });
  };
  const handleExport = async () => {
    if (!scheduleRef.current) return;
    try {
      // Hide buttons during export
      const buttonsToHide = scheduleRef.current.querySelectorAll('.hide-on-export');
      buttonsToHide.forEach(btn => btn.style.display = 'none');
      
      const canvas = await html2canvas(scheduleRef.current, { scale: 2, backgroundColor: '#ffffff' });
      
      // Restore buttons
      buttonsToHide.forEach(btn => btn.style.display = '');
      
      const link = document.createElement('a');
      link.download = `schedule-${viewMode}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      setSnackbar({ open: true, message: 'Exported!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };
  // Print only the schedule
  const handlePrint = async () => {
    if (!scheduleRef.current) return;
    try {
      // Hide buttons during print
      const buttonsToHide = scheduleRef.current.querySelectorAll('.hide-on-export');
      buttonsToHide.forEach(btn => btn.style.display = 'none');
      
      const canvas = await html2canvas(scheduleRef.current, { scale: 2, backgroundColor: '#ffffff' });
      
      // Restore buttons
      buttonsToHide.forEach(btn => btn.style.display = '');
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${schoolName} - ${className} Schedule</title>
            <style>
              body { margin: 0; padding: 0; }
              img { max-width: 100%; height: auto; display: block; }
              @media print { 
                body { margin: 0; padding: 0; } 
                img { max-width: 100%; page-break-inside: avoid; } 
              }
            </style>
          </head>
          <body>
            <img src="${canvas.toDataURL()}" />
          </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'Print failed', severity: 'error' });
    }
  };
  // Render Week View (this is now the primary view for editing)
  const renderWeekView = () => {
    const weekDates = getCurrentWeekDates();
    return (
      <Box ref={scheduleRef} sx={{ p: { xs: 1, md: 2 }, backgroundColor: '#fff', overflow: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2', fontSize: { xs: '1rem', md: '1.25rem' } }}>{schoolName}</Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{className} - Weekly Timetable</Typography>
        </Box>
        {/* Week Navigation - Responsive */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 0.5, md: 2 }, mb: 2, flexWrap: 'wrap' }}>
          <IconButton className="hide-on-export" onClick={goToPreviousWeek} size="small"><ChevronLeftIcon /></IconButton>
          <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: { xs: 180, md: 250 }, textAlign: 'center', fontSize: { xs: '0.85rem', md: '1.25rem' } }}>
            {formatWeekDisplay()}
          </Typography>
          <IconButton className="hide-on-export" onClick={goToNextWeek} size="small"><ChevronRightIcon /></IconButton>
          <Button className="hide-on-export" size="small" variant="outlined" onClick={handleCopyWeekToNext} startIcon={<CopyIcon />} sx={{ fontSize: { xs: '0.65rem', md: '0.875rem' }, display: { xs: 'none', sm: 'inline-flex' } }}>
            Copy to Next
          </Button>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: `60px repeat(6, 1fr)`, md: `100px repeat(6, 1fr)` }, gap: '2px', overflowX: 'auto' }}>
          <Box sx={{ p: { xs: 0.5, md: 1 }, backgroundColor: '#1976d2', color: '#fff', fontWeight: 'bold', textAlign: 'center', fontSize: { xs: '0.65rem', md: '0.875rem' } }}>Time</Box>
          {DAYS_SHORT.map((day, idx) => {
            const dateObj = new Date(weekDates[idx]);
            return (
              <Box key={day} sx={{ p: { xs: 0.5, md: 1 }, backgroundColor: '#1976d2', color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                <div style={{ fontSize: 'inherit' }}>{day}</div>
                <div style={{ fontSize: '0.6rem', opacity: 0.8 }}>{dateObj.getDate()}/{dateObj.getMonth() + 1}</div>
              </Box>
            );
          })}
          {periods.map((period, pIdx) => (
            <React.Fragment key={pIdx}>
              <Box sx={{ p: { xs: 0.5, md: 1 }, backgroundColor: '#e3f2fd', fontSize: { xs: '0.55rem', md: '0.7rem' }, textAlign: 'center' }}>
                <div style={{ fontWeight: 'bold' }}>{period.name}</div>
                <div style={{ fontSize: '0.5rem', color: '#666' }}>{period.startTime}-{period.endTime}</div>
              </Box>
              {DAYS_FULL.map((_, dayIdx) => {
                const subject = getWeekDayPeriodSubject(dayIdx, pIdx);
                return (
                  <Box key={dayIdx} onDragOver={handleDragOver} onDrop={() => handleDropPeriod(dayIdx, pIdx)}
                    onDoubleClick={() => subject && handleClearPeriod(dayIdx, pIdx)}
                    sx={{ p: { xs: 0.25, md: 1 }, backgroundColor: subject ? subject.color : '#fafafa', color: subject ? '#fff' : '#999',
                      textAlign: 'center', cursor: 'pointer', minHeight: { xs: 35, md: 50 }, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: { xs: '0.55rem', md: '0.75rem' }, fontWeight: subject ? 'bold' : 'normal',
                      transition: 'all 0.2s', '&:hover': { opacity: 0.8 } }}>
                    {subject ? subject.shortName : '+'}
                  </Box>
                );
              })}
            </React.Fragment>
          ))}
        </Box>
      </Box>
    );
  };
  // Render Month View
  const renderMonthView = () => {
    const weeks = getWeeksInMonth(currentMonth, currentYear);
    return (
      <Box ref={scheduleRef} sx={{ p: 2, backgroundColor: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
          <Tooltip title="Previous Month"><IconButton className="hide-on-export" onClick={() => setCurrentMonth(m => m === 0 ? 11 : m - 1)}><ChevronLeftIcon /></IconButton></Tooltip>
          <Tooltip title={`${MONTHS[currentMonth]} ${currentYear}`}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', minWidth: 200, textAlign: 'center', cursor: 'default' }}>
              {MONTHS[currentMonth]} {currentYear}
            </Typography>
          </Tooltip>
          <Tooltip title="Next Month"><IconButton className="hide-on-export" onClick={() => setCurrentMonth(m => m === 11 ? 0 : m + 1)}><ChevronRightIcon /></IconButton></Tooltip>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
          {DAYS_SHORT.map(day => (
            <Box key={day} sx={{ p: 1, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#e3f2fd' }}>{day}</Box>
          ))}
          {weeks.map((week, wIdx) => (
            week.map((dayInfo, dIdx) => {
              // Get ALL subjects for this specific date - handle new object structure
              const dayNum = dayInfo ? (typeof dayInfo === 'object' ? dayInfo.day : dayInfo) : null;
              const dayMonth = dayInfo && typeof dayInfo === 'object' ? dayInfo.month : currentMonth;
              const dayYear = dayInfo && typeof dayInfo === 'object' ? dayInfo.year : currentYear;
              const isCurrentMonth = dayInfo && typeof dayInfo === 'object' ? dayInfo.isCurrentMonth : true;
              const dateKey = dayNum ? `${dayYear}-${String(dayMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null;
              const allSubjects = dateKey ? getSubjectsForDate(dateKey) : [];
              const hasSubjects = allSubjects.length > 0;
              return (
                <Box key={`${wIdx}-${dIdx}`} onDragOver={handleDragOver} onDrop={() => dayNum && handleDropCalendar(dayMonth, dayNum)}
                  onDoubleClick={() => hasSubjects && handleClearCalendar(dayMonth, dayNum)}
                  sx={{ p: 0.5, minHeight: 70, border: '1px solid #e0e0e0', borderRadius: 1,
                    backgroundColor: dayNum ? (isCurrentMonth ? '#fff' : '#f9f9f9') : '#f5f5f5',
                    cursor: dayNum ? 'pointer' : 'default', opacity: isCurrentMonth ? 1 : 0.6,
                    '&:hover': dayNum ? { boxShadow: 2 } : {}, display: 'flex', flexDirection: 'column' }}>
                  {dayNum && (
                    <>
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: isCurrentMonth ? '#333' : '#999', mb: 0.5 }}>{dayNum}</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, flex: 1 }}>
                        {allSubjects.slice(0, 4).map((subject, idx) => (
                          <Box key={idx} sx={{ 
                            backgroundColor: subject.color, 
                            color: '#fff', 
                            fontSize: '0.55rem', 
                            px: 0.5, 
                            py: 0.25, 
                            borderRadius: 0.5,
                            lineHeight: 1
                          }}>
                            {subject.shortName}
                          </Box>
                        ))}
                        {allSubjects.length > 4 && (
                          <Typography variant="caption" sx={{ fontSize: '0.5rem', color: '#666' }}>
                            +{allSubjects.length - 4}
                          </Typography>
                        )}
                      </Box>
                    </>
                  )}
                </Box>
              );
            })
          ))}
        </Box>
      </Box>
    );
  };
  // Render Year View
  const renderYearView = () => (
    <Box ref={scheduleRef} sx={{ p: 2, backgroundColor: '#fff' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
        <IconButton className="hide-on-export" onClick={() => setCurrentYear(y => y - 1)}><ChevronLeftIcon /></IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Academic Year {currentYear}</Typography>
        <IconButton className="hide-on-export" onClick={() => setCurrentYear(y => y + 1)}><ChevronRightIcon /></IconButton>
      </Box>
      <Grid container spacing={2}>
        {MONTHS.map((month, mIdx) => {
          const weeks = getWeeksInMonth(mIdx, currentYear);
          return (
            <Grid item xs={6} sm={4} md={3} key={mIdx}>
              <Paper sx={{ p: 1 }}>
                <Typography variant="subtitle2" sx={{ textAlign: 'center', fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>{month}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '1px', fontSize: '0.55rem' }}>
                  {DAYS_SHORT.map(d => (
                    <Box key={d} sx={{ textAlign: 'center', fontWeight: 'bold', color: '#666', py: 0.25 }}>{d.charAt(0)}</Box>
                  ))}
                  {weeks.map((week, wIdx) => (
                    week.map((dayInfo, dIdx) => {
                      // Get subject for this specific date - handle new object structure
                      const dayNum = dayInfo ? (typeof dayInfo === 'object' ? dayInfo.day : dayInfo) : null;
                      const dayMonth = dayInfo && typeof dayInfo === 'object' ? dayInfo.month : mIdx;
                      const dayYear = dayInfo && typeof dayInfo === 'object' ? dayInfo.year : currentYear;
                      const isCurrentMonth = dayInfo && typeof dayInfo === 'object' ? dayInfo.isCurrentMonth : true;
                      const dateKey = dayNum ? `${dayYear}-${String(dayMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}` : null;
                      const subject = dateKey ? getSubjectForDate(dateKey) : null;
                      return (
                        <Box key={`${wIdx}-${dIdx}`} onDragOver={handleDragOver} onDrop={() => dayNum && handleDropCalendar(dayMonth, dayNum)}
                          onDoubleClick={() => subject && handleClearCalendar(dayMonth, dayNum)}
                          sx={{ height: 16, backgroundColor: subject ? subject.color : (dayNum ? (isCurrentMonth ? '#fafafa' : '#e8e8e8') : '#f0f0f0'),
                            borderRadius: '2px', cursor: dayNum ? 'pointer' : 'default', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', color: subject ? '#fff' : (isCurrentMonth ? '#333' : '#999'), fontSize: '0.5rem',
                            opacity: isCurrentMonth ? 1 : 0.6 }}>
                          {dayNum && !subject && dayNum}
                          {subject && subject.shortName.charAt(0)}
                        </Box>
                      );
                    })
                  ))}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
      <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
        {subjects.map(s => <Chip key={s.id} label={s.name} size="small" sx={{ backgroundColor: s.color, color: '#fff' }} />)}
      </Box>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', bgcolor: '#f5f5f5' }}>
      {/* Left Sidebar */}
      <Paper sx={{ width: 280, display: 'flex', flexDirection: 'column', borderRadius: 0 }}>
        <Tabs value={leftTab} onChange={(e, v) => setLeftTab(v)} variant="fullWidth">
          <Tab label="Subjects" sx={{ fontSize: '0.7rem', minWidth: 0 }} />
          <Tab label="Templates" sx={{ fontSize: '0.7rem', minWidth: 0 }} />
          <Tab label="Settings" sx={{ fontSize: '0.7rem', minWidth: 0 }} />
        </Tabs>
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          {/* Subjects Tab */}
          {leftTab === 0 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Drag subjects to schedule
              </Typography>
              {subjects.map(subject => (
                <Box key={subject.id} draggable onDragStart={() => handleDragStart(subject)}
                  sx={{ display: 'flex', alignItems: 'center', p: 1, mb: 1, borderRadius: 1,
                    backgroundColor: subject.color, color: '#fff', cursor: 'grab',
                    '&:hover': { opacity: 0.9 }, '&:active': { cursor: 'grabbing' } }}>
                  <DragIcon sx={{ mr: 1, fontSize: 16 }} />
                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{subject.name}</Typography>
                  <IconButton size="small" sx={{ color: '#fff', p: 0.25 }}
                    onClick={(e) => { e.stopPropagation();
                      setNewSubject({ name: subject.name, color: subject.color, shortName: subject.shortName });
                      setSubjectDialog({ open: true, mode: 'edit', subject }); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#fff', p: 0.25 }}
                    onClick={(e) => { e.stopPropagation(); handleDeleteSubjectClick(subject.id, subject.name); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button variant="outlined" startIcon={<AddIcon />} fullWidth size="small"
                onClick={() => { setNewSubject({ name: '', color: '#2196f3', shortName: '' });
                  setSubjectDialog({ open: true, mode: 'add', subject: null }); }}>
                Add Subject
              </Button>
            </>
          )}
          {/* Templates Tab */}
          {leftTab === 1 && (
            <>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Your saved schedule templates
              </Typography>
              {savedSchedules.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No templates yet. Save your first schedule!
                </Typography>
              ) : (
                savedSchedules.map((schedule) => (
                  <Card key={schedule.id} sx={{ mb: 1 }}>
                    <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                      <Typography variant="subtitle2">{schedule.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(schedule.savedAt).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0, px: 1, pb: 1 }}>
                      <Button size="small" onClick={() => handleLoadSchedule(schedule)}>Load</Button>
                      <Button size="small" onClick={() => handleEditTemplate(schedule)}>Edit</Button>
                      <IconButton size="small" onClick={() => handleDeleteTemplate(schedule.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </CardActions>
                  </Card>
                ))
              )}
            </>
          )}
          {/* Settings Tab - School Info & Period Configuration */}
          {leftTab === 2 && (
            <>
              <Typography variant="subtitle2" gutterBottom>School Information</Typography>
              <TextField 
                size="small" 
                fullWidth 
                label="School Name" 
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                sx={{ mb: 1 }}
              />
              <TextField 
                size="small" 
                fullWidth 
                label="Class / Section" 
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" gutterBottom>Period Timings</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Customize your school&apos;s period schedule
              </Typography>
              {periods.map((period, idx) => (
                <Box key={period.id} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1,
                  p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                  <ScheduleIcon sx={{ fontSize: 16, color: '#666' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" fontWeight="bold">{period.name}</Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {period.startTime} - {period.endTime}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => {
                    setNewPeriod({ name: period.name, startTime: period.startTime, endTime: period.endTime });
                    setPeriodDialog({ open: true, mode: 'edit', period }); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeletePeriod(period.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button variant="outlined" startIcon={<AddIcon />} fullWidth size="small"
                onClick={() => { setNewPeriod({ name: `Period ${periods.length + 1}`, startTime: '08:00', endTime: '08:45' });
                  setPeriodDialog({ open: true, mode: 'add', period: null }); }}>
                Add Period
              </Button>
            </>
          )}
        </Box>
      </Paper>
      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <Paper sx={{ p: 1, borderRadius: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant={viewMode === 'week' ? 'contained' : 'outlined'} startIcon={<WeekIcon />} sx={{ '&:hover': { backgroundColor: viewMode === 'week' ? '#333' : 'rgba(0,0,0,0.04)', color: viewMode === 'week' ? '#fff' : '#000', borderColor: '#000' } }}
            onClick={() => setViewMode('week')}>Week</Button>
          <Button size="small" variant={viewMode === 'month' ? 'contained' : 'outlined'} startIcon={<MonthIcon />} sx={{ '&:hover': { backgroundColor: viewMode === 'month' ? '#333' : 'rgba(0,0,0,0.04)', color: viewMode === 'month' ? '#fff' : '#000', borderColor: '#000' } }}
            onClick={() => setViewMode('month')}>Month</Button>
          <Button size="small" variant={viewMode === 'year' ? 'contained' : 'outlined'} startIcon={<YearIcon />} sx={{ '&:hover': { backgroundColor: viewMode === 'year' ? '#333' : 'rgba(0,0,0,0.04)', color: viewMode === 'year' ? '#fff' : '#000', borderColor: '#000' } }}
            onClick={() => setViewMode('year')}>Year</Button>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Button size="small" variant="outlined" startIcon={<SaveIcon />} onClick={() => { setEditingTemplate(null); setScheduleName(''); setSaveDialog(true); }}
            sx={{ color: '#1976d2', borderColor: '#1976d2', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: '#000', borderColor: '#000' } }}>Save</Button>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}
            sx={{ color: '#1976d2', borderColor: '#1976d2', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: '#000', borderColor: '#000' } }}>Export</Button>
          <Button size="small" variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}
            sx={{ color: '#1976d2', borderColor: '#1976d2', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)', color: '#000', borderColor: '#000' } }}>Print</Button>
        </Paper>
        {/* Schedule Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'year' && renderYearView()}
        </Box>
      </Box>
      {/* Subject Dialog */}
      <Dialog open={subjectDialog.open} onClose={() => setSubjectDialog({ open: false, mode: 'add', subject: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {subjectDialog.mode === 'add' ? 'Add Subject' : 'Edit Subject'}
          <IconButton onClick={() => setSubjectDialog({ open: false, mode: 'add', subject: null })} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          <TextField autoFocus margin="dense" label="Subject Name" fullWidth value={newSubject.name}
            onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value.substring(0, 30) })} 
            sx={{ mb: 2 }} 
            inputProps={{ maxLength: 30 }}
            helperText={`${newSubject.name.length}/30 characters`} />
          <TextField margin="dense" label="Short Name (4 chars)" fullWidth value={newSubject.shortName}
            onChange={(e) => setNewSubject({ ...newSubject, shortName: e.target.value.toUpperCase().substring(0, 4) })}
            sx={{ mb: 2 }} inputProps={{ maxLength: 4 }} />
          <Typography variant="subtitle2" gutterBottom>Color</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {COLOR_PRESETS.map(color => (
              <Box key={color} onClick={() => setNewSubject({ ...newSubject, color })}
                sx={{ width: 28, height: 28, backgroundColor: color, borderRadius: 1, cursor: 'pointer',
                  border: newSubject.color === color ? '3px solid #000' : '1px solid #ccc',
                  '&:hover': { transform: 'scale(1.1)' } }} />
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setSubjectDialog({ open: false, mode: 'add', subject: null })} variant="outlined" size="large">Cancel</Button>
          <Button onClick={handleSaveSubject} variant="contained" color="primary" size="large" sx={{ fontWeight: 'bold', minWidth: 100 }}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Period Dialog */}
      <Dialog open={periodDialog.open} onClose={() => setPeriodDialog({ open: false, mode: 'add', period: null })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {periodDialog.mode === 'add' ? 'Add Period' : 'Edit Period'}
          <IconButton onClick={() => setPeriodDialog({ open: false, mode: 'add', period: null })} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '60vh', overflow: 'auto' }}>
          <TextField autoFocus margin="dense" label="Period Name" fullWidth value={newPeriod.name}
            onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value.substring(0, 20) })} 
            sx={{ mb: 2 }}
            inputProps={{ maxLength: 20 }}
            helperText={`${newPeriod.name.length}/20 characters`} />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField type="time" label="Start Time" fullWidth value={newPeriod.startTime}
                onChange={(e) => setNewPeriod({ ...newPeriod, startTime: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField type="time" label="End Time" fullWidth value={newPeriod.endTime}
                onChange={(e) => setNewPeriod({ ...newPeriod, endTime: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, borderTop: '1px solid #e0e0e0' }}>
          <Button onClick={() => setPeriodDialog({ open: false, mode: 'add', period: null })} variant="outlined" size="large">Cancel</Button>
          <Button onClick={handleSavePeriod} variant="contained" color="primary" size="large" sx={{ fontWeight: 'bold', minWidth: 100 }}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Save Dialog */}
      <Dialog open={saveDialog} onClose={() => { setSaveDialog(false); setEditingTemplate(null); }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editingTemplate ? 'Edit Template' : 'Save as Template'}
          <IconButton onClick={() => { setSaveDialog(false); setEditingTemplate(null); }} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Template Name" fullWidth value={scheduleName}
            onChange={(e) => setScheduleName(e.target.value)} placeholder="e.g., Class 5A Timetable" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSaveDialog(false); setEditingTemplate(null); }}>Cancel</Button>
          <Button onClick={handleSaveSchedule} variant="contained" color="primary" sx={{ fontWeight: 'bold' }}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Confirmation Dialog for Subject Deletion */}
      <Dialog open={confirmDeleteDialog.open} onClose={() => setConfirmDeleteDialog({ open: false, subjectId: null, subjectName: '' })}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Confirm Delete
          <IconButton onClick={() => setConfirmDeleteDialog({ open: false, subjectId: null, subjectName: '' })} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the subject "<strong>{confirmDeleteDialog.subjectName}</strong>"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setConfirmDeleteDialog({ open: false, subjectId: null, subjectName: '' })} variant="outlined">Cancel</Button>
          <Button onClick={confirmDeleteSubject} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
export default MicroScheduler;
