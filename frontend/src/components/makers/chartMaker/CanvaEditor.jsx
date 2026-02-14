import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Slider,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Grid,
  Card,
  CardMedia,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  Popover,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  TextFields as TextIcon,
  Image as ImageIcon,
  Rectangle as RectangleIcon,
  Circle as CircleIcon,
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon,
  Layers as LayersIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  ContentCopy as CopyIcon,
  Palette as PaletteIcon,
  BorderColor as BorderIcon,
  Opacity as OpacityIcon,
  RotateRight as RotateIcon,
  FlipToFront as BringFrontIcon,
  FlipToBack as SendBackIcon,
  GridOn as GridIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
  Star as StarIcon,
  ChangeHistory as TriangleIcon,
  Straighten as LineIcon,
  ArrowForward as ArrowIcon,
  Category as ShapesIcon,
  PhotoLibrary as TemplatesIcon,
  Upload as UploadIcon,
  Crop as CropIcon,
  FilterNone as DuplicateIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  CenterFocusStrong as CenterIcon,
  FitScreen as FitScreenIcon
} from '@mui/icons-material';
import './canvaEditor.css';
// Canvas Element Types
const ELEMENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  LINE: 'line',
  STAR: 'star',
  ARROW: 'arrow'
};
// Default Templates - 16 Professional Templates
const TEMPLATES = [
  { id: 1, name: 'Certificate', width: 800, height: 600, category: 'Documents', bg: 'linear-gradient(135deg, #fef3e2 0%, #ffecd2 100%)', borderColor: '#d4af37' },
  { id: 2, name: 'Award Certificate', width: 800, height: 600, category: 'Documents', bg: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)', borderColor: '#1976d2' },
  { id: 3, name: 'Poster A4', width: 595, height: 842, category: 'Posters', bg: '#ffffff', borderColor: '#e91e63' },
  { id: 4, name: 'Event Poster', width: 595, height: 842, category: 'Posters', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderColor: '#fff' },
  { id: 5, name: 'Social Square', width: 1080, height: 1080, category: 'Social', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderColor: '#fff' },
  { id: 6, name: 'Social Story', width: 1080, height: 1920, category: 'Social', bg: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderColor: '#fff' },
  { id: 7, name: 'Presentation', width: 960, height: 540, category: 'Presentation', bg: '#ffffff', borderColor: '#1976d2' },
  { id: 8, name: 'Dark Presentation', width: 960, height: 540, category: 'Presentation', bg: 'linear-gradient(135deg, #232526 0%, #414345 100%)', borderColor: '#ffc107' },
  { id: 9, name: 'Banner Wide', width: 1200, height: 300, category: 'Banners', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', borderColor: '#fff' },
  { id: 10, name: 'Banner Tall', width: 300, height: 600, category: 'Banners', bg: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', borderColor: '#333' },
  { id: 11, name: 'ID Card', width: 340, height: 215, category: 'Cards', bg: '#ffffff', borderColor: '#2196f3' },
  { id: 12, name: 'Business Card', width: 350, height: 200, category: 'Cards', bg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderColor: '#eee' },
  { id: 13, name: 'Report Card', width: 600, height: 800, category: 'Documents', bg: '#fafafa', borderColor: '#4caf50' },
  { id: 14, name: 'Worksheet', width: 595, height: 842, category: 'Documents', bg: '#ffffff', borderColor: '#ff9800' },
  { id: 15, name: 'Invitation', width: 500, height: 700, category: 'Cards', bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', borderColor: '#8b4513' },
  { id: 16, name: 'Photo Collage', width: 800, height: 800, category: 'Social', bg: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', borderColor: '#9c27b0' },
];
const TEMPLATE_CATEGORIES = ['All', 'Documents', 'Posters', 'Social', 'Presentation', 'Banners', 'Cards'];
// Color Presets - Extended palette with more colors
const COLOR_PRESETS = [
  // Basic colors
  '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722',
  // Extended colors
  '#795548', '#607d8b', '#9e9e9e', '#424242', '#212121', '#f5f5f5',
  '#ffcdd2', '#f8bbd9', '#e1bee7', '#d1c4e9', '#c5cae9', '#bbdefb',
  '#b3e5fc', '#b2ebf2', '#b2dfdb', '#c8e6c9', '#dcedc8', '#f0f4c3',
  '#fff9c4', '#ffecb3', '#ffe0b2', '#ffccbc', '#d7ccc8', '#cfd8dc',
  // Additional vibrant colors
  '#ff1744', '#f50057', '#d500f9', '#651fff', '#3d5afe', '#2979ff',
  '#00b0ff', '#00e5ff', '#1de9b6', '#00e676', '#76ff03', '#c6ff00',
  '#ffea00', '#ffc400', '#ff9100', '#ff3d00', '#8d6e63', '#78909c'
];
// Font Families
const FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
  'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Courier New', 'Roboto',
  'Open Sans', 'Montserrat', 'Poppins', 'Playfair Display'
];
// Image library for the editor
const SAMPLE_IMAGES = [
  '/static/media/education-icon-1.svg',
  '/static/media/education-icon-2.svg',
  '/static/media/education-icon-3.svg',
  '/static/media/education-icon-4.svg',
  '/static/media/education-icon-5.svg',
  '/static/media/education-icon-6.svg',
  '/static/media/education-icon-7.svg',
  '/static/media/education-icon-8.svg',
];
const CanvaEditor = () => {
  // Canvas State
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [zoom, setZoom] = useState(100);
  const [showGrid, setShowGrid] = useState(false);
  // Elements State
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  // UI State
  const [leftTab, setLeftTab] = useState(0);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [templateDialog, setTemplateDialog] = useState(false);
  const [exportDialog, setExportDialog] = useState(false);
  // Save/Load State
  const [saveDialog, setSaveDialog] = useState(false);
  const [designName, setDesignName] = useState('');
  const [savedDesigns, setSavedDesigns] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('chartMakerDesigns') || '[]');
    } catch {
      return [];
    }
  });
  const [templateCategory, setTemplateCategory] = useState('All');
  const [editingDesign, setEditingDesign] = useState(null);
  // Image Bank State
  const [imageBankImages, setImageBankImages] = useState([]);
  const [imageBankCategory, setImageBankCategory] = useState('ANIMALS');
  const [imageBankLoading, setImageBankLoading] = useState(false);
  const [imageBankSearch, setImageBankSearch] = useState('');
  // Multi-selection for grouping
  const [selectedElements, setSelectedElements] = useState([]);
  // Image Bank Categories
  const IMAGE_BANK_CATEGORIES = [
    'ANIMALS', 'BIRDS', 'FRUITS', 'VEGETABLES', 'FLOWERS', 
    'FESTIVALS', 'PROFESSIONS', 'VEHICLES', 'EXPRESSIONS',
    'GOOD MANNERS', 'HABITS', 'INSECTS', 'PLANTS', 'POLLUTION'
  ];
  // Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  
  // Load Image Bank when category changes
  useEffect(() => {
    let isMounted = true;
    if (leftTab === 2 && imageBankCategory) {
      (async () => {
        setImageBankLoading(true);
        try {
          const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/images/fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              folderPath: `one_click_resource_centre/image bank/${imageBankCategory}`,
              imagesPerPage: 50
            })
          });
          
          if (response.ok && isMounted) {
            const data = await response.json();
            const images = Object.values(data.list || {}).filter(url => 
              url && (url.endsWith('.jpg') || url.endsWith('.png') || url.endsWith('.jpeg') || url.endsWith('.gif'))
            );
            setImageBankImages(images);
          }
        } catch (error) {
          console.error('Error fetching Image Bank:', error);
          if (isMounted) {
            setSnackbar({ open: true, message: 'Failed to load Image Bank', severity: 'error' });
          }
        }
        if (isMounted) setImageBankLoading(false);
      })();
    }
    return () => { isMounted = false; };
  }, [imageBankCategory, leftTab]);
  
  // Include saved designs in templates
  const allTemplates = [...TEMPLATES, ...savedDesigns.map(d => ({
    id: `saved-${d.name}`,
    name: `📁 ${d.name}`,
    width: d.canvasSize.width,
    height: d.canvasSize.height,
    bg: d.canvasBg,
    category: 'Saved',
    isSaved: true,
    savedData: d
  }))];
  const filteredTemplates = templateCategory === 'All' 
    ? allTemplates 
    : allTemplates.filter(t => t.category === templateCategory || t.isSaved);
  // Save to history
  const saveToHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newElements));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(JSON.parse(history[historyIndex - 1]));
      setSelectedElement(null);
    }
  };
  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(JSON.parse(history[historyIndex + 1]));
      setSelectedElement(null);
    }
  };
  // Generate unique ID for elements
  const generateElementId = useCallback(() => {
    return `el_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // Add Element
  const addElement = (type, props = {}) => {
    const newElement = {
      id: generateElementId(),
      type,
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 25,
      width: 100,
      height: 50,
      rotation: 0,
      opacity: 1,
      locked: false,
      ...getDefaultProps(type),
      ...props
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement.id);
    saveToHistory(newElements);
  };
  // Get Default Props for Element Type
  const getDefaultProps = (type) => {
    switch (type) {
      case ELEMENT_TYPES.TEXT:
        return {
          text: 'Enter text here',
          fontSize: 24,
          fontFamily: 'Arial',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center',
          color: '#000000',
          backgroundColor: 'transparent',
          width: 200,
          height: 40
        };
      case ELEMENT_TYPES.RECTANGLE:
        return {
          fill: '#2196f3',
          stroke: '#1976d2',
          strokeWidth: 2,
          borderRadius: 0,
          width: 150,
          height: 100
        };
      case ELEMENT_TYPES.CIRCLE:
        return {
          fill: '#4caf50',
          stroke: '#388e3c',
          strokeWidth: 2,
          width: 100,
          height: 100
        };
      case ELEMENT_TYPES.TRIANGLE:
        return {
          fill: '#ff9800',
          stroke: '#f57c00',
          strokeWidth: 2,
          width: 100,
          height: 100
        };
      case ELEMENT_TYPES.STAR:
        return {
          fill: '#ffc107',
          stroke: '#ffa000',
          strokeWidth: 2,
          width: 100,
          height: 100,
          points: 5
        };
      case ELEMENT_TYPES.LINE:
        return {
          stroke: '#000000',
          strokeWidth: 3,
          width: 150,
          height: 4
        };
      case ELEMENT_TYPES.ARROW:
        return {
          stroke: '#000000',
          strokeWidth: 3,
          width: 150,
          height: 4
        };
      case ELEMENT_TYPES.IMAGE:
        return {
          src: '',
          width: 150,
          height: 150,
          objectFit: 'contain'
        };
      default:
        return {};
    }
  };
  // Update Element
  const updateElement = (id, updates) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    saveToHistory(newElements);
  };
  // Delete Element
  const deleteElement = (id) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    setSelectedElement(null);
    saveToHistory(newElements);
  };
  // Duplicate Element
  const duplicateElement = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: Date.now(),
        x: element.x + 20,
        y: element.y + 20
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      setSelectedElement(newElement.id);
      saveToHistory(newElements);
    }
  };
  // Bring to Front
  const bringToFront = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElements = [...elements.filter(el => el.id !== id), element];
      setElements(newElements);
      saveToHistory(newElements);
    }
  };
  // Send to Back
  const sendToBack = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElements = [element, ...elements.filter(el => el.id !== id)];
      setElements(newElements);
      saveToHistory(newElements);
    }
  };
  // Clear Canvas
  const clearCanvas = () => {
    setElements([]);
    setSelectedElement(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSnackbar({ open: true, message: 'Canvas cleared!', severity: 'info' });
  };
  // Handle Mouse Down on Element
  const handleElementMouseDown = (e, element) => {
    e.stopPropagation();
    
    // Shift+click for multi-selection
    if (e.shiftKey) {
      setSelectedElements(prev => {
        if (prev.includes(element.id)) {
          return prev.filter(id => id !== element.id);
        }
        return [...prev, element.id];
      });
      setSelectedElement(element.id);
      return;
    }
    
    // Clear multi-selection on single click
    setSelectedElements([]);
    
    // Allow selection of locked elements but prevent dragging
    setSelectedElement(element.id);
    if (element.locked) return; // Don't allow dragging if locked
    setIsDragging(true);
    setDragStart({
      x: e.clientX - element.x,
      y: e.clientY - element.y
    });
  };
  
  // Group selected elements
  const handleGroupElements = () => {
    if (selectedElements.length < 2) {
      setSnackbar({ open: true, message: 'Select at least 2 elements to group (Shift+click)', severity: 'info' });
      return;
    }
    const groupedElements = elements.filter(el => selectedElements.includes(el.id));
    const minX = Math.min(...groupedElements.map(el => el.x));
    const minY = Math.min(...groupedElements.map(el => el.y));
    const maxX = Math.max(...groupedElements.map(el => el.x + (el.width || 100)));
    const maxY = Math.max(...groupedElements.map(el => el.y + (el.height || 100)));
    
    const groupId = `group-${Date.now()}`;
    setElements(prev => prev.map(el => 
      selectedElements.includes(el.id) 
        ? { ...el, groupId } 
        : el
    ));
    setSelectedElements([]);
    setSnackbar({ open: true, message: `Grouped ${selectedElements.length} elements`, severity: 'success' });
  };
  
  // Ungroup elements
  const handleUngroupElements = () => {
    const selectedEl = elements.find(el => el.id === selectedElement);
    if (!selectedEl?.groupId) {
      setSnackbar({ open: true, message: 'Select a grouped element to ungroup', severity: 'info' });
      return;
    }
    setElements(prev => prev.map(el => 
      el.groupId === selectedEl.groupId 
        ? { ...el, groupId: null } 
        : el
    ));
    setSnackbar({ open: true, message: 'Elements ungrouped', severity: 'success' });
  };
  
  // Duplicate selected elements
  const handleDuplicateElements = () => {
    if (selectedElements.length > 0) {
      const newElements = selectedElements.map(id => {
        const el = elements.find(e => e.id === id);
        if (el) {
          return {
            ...el,
            id: `${el.type}-${Date.now()}-${Math.random()}`,
            x: el.x + 20,
            y: el.y + 20,
            groupId: null
          };
        }
        return null;
      }).filter(Boolean);
      setElements(prev => [...prev, ...newElements]);
      setSnackbar({ open: true, message: `Duplicated ${newElements.length} elements`, severity: 'success' });
    } else if (selectedElement) {
      const el = elements.find(e => e.id === selectedElement);
      if (el) {
        const newEl = {
          ...el,
          id: `${el.type}-${Date.now()}`,
          x: el.x + 20,
          y: el.y + 20,
          groupId: null
        };
        setElements(prev => [...prev, newEl]);
        setSnackbar({ open: true, message: 'Element duplicated', severity: 'success' });
      }
    }
  };
  
  // Center all elements on canvas
  const handleCenterElements = () => {
    if (elements.length === 0) {
      setSnackbar({ open: true, message: 'No elements to center', severity: 'info' });
      return;
    }
    
    // Calculate bounding box of all elements
    const minX = Math.min(...elements.map(el => el.x));
    const maxX = Math.max(...elements.map(el => el.x + el.width));
    const minY = Math.min(...elements.map(el => el.y));
    const maxY = Math.max(...elements.map(el => el.y + el.height));
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    // Calculate offset to center
    const offsetX = (canvasSize.width - contentWidth) / 2 - minX;
    const offsetY = (canvasSize.height - contentHeight) / 2 - minY;
    
    // Move all elements
    const newElements = elements.map(el => ({
      ...el,
      x: el.x + offsetX,
      y: el.y + offsetY
    }));
    
    setElements(newElements);
    saveToHistory(newElements);
    setSnackbar({ open: true, message: 'Elements centered on canvas', severity: 'success' });
  };
  
  // Fit canvas to content
  const handleFitCanvasToContent = () => {
    if (elements.length === 0) {
      setSnackbar({ open: true, message: 'No elements to fit', severity: 'info' });
      return;
    }
    
    // Calculate bounding box of all elements with padding
    const padding = 40;
    const minX = Math.min(...elements.map(el => el.x));
    const maxX = Math.max(...elements.map(el => el.x + el.width));
    const minY = Math.min(...elements.map(el => el.y));
    const maxY = Math.max(...elements.map(el => el.y + el.height));
    
    const contentWidth = maxX - minX + (padding * 2);
    const contentHeight = maxY - minY + (padding * 2);
    
    // Move elements to start from padding
    const offsetX = padding - minX;
    const offsetY = padding - minY;
    
    const newElements = elements.map(el => ({
      ...el,
      x: el.x + offsetX,
      y: el.y + offsetY
    }));
    
    setElements(newElements);
    setCanvasSize({ width: Math.max(200, contentWidth), height: Math.max(200, contentHeight) });
    saveToHistory(newElements);
    setSnackbar({ open: true, message: 'Canvas fitted to content', severity: 'success' });
  };
  
  // Handle Mouse Move
  const handleMouseMove = (e) => {
    if (isDragging && selectedElement) {
      const element = elements.find(el => el.id === selectedElement);
      if (element && !element.locked) {
        updateElement(selectedElement, {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
    }
    if (isResizing && selectedElement && resizeHandle) {
      const element = elements.find(el => el.id === selectedElement);
      if (element && !element.locked) {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / (zoom / 100);
        const y = (e.clientY - rect.top) / (zoom / 100);
        let updates = {};
        if (resizeHandle.includes('e')) {
          updates.width = Math.max(20, x - element.x);
        }
        if (resizeHandle.includes('w')) {
          const newWidth = element.x + element.width - x;
          if (newWidth > 20) {
            updates.x = x;
            updates.width = newWidth;
          }
        }
        if (resizeHandle.includes('s')) {
          updates.height = Math.max(20, y - element.y);
        }
        if (resizeHandle.includes('n')) {
          const newHeight = element.y + element.height - y;
          if (newHeight > 20) {
            updates.y = y;
            updates.height = newHeight;
          }
        }
        updateElement(selectedElement, updates);
      }
    }
  };
  // Handle Mouse Up
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  };
  // Handle Canvas Click
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-area')) {
      setSelectedElement(null);
    }
  };
  // Handle Text Edit
  const handleTextDoubleClick = (e, element) => {
    e.stopPropagation();
    const newText = prompt('Enter text:', element.text);
    if (newText !== null) {
      updateElement(element.id, { text: newText });
    }
  };
  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addElement(ELEMENT_TYPES.IMAGE, {
          src: event.target.result,
          width: 200,
          height: 200
        });
        setSnackbar({ open: true, message: 'Image uploaded successfully!', severity: 'success' });
      };
      reader.onerror = () => {
        setSnackbar({ open: true, message: 'Failed to load image', severity: 'error' });
      };
      reader.readAsDataURL(file);
      // Reset input to allow re-selecting the same file
      e.target.value = '';
    }
  };
  // Apply Template
  const applyTemplate = (template) => {
    if (template.isSaved && template.savedData) {
      // Load saved design
      setCanvasSize(template.savedData.canvasSize);
      setCanvasBg(template.savedData.canvasBg);
      setElements(template.savedData.elements || []);
    } else {
      setCanvasSize({ width: template.width, height: template.height });
      setCanvasBg(template.bg);
      setElements([]);
    }
    setSelectedElement(null);
    setTemplateDialog(false);
    setSnackbar({ open: true, message: `Template "${template.name}" applied!`, severity: 'success' });
  };
  // Save Design with Name
  const handleSaveDesign = () => {
    if (!designName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a name', severity: 'error' });
      return;
    }
    const design = {
      id: editingDesign?.id || Date.now(),
      name: designName,
      canvasSize,
      canvasBg,
      elements,
      savedAt: new Date().toISOString()
    };
    let newList;
    if (editingDesign) {
      newList = savedDesigns.map(d => d.id === editingDesign.id ? design : d);
    } else {
      newList = [...savedDesigns.filter(d => d.name !== designName), design];
    }
    localStorage.setItem('chartMakerDesigns', JSON.stringify(newList));
    setSavedDesigns(newList);
    setSaveDialog(false);
    setDesignName('');
    setEditingDesign(null);
    setSnackbar({ open: true, message: `"${designName}" saved!`, severity: 'success' });
  };
  // Load Design
  const handleLoadDesign = (design) => {
    setCanvasSize(design.canvasSize);
    setCanvasBg(design.canvasBg);
    setElements(design.elements || []);
    setSelectedElement(null);
    setSnackbar({ open: true, message: `Loaded "${design.name}"`, severity: 'success' });
  };
  // Edit Saved Design
  const handleEditDesign = (design) => {
    setEditingDesign(design);
    setDesignName(design.name);
    setSaveDialog(true);
  };
  // Delete Saved Design
  const handleDeleteDesign = (id) => {
    const newList = savedDesigns.filter(d => d.id !== id && d.name !== id);
    localStorage.setItem('chartMakerDesigns', JSON.stringify(newList));
    setSavedDesigns(newList);
    setSnackbar({ open: true, message: 'Design deleted', severity: 'info' });
  };
  // Export Canvas
  const exportCanvas = (format) => {
    setSnackbar({ open: true, message: `Exporting as ${format.toUpperCase()}...`, severity: 'info' });
    setExportDialog(false);
    setTimeout(() => {
      setSnackbar({ open: true, message: 'Export completed!', severity: 'success' });
    }, 1500);
  };
  // Get Selected Element
  const getSelectedElement = () => elements.find(el => el.id === selectedElement);
  // Render Element
  const renderElement = (element) => {
    const isSelected = selectedElement === element.id;
    const isMultiSelected = selectedElements.includes(element.id);
    const isGrouped = element.groupId;
    
    let outlineColor = 'none';
    if (isSelected) outlineColor = '2px solid #2196f3';
    else if (isMultiSelected) outlineColor = '2px dashed #ff9800';
    else if (isGrouped) outlineColor = '1px dotted #9c27b0';
    
    const baseStyle = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation}deg)`,
      opacity: element.opacity,
      cursor: element.locked ? 'not-allowed' : 'move',
      outline: outlineColor,
      boxSizing: 'border-box'
    };
    const handleProps = {
      onMouseDown: (e) => handleElementMouseDown(e, element),
      onDoubleClick: element.type === ELEMENT_TYPES.TEXT ? (e) => handleTextDoubleClick(e, element) : undefined
    };
    switch (element.type) {
      case ELEMENT_TYPES.TEXT:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              display: 'flex',
              alignItems: 'center',
              justifyContent: element.textAlign,
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              fontWeight: element.fontWeight,
              fontStyle: element.fontStyle,
              textDecoration: element.textDecoration,
              color: element.color,
              backgroundColor: element.backgroundColor,
              padding: '4px 8px',
              whiteSpace: 'pre-wrap',
              overflow: 'hidden'
            }}
            {...handleProps}
          >
            {element.text}
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      case ELEMENT_TYPES.RECTANGLE:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.fill,
              border: `${element.strokeWidth}px solid ${element.stroke}`,
              borderRadius: element.borderRadius
            }}
            {...handleProps}
          >
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      case ELEMENT_TYPES.CIRCLE:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              backgroundColor: element.fill,
              border: `${element.strokeWidth}px solid ${element.stroke}`,
              borderRadius: '50%'
            }}
            {...handleProps}
          >
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      case ELEMENT_TYPES.TRIANGLE:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              width: 0,
              height: 0,
              borderLeft: `${element.width / 2}px solid transparent`,
              borderRight: `${element.width / 2}px solid transparent`,
              borderBottom: `${element.height}px solid ${element.fill}`,
              backgroundColor: 'transparent'
            }}
            {...handleProps}
          >
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      case ELEMENT_TYPES.STAR:
        return (
          <div
            key={element.id}
            style={baseStyle}
            {...handleProps}
          >
            <svg width={element.width} height={element.height} viewBox="0 0 100 100">
              <polygon
                points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40"
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
              />
            </svg>
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      case ELEMENT_TYPES.LINE:
        return (
          <div
            key={element.id}
            style={{
              ...baseStyle,
              height: element.strokeWidth,
              backgroundColor: element.stroke
            }}
            {...handleProps}
          >
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      case ELEMENT_TYPES.ARROW:
        return (
          <div
            key={element.id}
            style={baseStyle}
            {...handleProps}
          >
            <svg width={element.width} height="20" viewBox={`0 0 ${element.width} 20`}>
              <line x1="0" y1="10" x2={element.width - 15} y2="10" stroke={element.stroke} strokeWidth={element.strokeWidth} />
              <polygon points={`${element.width},10 ${element.width - 15},5 ${element.width - 15},15`} fill={element.stroke} />
            </svg>
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      case ELEMENT_TYPES.IMAGE:
        return (
          <div
            key={element.id}
            style={baseStyle}
            {...handleProps}
          >
            <img
              src={element.src}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: element.objectFit,
                pointerEvents: 'none'
              }}
              draggable={false}
            />
            {isSelected && renderResizeHandles(element)}
          </div>
        );
      default:
        return null;
    }
  };
  // Render Resize Handles
  const renderResizeHandles = (element) => {
    if (element.locked) return null;
    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
    const handleStyle = {
      position: 'absolute',
      width: 10,
      height: 10,
      backgroundColor: '#fff',
      border: '2px solid #2196f3',
      borderRadius: 2
    };
    const positions = {
      nw: { top: -5, left: -5, cursor: 'nwse-resize' },
      n: { top: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      ne: { top: -5, right: -5, cursor: 'nesw-resize' },
      e: { top: '50%', right: -5, transform: 'translateY(-50%)', cursor: 'ew-resize' },
      se: { bottom: -5, right: -5, cursor: 'nwse-resize' },
      s: { bottom: -5, left: '50%', transform: 'translateX(-50%)', cursor: 'ns-resize' },
      sw: { bottom: -5, left: -5, cursor: 'nesw-resize' },
      w: { top: '50%', left: -5, transform: 'translateY(-50%)', cursor: 'ew-resize' }
    };
    return handles.map(handle => (
      <div
        key={handle}
        style={{ ...handleStyle, ...positions[handle] }}
        onMouseDown={(e) => {
          e.stopPropagation();
          setIsResizing(true);
          setResizeHandle(handle);
        }}
      />
    ));
  };
  // Color Picker
  const renderColorPicker = () => (
    <Popover
      open={Boolean(colorPickerAnchor)}
      anchorEl={colorPickerAnchor}
      onClose={() => setColorPickerAnchor(null)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Box sx={{ p: 2, width: 200 }}>
        <Typography variant="subtitle2" gutterBottom>Colors</Typography>
        <Grid container spacing={0.5}>
          {COLOR_PRESETS.map((color, i) => (
            <Grid item key={i}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  backgroundColor: color,
                  border: '1px solid #ccc',
                  cursor: 'pointer',
                  '&:hover': { transform: 'scale(1.1)' }
                }}
                onClick={() => {
                  if (colorPickerTarget && selectedElement) {
                    updateElement(selectedElement, { [colorPickerTarget]: color });
                  } else if (colorPickerTarget === 'canvasBg') {
                    setCanvasBg(color);
                  }
                  setColorPickerAnchor(null);
                }}
              />
            </Grid>
          ))}
        </Grid>
        <TextField
          size="small"
          fullWidth
          sx={{ mt: 1 }}
          placeholder="#000000"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const color = e.target.value;
              if (colorPickerTarget && selectedElement) {
                updateElement(selectedElement, { [colorPickerTarget]: color });
              } else if (colorPickerTarget === 'canvasBg') {
                setCanvasBg(color);
              }
              setColorPickerAnchor(null);
            }
          }}
        />
      </Box>
    </Popover>
  );
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts when not typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'g':
            e.preventDefault();
            handleGroupElements();
            break;
          case 'u':
            e.preventDefault();
            handleUngroupElements();
            break;
          case 'd':
            e.preventDefault();
            handleDuplicateElements();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handleRedo();
            } else {
              handleUndo();
            }
            break;
        }
      }
      
      // Delete key
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElements.length > 0) {
          selectedElements.forEach(id => deleteElement(id));
          setSelectedElements([]);
        } else if (selectedElement) {
          deleteElement(selectedElement);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, selectedElements]);
  
  const selectedEl = getSelectedElement();
  return (
    <Box 
      sx={{ display: 'flex', height: 'calc(100vh - 80px)', bgcolor: '#2c2c2c' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Left Sidebar - Tools & Elements */}
      <Paper sx={{ width: 280, height: '100%', borderRadius: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Tabs value={leftTab} onChange={(e, v) => setLeftTab(v)} variant="fullWidth">
          <Tab icon={<TemplatesIcon />} label="Templates" sx={{ minWidth: 0 }} />
          <Tab icon={<ShapesIcon />} label="Elements" sx={{ minWidth: 0 }} />
          <Tab icon={<ImageIcon />} label="Images" sx={{ minWidth: 0 }} />
        </Tabs>
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Templates Tab */}
          {leftTab === 0 && (
            <>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                {TEMPLATE_CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    size="small"
                    variant={templateCategory === cat ? 'contained' : 'outlined'}
                    onClick={() => setTemplateCategory(cat)}
                    sx={{ fontSize: '0.65rem', py: 0.25, px: 1, minWidth: 'auto' }}
                  >
                    {cat}
                  </Button>
                ))}
              </Box>
              <Grid container spacing={1}>
                {filteredTemplates.map(template => (
                  <Grid item xs={6} key={template.id}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer', 
                        '&:hover': { boxShadow: 4 }, 
                        '&:hover .template-actions': { opacity: 1 },
                        border: '1px solid #e0e0e0',
                        position: 'relative'
                      }}
                      onClick={() => applyTemplate(template)}
                    >
                      <Box 
                        sx={{ 
                          height: 60, 
                          background: template.bg,
                          border: `2px solid ${template.borderColor || '#ccc'}`,
                          borderRadius: 1,
                          m: 0.5
                        }} 
                      />
                      <Typography variant="caption" sx={{ p: 0.5, display: 'block', textAlign: 'center', fontSize: '0.65rem' }}>
                        {template.name}
                      </Typography>
                      {/* Edit/Delete buttons for saved designs */}
                      {template.isSaved && (
                        <Box className="template-actions" sx={{ position: 'absolute', top: 2, right: 2, opacity: 0, transition: 'opacity 0.2s', display: 'flex', gap: 0.25 }}>
                          <IconButton size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.9)', p: 0.25 }}
                            onClick={(e) => { e.stopPropagation(); handleEditDesign(template.savedData); }}>
                            <EditIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                          <IconButton size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.9)', p: 0.25 }}
                            onClick={(e) => { e.stopPropagation(); handleDeleteDesign(template.savedData.id); }}>
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      )}
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
          {/* Elements Tab */}
          {leftTab === 1 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Text</Typography>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={<TextIcon />}
                onClick={() => addElement(ELEMENT_TYPES.TEXT)}
                sx={{ mb: 2 }}
              >
                Add Text
              </Button>
              <Typography variant="subtitle2" gutterBottom>Shapes</Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.RECTANGLE)}>
                    <RectangleIcon />
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.CIRCLE)}>
                    <CircleIcon />
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.TRIANGLE)}>
                    <TriangleIcon />
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.STAR)}>
                    <StarIcon />
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.LINE)}>
                    <LineIcon />
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.ARROW)}>
                    <ArrowIcon />
                  </Button>
                </Grid>
              </Grid>
            </>
          )}
          {/* Images Tab */}
          {leftTab === 2 && (
            <>
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<UploadIcon />}
                onClick={() => fileInputRef.current.click()}
                sx={{ mb: 2 }}
              >
                Upload Image
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                accept="image/*"
                onChange={handleImageUpload}
              />
              
              <Divider sx={{ my: 2 }} />
              
              {/* Image Bank Section */}
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#1976d2' }}>
                📚 MySchool Image Bank
              </Typography>
              
              {/* Search Field */}
              <TextField
                size="small"
                fullWidth
                placeholder="Search images..."
                value={imageBankSearch}
                onChange={(e) => setImageBankSearch(e.target.value)}
                sx={{ mb: 1 }}
              />
              
              {/* Category Selector */}
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={imageBankCategory}
                  label="Category"
                  onChange={(e) => setImageBankCategory(e.target.value)}
                >
                  {IMAGE_BANK_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* Image Bank Images Grid */}
              <Box sx={{ maxHeight: 350, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                {imageBankLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : imageBankImages.length > 0 ? (
                  <Grid container spacing={1}>
                    {(imageBankSearch 
                      ? imageBankImages.filter(img => img.toLowerCase().includes(imageBankSearch.toLowerCase()))
                      : imageBankImages
                    ).map((img, i) => (
                      <Grid item xs={6} key={i}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer', 
                            '&:hover': { boxShadow: 4, transform: 'scale(1.02)' },
                            transition: 'all 0.2s'
                          }}
                          onClick={() => addElement(ELEMENT_TYPES.IMAGE, { src: img })}
                        >
                          <CardMedia 
                            component="img" 
                            height="70" 
                            image={img} 
                            alt={`Bank ${i}`}
                            sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }}
                          />
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
                    No images found. Select a category.
                  </Typography>
                )}
              </Box>
              
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Click on any image to add it to your design
              </Typography>
            </>
          )}
        </Box>
      </Paper>
      {/* Main Canvas Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Toolbar */}
        <Paper sx={{ p: 1, borderRadius: 0, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title="Undo"><span><IconButton onClick={handleUndo} disabled={historyIndex <= 0}><UndoIcon /></IconButton></span></Tooltip>
          <Tooltip title="Redo"><span><IconButton onClick={handleRedo} disabled={historyIndex >= history.length - 1}><RedoIcon /></IconButton></span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Tooltip title="Clear Canvas"><IconButton onClick={clearCanvas} color="error"><ClearIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Tooltip title="Zoom Out"><IconButton onClick={() => setZoom(Math.max(25, zoom - 25))}><ZoomOutIcon /></IconButton></Tooltip>
          <Typography sx={{ minWidth: 50, textAlign: 'center' }}>{zoom}%</Typography>
          <Tooltip title="Zoom In"><IconButton onClick={() => setZoom(Math.min(200, zoom + 25))}><ZoomInIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Tooltip title="Toggle Grid">
            <IconButton onClick={() => setShowGrid(!showGrid)} color={showGrid ? 'primary' : 'default'}>
              <GridIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Canvas Background">
            <IconButton onClick={(e) => { setColorPickerAnchor(e.currentTarget); setColorPickerTarget('canvasBg'); }}>
              <Box sx={{ width: 20, height: 20, bgcolor: canvasBg, border: '2px solid #ccc', borderRadius: 1 }} />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
          <Tooltip title="Center All Elements">
            <IconButton onClick={handleCenterElements} color="primary">
              <CenterIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Fit Canvas to Content">
            <IconButton onClick={handleFitCanvasToContent} color="primary">
              <FitScreenIcon />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={
            <Box>
              <Typography variant="subtitle2">Keyboard Shortcuts:</Typography>
              <Typography variant="body2">Shift+Click: Multi-select</Typography>
              <Typography variant="body2">Ctrl+G: Group elements</Typography>
              <Typography variant="body2">Ctrl+U: Ungroup elements</Typography>
              <Typography variant="body2">Ctrl+D: Duplicate</Typography>
              <Typography variant="body2">Delete: Remove selected</Typography>
            </Box>
          }>
            <IconButton>
              <SearchIcon />
            </IconButton>
          </Tooltip>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ color: '#1976d2', '&:hover': { color: '#1565c0', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>
            Print
          </Button>
          <Button variant="outlined" startIcon={<SaveIcon />} onClick={() => { setEditingDesign(null); setDesignName(''); setSaveDialog(true); }} sx={{ color: '#1976d2', '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>
            Save
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            onClick={() => setExportDialog(true)}
            sx={{ 
              color: '#1976d2',
              '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' }
            }}
          >
            Export
          </Button>
        </Paper>
        {/* Canvas Container */}
        <Box 
          sx={{ 
            flex: 1, 
            overflow: 'auto', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: '#1a1a1a',
            p: 4
          }}
          onClick={handleCanvasClick}
        >
          <Box
            ref={canvasRef}
            className="canvas-area"
            sx={{
              width: canvasSize.width,
              height: canvasSize.height,
              backgroundColor: canvasBg,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'center center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              position: 'relative',
              backgroundImage: showGrid ? 'linear-gradient(#ddd 1px, transparent 1px), linear-gradient(90deg, #ddd 1px, transparent 1px)' : 'none',
              backgroundSize: '20px 20px'
            }}
          >
            {elements.map(renderElement)}
          </Box>
        </Box>
      </Box>
      {/* Right Sidebar - Properties */}
      <Paper sx={{ width: 280, height: '100%', borderRadius: 0, overflowY: 'auto', overflowX: 'hidden', p: 2, maxHeight: 'calc(100vh - 140px)' }}>
        {selectedEl ? (
          <>
            <Typography variant="h6" gutterBottom>Properties</Typography>
            {/* Position & Size */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Position & Size</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="X"
                  type="number"
                  value={Math.round(selectedEl.x)}
                  onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Y"
                  type="number"
                  value={Math.round(selectedEl.y)}
                  onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Width"
                  type="number"
                  value={Math.round(selectedEl.width)}
                  onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) || 20 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Height"
                  type="number"
                  value={Math.round(selectedEl.height)}
                  onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) || 20 })}
                  fullWidth
                />
              </Grid>
            </Grid>
            {/* Rotation & Opacity */}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Rotation</Typography>
            <Slider
              value={selectedEl.rotation}
              onChange={(e, v) => updateElement(selectedEl.id, { rotation: v })}
              min={0}
              max={360}
              valueLabelDisplay="auto"
            />
            <Typography variant="subtitle2" gutterBottom>Opacity</Typography>
            <Slider
              value={selectedEl.opacity}
              onChange={(e, v) => updateElement(selectedEl.id, { opacity: v })}
              min={0}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
            />
            {/* Text Properties */}
            {selectedEl.type === ELEMENT_TYPES.TEXT && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Text Style</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                  <InputLabel>Font</InputLabel>
                  <Select
                    value={selectedEl.fontFamily}
                    label="Font"
                    onChange={(e) => updateElement(selectedEl.id, { fontFamily: e.target.value })}
                  >
                    {FONTS.map(font => (
                      <MenuItem key={font} value={font} style={{ fontFamily: font }}>{font}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  size="small"
                  label="Font Size"
                  type="number"
                  value={selectedEl.fontSize}
                  onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) || 12 })}
                  fullWidth
                  sx={{ mb: 1 }}
                />
                <ToggleButtonGroup size="small" sx={{ mb: 1 }}>
                  <ToggleButton 
                    value="bold" 
                    selected={selectedEl.fontWeight === 'bold'}
                    onClick={() => updateElement(selectedEl.id, { fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })}
                  >
                    <BoldIcon />
                  </ToggleButton>
                  <ToggleButton 
                    value="italic"
                    selected={selectedEl.fontStyle === 'italic'}
                    onClick={() => updateElement(selectedEl.id, { fontStyle: selectedEl.fontStyle === 'italic' ? 'normal' : 'italic' })}
                  >
                    <ItalicIcon />
                  </ToggleButton>
                  <ToggleButton 
                    value="underline"
                    selected={selectedEl.textDecoration === 'underline'}
                    onClick={() => updateElement(selectedEl.id, { textDecoration: selectedEl.textDecoration === 'underline' ? 'none' : 'underline' })}
                  >
                    <UnderlineIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
                <ToggleButtonGroup size="small" sx={{ mb: 1, ml: 1 }}>
                  <ToggleButton 
                    value="left"
                    selected={selectedEl.textAlign === 'left'}
                    onClick={() => updateElement(selectedEl.id, { textAlign: 'left' })}
                  >
                    <AlignLeftIcon />
                  </ToggleButton>
                  <ToggleButton 
                    value="center"
                    selected={selectedEl.textAlign === 'center'}
                    onClick={() => updateElement(selectedEl.id, { textAlign: 'center' })}
                  >
                    <AlignCenterIcon />
                  </ToggleButton>
                  <ToggleButton 
                    value="right"
                    selected={selectedEl.textAlign === 'right'}
                    onClick={() => updateElement(selectedEl.id, { textAlign: 'right' })}
                  >
                    <AlignRightIcon />
                  </ToggleButton>
                </ToggleButtonGroup>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Box sx={{ width: 16, height: 16, bgcolor: selectedEl.color, border: '1px solid #ccc' }} />}
                    onClick={(e) => { setColorPickerAnchor(e.currentTarget); setColorPickerTarget('color'); }}
                  >
                    Text Color
                  </Button>
                </Box>
              </>
            )}
            {/* Shape Properties */}
            {[ELEMENT_TYPES.RECTANGLE, ELEMENT_TYPES.CIRCLE, ELEMENT_TYPES.TRIANGLE, ELEMENT_TYPES.STAR].includes(selectedEl.type) && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Colors</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Box sx={{ width: 16, height: 16, bgcolor: selectedEl.fill, border: '1px solid #ccc' }} />}
                    onClick={(e) => { setColorPickerAnchor(e.currentTarget); setColorPickerTarget('fill'); }}
                  >
                    Fill
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Box sx={{ width: 16, height: 16, bgcolor: selectedEl.stroke, border: '1px solid #ccc' }} />}
                    onClick={(e) => { setColorPickerAnchor(e.currentTarget); setColorPickerTarget('stroke'); }}
                  >
                    Stroke
                  </Button>
                </Box>
                <Typography variant="subtitle2" gutterBottom>Stroke Width</Typography>
                <Slider
                  value={selectedEl.strokeWidth}
                  onChange={(e, v) => updateElement(selectedEl.id, { strokeWidth: v })}
                  min={0}
                  max={20}
                  valueLabelDisplay="auto"
                />
                {selectedEl.type === ELEMENT_TYPES.RECTANGLE && (
                  <>
                    <Typography variant="subtitle2" gutterBottom>Border Radius</Typography>
                    <Slider
                      value={selectedEl.borderRadius}
                      onChange={(e, v) => updateElement(selectedEl.id, { borderRadius: v })}
                      min={0}
                      max={50}
                      valueLabelDisplay="auto"
                    />
                  </>
                )}
              </>
            )}
            {/* Line and Arrow Properties - Color Change */}
            {[ELEMENT_TYPES.LINE, ELEMENT_TYPES.ARROW].includes(selectedEl.type) && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Line Color</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Box sx={{ width: 16, height: 16, bgcolor: selectedEl.stroke, border: '1px solid #ccc' }} />}
                    onClick={(e) => { setColorPickerAnchor(e.currentTarget); setColorPickerTarget('stroke'); }}
                  >
                    Color
                  </Button>
                </Box>
                <Typography variant="subtitle2" gutterBottom>Stroke Width</Typography>
                <Slider
                  value={selectedEl.strokeWidth}
                  onChange={(e, v) => updateElement(selectedEl.id, { strokeWidth: v })}
                  min={1}
                  max={20}
                  valueLabelDisplay="auto"
                />
              </>
            )}
            {/* Text Color for Text Elements */}
            {selectedEl.type === ELEMENT_TYPES.TEXT && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Background Color</Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<Box sx={{ width: 16, height: 16, bgcolor: selectedEl.backgroundColor || 'transparent', border: '1px solid #ccc' }} />}
                    onClick={(e) => { setColorPickerAnchor(e.currentTarget); setColorPickerTarget('backgroundColor'); }}
                  >
                    Background
                  </Button>
                </Box>
              </>
            )}
            <Divider sx={{ my: 2 }} />
            {/* Actions */}
            <Typography variant="subtitle2" gutterBottom>Actions</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Button fullWidth size="small" variant="outlined" startIcon={<DuplicateIcon />} onClick={() => duplicateElement(selectedEl.id)}>
                  Duplicate
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => deleteElement(selectedEl.id)}>
                  Delete
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth size="small" variant="outlined" startIcon={<BringFrontIcon />} onClick={() => bringToFront(selectedEl.id)}>
                  To Front
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button fullWidth size="small" variant="outlined" startIcon={<SendBackIcon />} onClick={() => sendToBack(selectedEl.id)}>
                  To Back
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button 
                  fullWidth 
                  size="small" 
                  variant="outlined"
                  startIcon={selectedEl.locked ? <LockIcon /> : <UnlockIcon />}
                  onClick={() => updateElement(selectedEl.id, { locked: !selectedEl.locked })}
                >
                  {selectedEl.locked ? 'Unlock' : 'Lock'}
                </Button>
              </Grid>
              {selectedEl.groupId && (
                <Grid item xs={12}>
                  <Button 
                    fullWidth 
                    size="small" 
                    variant="outlined"
                    onClick={handleUngroupElements}
                  >
                    Ungroup
                  </Button>
                </Grid>
              )}
            </Grid>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>Canvas Settings</Typography>
            
            {/* Multi-Selection Actions */}
            {selectedElements.length > 0 && (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
                  Multi-Selection ({selectedElements.length} items)
                </Typography>
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Button 
                      fullWidth 
                      size="small" 
                      variant="contained" 
                      onClick={handleGroupElements}
                      disabled={selectedElements.length < 2}
                    >
                      Group
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button 
                      fullWidth 
                      size="small" 
                      variant="outlined" 
                      startIcon={<DuplicateIcon />}
                      onClick={handleDuplicateElements}
                    >
                      Duplicate
                    </Button>
                  </Grid>
                </Grid>
                <Divider sx={{ my: 2 }} />
              </>
            )}
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Size</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Width"
                  type="number"
                  value={canvasSize.width}
                  onChange={(e) => setCanvasSize({ ...canvasSize, width: parseInt(e.target.value) || 100 })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  size="small"
                  label="Height"
                  type="number"
                  value={canvasSize.height}
                  onChange={(e) => setCanvasSize({ ...canvasSize, height: parseInt(e.target.value) || 100 })}
                  fullWidth
                />
              </Grid>
            </Grid>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
              Select an element to edit its properties
            </Typography>
          </>
        )}
      </Paper>
      {/* Color Picker Popover */}
      {renderColorPicker()}
      {/* Export Dialog */}
      <Dialog open={exportDialog} onClose={() => setExportDialog(false)}>
        <DialogTitle>Export Design</DialogTitle>
        <DialogContent>
          <List>
            <ListItemButton onClick={() => exportCanvas('png')}>
              <ListItemIcon><ImageIcon /></ListItemIcon>
              <ListItemText primary="PNG" secondary="High quality image with transparency" />
            </ListItemButton>
            <ListItemButton onClick={() => exportCanvas('jpg')}>
              <ListItemIcon><ImageIcon /></ListItemIcon>
              <ListItemText primary="JPEG" secondary="Compressed image format" />
            </ListItemButton>
            <ListItemButton onClick={() => exportCanvas('pdf')}>
              <ListItemIcon><DownloadIcon /></ListItemIcon>
              <ListItemText primary="PDF" secondary="Print-ready document" />
            </ListItemButton>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      {/* Save Dialog */}
      <Dialog open={saveDialog} onClose={() => { setSaveDialog(false); setEditingDesign(null); }}>
        <DialogTitle>{editingDesign ? 'Edit Design' : 'Save Design'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Design Name"
            fullWidth
            value={designName}
            onChange={(e) => setDesignName(e.target.value)}
            placeholder="e.g., My Certificate Design"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setSaveDialog(false); setEditingDesign(null); }}>Cancel</Button>
          <Button onClick={handleSaveDesign} variant="outlined" sx={{ color: '#1976d2', '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default CanvaEditor;
