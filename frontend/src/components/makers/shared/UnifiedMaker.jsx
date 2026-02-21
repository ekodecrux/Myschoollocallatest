import React, { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, IconButton, Grid, Card, CardMedia,
  TextField, Tooltip, Snackbar, Alert, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Slider, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, ToggleButton,
  ToggleButtonGroup, Popover, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
  Undo as UndoIcon, Redo as RedoIcon, Save as SaveIcon, Download as DownloadIcon,
  Delete as DeleteIcon, Add as AddIcon, TextFields as TextIcon, Image as ImageIcon,
  Rectangle as RectangleIcon, Circle as CircleIcon, ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon, FormatBold as BoldIcon, FormatItalic as ItalicIcon,
  FormatAlignLeft as AlignLeftIcon, FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon, ContentCopy as CopyIcon, Palette as PaletteIcon,
  RotateRight as RotateIcon, FlipToFront as BringFrontIcon, FlipToBack as SendBackIcon,
  GridOn as GridIcon, Lock as LockIcon, LockOpen as UnlockIcon, Star as StarIcon,
  ChangeHistory as TriangleIcon, Clear as ClearIcon, Search as SearchIcon,
  Print as PrintIcon, FolderOpen as LoadIcon, Upload as UploadIcon,
  Straighten as LineIcon, ArrowForward as ArrowIcon, NoteAdd as NewIcon
} from '@mui/icons-material';
import html2canvas from 'html2canvas';

// Import extracted constants and utilities
import { 
  ELEMENT_TYPES, 
  PAGE_SIZES, 
  COLOR_PRESETS, 
  FONTS, 
  IMAGE_BANK_CATEGORIES 
} from './utils/constants';
import { imageUrlToBase64, generateId } from './utils/helpers';

const UnifiedMaker = forwardRef(({ 
  makerType = 'chart', // 'chart', 'story', 'worksheet'
  templates = [],
  onSave,
  onLoad 
}, ref) => {
  // Auth State from Redux
  const { isLoggedin, accessToken } = useSelector((state) => state.login);
  const navigate = useNavigate();
  
  // Canvas State
  const [pageSize, setPageSize] = useState('A4');
  const [customSize, setCustomSize] = useState({ width: 800, height: 600 });
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [zoom, setZoom] = useState(80);
  const [showGrid, setShowGrid] = useState(false);
  
  // Elements State
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Drag State
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElementStart, setDragElementStart] = useState({ x: 0, y: 0 });
  const wasDraggingRef = useRef(false);  // Track if we just finished dragging
  
  // Resize State
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0, elementX: 0, elementY: 0 });
  
  // UI State
  const [leftTab, setLeftTab] = useState(0);
  const [colorPickerAnchor, setColorPickerAnchor] = useState(null);
  const [colorPickerTarget, setColorPickerTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // Save/Load State
  const [saveDialog, setSaveDialog] = useState(false);
  const [loadDialog, setLoadDialog] = useState(false);
  const [designName, setDesignName] = useState('');
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  
  // Image Bank State
  const [imageBankImages, setImageBankImages] = useState([]);
  const [imageBankCategory, setImageBankCategory] = useState('ANIMALS');
  const [imageBankLoading, setImageBankLoading] = useState(false);
  const [imageBankSearch, setImageBankSearch] = useState('');
  
  // Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputRefImages = useRef(null);  // Separate ref for Images tab
  
  // Get canvas dimensions
  const getCanvasSize = () => {
    if (pageSize === 'Custom') {
      return customSize;
    }
    return PAGE_SIZES[pageSize] || PAGE_SIZES['A4'];
  };
  
  // Fetch templates from backend API
  const fetchTemplates = useCallback(async () => {
    if (!isLoggedin || !accessToken) return;
    
    setTemplatesLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/rest/templates/list?makerType=${makerType}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSavedDesigns(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
    setTemplatesLoading(false);
  }, [isLoggedin, accessToken, makerType]);
  
  // Load templates on mount and when auth changes
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);
  
  // Fetch Image Bank images
  const fetchImageBankImages = useCallback(async (searchTerm = '') => {
    if (!searchTerm || searchTerm.length < 2) {
      setImageBankImages([]);
      return;
    }
    setImageBankLoading(true);
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      // Use global search API to search across all images
      const response = await fetch(`${backendUrl}/api/rest/search/global?query=${encodeURIComponent(searchTerm)}&size=50`);
      if (response.ok) {
        const data = await response.json();
        // Get all image results
        let images = (data.results || [])
          .map(item => item.path)
          .filter(url => url && (
            url.toLowerCase().endsWith('.jpg') || 
            url.toLowerCase().endsWith('.png') || 
            url.toLowerCase().endsWith('.jpeg') || 
            url.toLowerCase().endsWith('.gif')
          ));
        setImageBankImages(images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
    setImageBankLoading(false);
  }, []);
  
  // Load Image Bank when search term changes (with debounce)
  useEffect(() => {
    if (leftTab === 2) {
      const debounceTimer = setTimeout(() => {
        fetchImageBankImages(imageBankSearch);
      }, 500);  // 500ms debounce
      return () => clearTimeout(debounceTimer);
    }
  }, [imageBankSearch, leftTab, fetchImageBankImages]);

  // Keyboard event handling for moving selected elements
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedElement || selectedElement.locked) return;
      
      // Don't interfere with text input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      const MOVE_STEP = e.shiftKey ? 10 : 1; // Hold Shift for faster movement
      let newX = selectedElement.x;
      let newY = selectedElement.y;
      let moved = false;
      
      switch (e.key) {
        case 'ArrowUp':
          newY = selectedElement.y - MOVE_STEP;
          moved = true;
          e.preventDefault();
          break;
        case 'ArrowDown':
          newY = selectedElement.y + MOVE_STEP;
          moved = true;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          newX = selectedElement.x - MOVE_STEP;
          moved = true;
          e.preventDefault();
          break;
        case 'ArrowRight':
          newX = selectedElement.x + MOVE_STEP;
          moved = true;
          e.preventDefault();
          break;
        case 'Delete':
        case 'Backspace':
          if (!e.target.tagName.match(/INPUT|TEXTAREA/)) {
            deleteElement(selectedElement.id);
            e.preventDefault();
          }
          break;
        case 'Escape':
          setSelectedElement(null);
          e.preventDefault();
          break;
        default:
          break;
      }
      
      if (moved) {
        updateElement(selectedElement.id, { x: newX, y: newY });
        // Save to history after movement stops (debounced would be better, but this works)
      }
    };
    
    // Add event listener to window
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElement, elements]);

  // History Management (must be defined before drag handlers that use it)
  const saveToHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newElements));
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  // Mouse drag handlers for moving elements
  const handleMouseDown = (e, element) => {
    e.stopPropagation();
    // Always allow selection, even for locked elements
    setSelectedElement(element);
    // Prevent dragging if locked
    if (element.locked) return;
    // Don't start dragging if we're already resizing
    if (isResizing) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragElementStart({ x: element.x, y: element.y });
  };

  const handleMouseMove = useCallback((e) => {
    // Skip if resizing - let resize handler take over
    if (isResizing) return;
    if (!isDragging || !selectedElement) return;
    
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    // Apply zoom factor to get accurate movement
    const zoomFactor = zoom / 100;
    const newX = dragElementStart.x + (dx / zoomFactor);
    const newY = dragElementStart.y + (dy / zoomFactor);
    
    updateElement(selectedElement.id, { x: newX, y: newY });
  }, [isDragging, isResizing, selectedElement, dragStart, dragElementStart, zoom]);

  const handleMouseUp = useCallback(() => {
    if (isDragging && selectedElement) {
      // Save to history when drag ends
      saveToHistory(elements);
      // Mark that we were just dragging to prevent deselection on click
      wasDraggingRef.current = true;
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 100);
    }
    setIsDragging(false);
  }, [isDragging, selectedElement, elements, saveToHistory]);

  // Add global mouse move and up listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Resize handlers
  const handleResizeStart = (e, handle, element) => {
    e.stopPropagation();
    e.preventDefault();
    // Stop any dragging that might be in progress
    setIsDragging(false);
    setIsResizing(true);
    setResizeHandle(handle);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: element.width,
      height: element.height,
      elementX: element.x,
      elementY: element.y
    });
  };

  const handleResizeMove = useCallback((e) => {
    if (!isResizing || !selectedElement || !resizeHandle) return;
    
    const zoomFactor = zoom / 100;
    const dx = (e.clientX - resizeStart.x) / zoomFactor;
    const dy = (e.clientY - resizeStart.y) / zoomFactor;
    
    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = resizeStart.elementX;
    let newY = resizeStart.elementY;
    
    // Handle different resize directions
    if (resizeHandle.includes('e')) {
      newWidth = Math.max(20, resizeStart.width + dx);
    }
    if (resizeHandle.includes('w')) {
      newWidth = Math.max(20, resizeStart.width - dx);
      newX = resizeStart.elementX + dx;
    }
    if (resizeHandle.includes('s')) {
      newHeight = Math.max(20, resizeStart.height + dy);
    }
    if (resizeHandle.includes('n')) {
      newHeight = Math.max(20, resizeStart.height - dy);
      newY = resizeStart.elementY + dy;
    }
    
    updateElement(selectedElement.id, { width: newWidth, height: newHeight, x: newX, y: newY });
  }, [isResizing, selectedElement, resizeHandle, resizeStart, zoom]);

  const handleResizeEnd = useCallback(() => {
    if (isResizing && selectedElement) {
      saveToHistory(elements);
      wasDraggingRef.current = true;
      setTimeout(() => {
        wasDraggingRef.current = false;
      }, 100);
    }
    setIsResizing(false);
    setResizeHandle(null);
  }, [isResizing, selectedElement, elements, saveToHistory]);

  // Add global mouse listeners for resizing
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeEnd);
      return () => {
        window.removeEventListener('mousemove', handleResizeMove);
        window.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Render resize handles for selected element
  const renderResizeHandles = (element) => {
    if (!selectedElement || selectedElement.id !== element.id || element.locked) return null;
    
    const handleStyle = {
      position: 'absolute',
      width: 14,
      height: 14,
      backgroundColor: '#1976d2',
      border: '2px solid white',
      borderRadius: 2,
      zIndex: 9999,
      boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
      pointerEvents: 'auto',  // Ensure handles capture events
    };
    
    const handles = [
      { key: 'nw', style: { top: -7, left: -7, cursor: 'nw-resize' } },
      { key: 'ne', style: { top: -7, right: -7, cursor: 'ne-resize' } },
      { key: 'sw', style: { bottom: -7, left: -7, cursor: 'sw-resize' } },
      { key: 'se', style: { bottom: -7, right: -7, cursor: 'se-resize' } },
      { key: 'n', style: { top: -7, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
      { key: 's', style: { bottom: -7, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
      { key: 'e', style: { right: -7, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' } },
      { key: 'w', style: { left: -7, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' } },
    ];
    
    return handles.map(h => (
      <Box
        key={h.key}
        sx={{ ...handleStyle, ...h.style }}
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handleResizeStart(e, h.key, element);
        }}
      />
    ));
  };
  
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements(JSON.parse(history[historyIndex - 1]));
    }
  };
  
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements(JSON.parse(history[historyIndex + 1]));
    }
  };
  
  // Clear Canvas
  const handleClearCanvas = () => {
    setElements([]);
    setSelectedElement(null);
    setHistory([]);
    setHistoryIndex(-1);
    setSnackbar({ open: true, message: 'Canvas cleared!', severity: 'info' });
  };
  
  // New Design - Reset everything
  const handleNewDesign = () => {
    setElements([]);
    setSelectedElement(null);
    setHistory([]);
    setHistoryIndex(-1);
    setCanvasBg('#ffffff');
    setPageSize('A4');
    setDesignName('');
    setSnackbar({ open: true, message: 'New design created!', severity: 'success' });
  };
  
  // Add Element
  const addElement = async (type, props = {}) => {
    const canvasSize = getCanvasSize();
    const id = `${type}-${Date.now()}`;
    
    // If it's an image from external URL (R2), convert to base64 for reliable export
    let finalProps = { ...props };
    if (type === ELEMENT_TYPES.IMAGE && props.src && !props.src.startsWith('data:')) {
      try {
        setSnackbar({ open: true, message: 'Loading image...', severity: 'info' });
        const base64Src = await imageUrlToBase64(props.src);
        finalProps.src = base64Src;
        finalProps.originalSrc = props.src; // Keep original for reference
      } catch (error) {
        console.warn('Failed to convert image to base64:', error);
        // Continue with original URL
      }
    }
    
    const newElement = {
      id,
      type,
      x: canvasSize.width / 2 - 50,
      y: canvasSize.height / 2 - 25,
      width: type === 'text' ? 200 : 100,
      height: type === 'text' ? 50 : 100,
      rotation: 0,
      locked: false,
      ...getDefaultProps(type),
      ...finalProps
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement);
    saveToHistory(newElements);
  };
  
  // Get default props for element type
  const getDefaultProps = (type) => {
    switch (type) {
      case ELEMENT_TYPES.TEXT:
        return { text: 'Enter text here', fontSize: 24, fontFamily: 'Arial', color: '#000000', bold: false, italic: false, align: 'center' };
      case ELEMENT_TYPES.RECTANGLE:
        return { fill: '#2196f3', stroke: '#1976d2', strokeWidth: 2 };
      case ELEMENT_TYPES.CIRCLE:
        return { fill: '#4caf50', stroke: '#388e3c', strokeWidth: 2 };
      case ELEMENT_TYPES.TRIANGLE:
        return { fill: '#ff9800', stroke: '#f57c00', strokeWidth: 2 };
      case ELEMENT_TYPES.STAR:
        return { fill: '#ffeb3b', stroke: '#fbc02d', strokeWidth: 2, points: 5 };
      case ELEMENT_TYPES.LINE:
        return { stroke: '#000000', strokeWidth: 3, width: 150, height: 4 };
      case ELEMENT_TYPES.ARROW:
        return { stroke: '#000000', strokeWidth: 3, width: 150, height: 4 };
      case ELEMENT_TYPES.IMAGE:
        return { src: '', width: 150, height: 150 };
      default:
        return {};
    }
  };
  
  // Update Element
  const updateElement = (id, updates) => {
    const newElements = elements.map(el => el.id === id ? { ...el, ...updates } : el);
    setElements(newElements);
    if (selectedElement?.id === id) {
      setSelectedElement({ ...selectedElement, ...updates });
    }
  };
  
  // Delete Element
  const deleteElement = (id) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    setSelectedElement(null);
    saveToHistory(newElements);
  };
  
  // Duplicate Element
  const duplicateElement = (element) => {
    const newElement = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 20,
      y: element.y + 20
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    setSelectedElement(newElement);
    saveToHistory(newElements);
  };
  
  // Rotate Element
  const rotateElement = (id, degrees = 15) => {
    const element = elements.find(el => el.id === id);
    if (element && !element.locked) {
      updateElement(id, { rotation: (element.rotation || 0) + degrees });
      saveToHistory(elements.map(el => el.id === id ? { ...el, rotation: (el.rotation || 0) + degrees } : el));
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
  
  // Toggle Lock
  const toggleLock = (id) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      updateElement(id, { locked: !element.locked });
    }
  };
  
  // Handle Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        addElement(ELEMENT_TYPES.IMAGE, { src: event.target.result });
        setSnackbar({ open: true, message: 'Image uploaded successfully!', severity: 'success' });
      };
      reader.onerror = () => {
        setSnackbar({ open: true, message: 'Failed to load image', severity: 'error' });
      };
      reader.readAsDataURL(file);
    }
    // Reset input to allow selecting same file again
    e.target.value = '';
  };
  
  // Export Canvas
  const handleExport = async (format = 'png') => {
    if (!canvasRef.current) {
      setSnackbar({ open: true, message: 'Canvas not ready', severity: 'error' });
      return;
    }
    try {
      // First deselect to remove selection UI
      const wasSelected = selectedElement;
      setSelectedElement(null);
      
      // Wait for UI update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Pre-process images: convert external URLs to base64 for reliable export
      const imageElements = canvasRef.current.querySelectorAll('img');
      const originalSrcs = [];
      
      // Convert all images to base64 to avoid CORS issues
      await Promise.all(Array.from(imageElements).map(async (img, index) => {
        originalSrcs[index] = img.src;
        if (img.src && !img.src.startsWith('data:')) {
          try {
            // Create a canvas to convert image to base64
            const imgCanvas = document.createElement('canvas');
            const ctx = imgCanvas.getContext('2d');
            
            // Load image with CORS
            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              tempImg.onload = () => {
                imgCanvas.width = tempImg.naturalWidth || tempImg.width;
                imgCanvas.height = tempImg.naturalHeight || tempImg.height;
                ctx.drawImage(tempImg, 0, 0);
                try {
                  img.src = imgCanvas.toDataURL('image/png');
                } catch (e) {
                  console.warn('Could not convert image to base64:', e);
                }
                resolve();
              };
              tempImg.onerror = () => {
                console.warn('Failed to load image for conversion');
                resolve(); // Continue anyway
              };
              // Add cache buster to force CORS request
              tempImg.src = img.src + (img.src.includes('?') ? '&' : '?') + '_t=' + Date.now();
            });
          } catch (e) {
            console.warn('Image conversion error:', e);
          }
        }
      }));
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: canvasBg,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 30000,
        foreignObjectRendering: false,
        removeContainer: true,
        onclone: (clonedDoc, element) => {
          // Remove resize handles from clone
          const handles = clonedDoc.querySelectorAll('[style*="z-index: 9999"]');
          handles.forEach(h => h.remove());
          // Remove selection outlines
          const selected = clonedDoc.querySelectorAll('[style*="outline"]');
          selected.forEach(s => s.style.outline = 'none');
          // Ensure all images are visible
          const images = element.querySelectorAll('img');
          images.forEach(img => {
            img.crossOrigin = 'anonymous';
            img.style.visibility = 'visible';
          });
        }
      });
      
      // Restore original image sources
      imageElements.forEach((img, index) => {
        if (originalSrcs[index]) {
          img.src = originalSrcs[index];
        }
      });
      
      const link = document.createElement('a');
      link.download = `${makerType}-design-${Date.now()}.${format}`;
      
      if (format === 'jpg' || format === 'jpeg') {
        link.href = canvas.toDataURL('image/jpeg', 0.9);
      } else {
        link.href = canvas.toDataURL('image/png');
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Restore selection
      if (wasSelected) {
        setSelectedElement(wasSelected);
      }
      
      setSnackbar({ open: true, message: 'Design exported successfully!', severity: 'success' });
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({ open: true, message: `Export failed: ${error.message}. Try using smaller images or check image permissions.`, severity: 'error' });
    }
  };
  
  // Print Canvas
  const handlePrint = async () => {
    if (!canvasRef.current) return;
    try {
      // Deselect first
      setSelectedElement(null);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Pre-process images: convert external URLs to base64 for reliable print
      const imageElements = canvasRef.current.querySelectorAll('img');
      const originalSrcs = [];
      
      // Convert all images to base64 to avoid CORS issues
      await Promise.all(Array.from(imageElements).map(async (img, index) => {
        originalSrcs[index] = img.src;
        if (img.src && !img.src.startsWith('data:')) {
          try {
            const imgCanvas = document.createElement('canvas');
            const ctx = imgCanvas.getContext('2d');
            const tempImg = new Image();
            tempImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
              tempImg.onload = () => {
                imgCanvas.width = tempImg.naturalWidth || tempImg.width;
                imgCanvas.height = tempImg.naturalHeight || tempImg.height;
                ctx.drawImage(tempImg, 0, 0);
                try {
                  img.src = imgCanvas.toDataURL('image/png');
                } catch (e) {
                  console.warn('Could not convert image to base64:', e);
                }
                resolve();
              };
              tempImg.onerror = () => resolve();
              tempImg.src = img.src + (img.src.includes('?') ? '&' : '?') + '_t=' + Date.now();
            });
          } catch (e) {
            console.warn('Image conversion error:', e);
          }
        }
      }));
      
      const canvas = await html2canvas(canvasRef.current, { 
        scale: 2, 
        backgroundColor: canvasBg,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 30000,
        onclone: (clonedDoc, element) => {
          const handles = clonedDoc.querySelectorAll('[style*="z-index: 9999"]');
          handles.forEach(h => h.remove());
          const selected = clonedDoc.querySelectorAll('[style*="outline"]');
          selected.forEach(s => s.style.outline = 'none');
        }
      });
      
      // Restore original image sources
      imageElements.forEach((img, index) => {
        if (originalSrcs[index]) {
          img.src = originalSrcs[index];
        }
      });
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html><head><title>Print Design</title>
          <style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;}
          img{max-width:100%;height:auto;}@media print{body{margin:0;}}</style>
          </head><body><img src="${canvas.toDataURL()}" /></body></html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 250);
      }
    } catch (error) {
      console.error('Print error:', error);
      setSnackbar({ open: true, message: 'Print failed. Try exporting as image first.', severity: 'error' });
    }
  };
  
  // Save Design to Backend
  const handleSave = async () => {
    if (!isLoggedin || !accessToken) {
      setSnackbar({ open: true, message: 'Please login to save designs', severity: 'warning' });
      return;
    }
    if (!designName.trim()) {
      setSnackbar({ open: true, message: 'Please enter a design name', severity: 'warning' });
      return;
    }
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/rest/templates/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: designName,
          makerType,
          pageSize,
          customSize,
          canvasBg,
          elements
        })
      });
      
      if (response.ok) {
        await fetchTemplates(); // Refresh templates list
        setSaveDialog(false);
        setDesignName('');
        setSnackbar({ open: true, message: 'Design saved!', severity: 'success' });
      } else {
        throw new Error('Failed to save design');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSnackbar({ open: true, message: 'Failed to save design', severity: 'error' });
    }
  };
  
  // Load Design
  const handleLoad = (design) => {
    setPageSize(design.pageSize || 'A4');
    setCustomSize(design.customSize || { width: 800, height: 600 });
    setCanvasBg(design.canvasBg || '#ffffff');
    setElements(design.elements || []);
    setSelectedElement(null);
    setLoadDialog(false);
    setSnackbar({ open: true, message: `Loaded: ${design.name}`, severity: 'success' });
  };
  
  // Delete Saved Design from Backend
  const handleDeleteSaved = async (id) => {
    // Cannot delete seed/system templates
    if (id.toString().startsWith('seed-')) {
      setSnackbar({ open: true, message: 'Cannot delete system templates', severity: 'warning' });
      return;
    }
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/rest/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (response.ok) {
        await fetchTemplates(); // Refresh templates list
        setSnackbar({ open: true, message: 'Design deleted', severity: 'success' });
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    export: handleExport,
    print: handlePrint,
    clear: handleClearCanvas,
    save: () => setSaveDialog(true),
    load: () => setLoadDialog(true)
  }));
  
  // Render Element on Canvas
  const renderElement = (element) => {
    const commonStyle = {
      position: 'absolute',
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      transform: `rotate(${element.rotation || 0}deg)`,
      cursor: element.locked ? 'not-allowed' : (isDragging && selectedElement?.id === element.id ? 'grabbing' : 'grab'),
      border: selectedElement?.id === element.id ? '2px dashed #1976d2' : 'none',
      boxSizing: 'border-box',
      userSelect: 'none'
    };
    
    // Wrapper with resize handles
    const wrapWithResizeHandles = (content) => (
      <Box key={element.id} sx={{ ...commonStyle }}>
        {content}
        {renderResizeHandles(element)}
      </Box>
    );
    
    switch (element.type) {
      case ELEMENT_TYPES.TEXT:
        return wrapWithResizeHandles(
          <Box
            sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: element.align || 'center' }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          >
            <Typography
              sx={{
                fontSize: element.fontSize,
                fontFamily: element.fontFamily,
                color: element.color,
                fontWeight: element.bold ? 'bold' : 'normal',
                fontStyle: element.italic ? 'italic' : 'normal',
                textAlign: element.align,
                width: '100%',
                pointerEvents: 'none'
              }}
            >
              {element.text}
            </Typography>
          </Box>
        );
        
      case ELEMENT_TYPES.IMAGE:
        return wrapWithResizeHandles(
          <Box
            sx={{ width: '100%', height: '100%' }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          >
            <img
              src={element.src}
              alt=""
              crossOrigin="anonymous"
              style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
              draggable={false}
            />
          </Box>
        );
        
      case ELEMENT_TYPES.RECTANGLE:
        return wrapWithResizeHandles(
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: element.fill,
              border: `${element.strokeWidth}px solid ${element.stroke}`,
              borderRadius: '4px'
            }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          />
        );
        
      case ELEMENT_TYPES.CIRCLE:
        return wrapWithResizeHandles(
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: element.fill,
              border: `${element.strokeWidth}px solid ${element.stroke}`,
              borderRadius: '50%'
            }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          />
        );
        
      case ELEMENT_TYPES.TRIANGLE:
        return wrapWithResizeHandles(
          <Box
            sx={{ width: '100%', height: '100%', background: 'transparent' }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          >
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ pointerEvents: 'none' }}>
              <polygon
                points="50,10 90,90 10,90"
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
              />
            </svg>
          </Box>
        );
        
      case ELEMENT_TYPES.STAR:
        return wrapWithResizeHandles(
          <Box
            sx={{ width: '100%', height: '100%', background: 'transparent' }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          >
            <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ pointerEvents: 'none' }}>
              <polygon
                points="50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40"
                fill={element.fill}
                stroke={element.stroke}
                strokeWidth={element.strokeWidth}
              />
            </svg>
          </Box>
        );
        
      case ELEMENT_TYPES.LINE:
        return wrapWithResizeHandles(
          <Box
            sx={{ width: '100%', height: '100%', background: 'transparent' }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          >
            <svg width="100%" height="100%" style={{ pointerEvents: 'none' }}>
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke={element.stroke} strokeWidth={element.strokeWidth} />
            </svg>
          </Box>
        );
        
      case ELEMENT_TYPES.ARROW:
        return wrapWithResizeHandles(
          <Box
            sx={{ width: '100%', height: '100%', background: 'transparent' }}
            onMouseDown={(e) => handleMouseDown(e, element)} onClick={(e) => e.stopPropagation()}
          >
            <svg width="100%" height="100%" viewBox="0 0 100 20" style={{ pointerEvents: 'none' }}>
              <defs>
                <marker id={`arrowhead-${element.id}`} markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={element.stroke} />
                </marker>
              </defs>
              <line x1="0" y1="10" x2="85" y2="10" stroke={element.stroke} strokeWidth={element.strokeWidth} markerEnd={`url(#arrowhead-${element.id})`} />
            </svg>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  const canvasSize = getCanvasSize();
  const selectedEl = selectedElement;
  
  // Check if mobile
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, height: { xs: 'auto', md: 'calc(100vh - 120px)' }, minHeight: { xs: '100vh', md: 'auto' }, overflow: 'hidden', bgcolor: '#f0f2f5' }}>
      {/* Mobile Toggle Button */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, p: 1, bgcolor: 'primary.main', color: 'white', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1">Maker Tools</Typography>
        <Button variant="contained" size="small" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} sx={{ bgcolor: 'white', color: 'primary.main' }}>
          {mobileMenuOpen ? 'Hide Tools' : 'Show Tools'}
        </Button>
      </Box>
      
      {/* Left Panel - Tools */}
      <Paper sx={{ 
        width: { xs: '100%', md: 280 }, 
        display: { xs: mobileMenuOpen ? 'flex' : 'none', md: 'flex' }, 
        flexDirection: 'column', 
        borderRadius: 0, 
        zIndex: 10, 
        boxShadow: 2,
        maxHeight: { xs: '50vh', md: 'none' },
        overflow: 'auto'
      }}>
        <Tabs value={leftTab} onChange={(e, v) => setLeftTab(v)} variant="fullWidth" sx={{ '& .MuiTab-root': { minWidth: 'auto', fontSize: { xs: '0.7rem', md: '0.875rem' } } }}>
          <Tab label="Elements" />
          <Tab label="Templates" />
          <Tab label="Images" />
        </Tabs>
        
        <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
          {/* Elements Tab */}
          {leftTab === 0 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Add Shapes</Typography>
              <Grid container spacing={1} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.RECTANGLE)} sx={{ flexDirection: 'column', py: 1 }}>
                    <RectangleIcon />
                    <Typography variant="caption">Rect</Typography>
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.CIRCLE)} sx={{ flexDirection: 'column', py: 1 }}>
                    <CircleIcon />
                    <Typography variant="caption">Circle</Typography>
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.TRIANGLE)} sx={{ flexDirection: 'column', py: 1 }}>
                    <TriangleIcon />
                    <Typography variant="caption">Triangle</Typography>
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.STAR)} sx={{ flexDirection: 'column', py: 1 }}>
                    <StarIcon />
                    <Typography variant="caption">Star</Typography>
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.LINE)} sx={{ flexDirection: 'column', py: 1 }}>
                    <LineIcon />
                    <Typography variant="caption">Line</Typography>
                  </Button>
                </Grid>
                <Grid item xs={4}>
                  <Button fullWidth variant="outlined" onClick={() => addElement(ELEMENT_TYPES.ARROW)} sx={{ flexDirection: 'column', py: 1 }}>
                    <ArrowIcon />
                    <Typography variant="caption">Arrow</Typography>
                  </Button>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Add Content</Typography>
              <Button fullWidth variant="outlined" startIcon={<TextIcon />} onClick={() => addElement(ELEMENT_TYPES.TEXT)} sx={{ mb: 1 }}>
                Add Text
              </Button>
              <Button fullWidth variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
                Upload Image
              </Button>
              <input 
                ref={fileInputRef} 
                type="file" 
                style={{ display: 'none' }}
                accept="image/*,.png,.jpg,.jpeg,.gif,.webp" 
                onChange={handleImageUpload} 
              />
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Page Size</Typography>
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <Select value={pageSize} onChange={(e) => setPageSize(e.target.value)}>
                  {Object.entries(PAGE_SIZES).map(([key, val]) => (
                    <MenuItem key={key} value={key}>{val.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              {pageSize === 'Custom' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField size="small" label="W" type="number" value={customSize.width} onChange={(e) => setCustomSize({ ...customSize, width: parseInt(e.target.value) || 100 })} />
                  <TextField size="small" label="H" type="number" value={customSize.height} onChange={(e) => setCustomSize({ ...customSize, height: parseInt(e.target.value) || 100 })} />
                </Box>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>Background</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {COLOR_PRESETS.map(color => (
                  <Box
                    key={color}
                    sx={{
                      width: 24, height: 24, bgcolor: color, cursor: 'pointer', border: canvasBg === color ? '2px solid #1976d2' : '1px solid #ccc', borderRadius: 0.5
                    }}
                    onClick={() => setCanvasBg(color)}
                  />
                ))}
              </Box>
            </>
          )}
          
          {/* Templates Tab */}
          {leftTab === 1 && (
            <>
              <Typography variant="subtitle2" gutterBottom>Saved Designs</Typography>
              {savedDesigns.length === 0 ? (
                <Typography variant="body2" color="textSecondary">No saved designs yet</Typography>
              ) : (
                <List dense>
                  {savedDesigns.map(design => {
                    const dateStr = design.created_at || design.createdAt;
                    let dateDisplay = '';
                    if (design.isSystem) {
                      dateDisplay = 'System Template';
                    } else if (dateStr) {
                      try {
                        const date = new Date(dateStr);
                        dateDisplay = isNaN(date.getTime()) ? '' : date.toLocaleDateString();
                      } catch {
                        dateDisplay = '';
                      }
                    }
                    const isSystemTemplate = design.isSystem || design.id?.toString().startsWith('seed-');
                    return (
                      <ListItem key={design.id} button onClick={() => handleLoad(design)} secondaryAction={
                        !isSystemTemplate && (
                          <IconButton edge="end" size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDeleteSaved(design.id); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )
                      }>
                        <ListItemText 
                          primary={design.name} 
                          secondary={dateDisplay || 'User Design'}
                          primaryTypographyProps={{ fontWeight: isSystemTemplate ? 500 : 400 }}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              )}
            </>
          )}
          
          {/* Images Tab */}
          {leftTab === 2 && (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ color: '#1976d2' }}>📚 MySchool Image Bank</Typography>
              <TextField
                size="small"
                fullWidth
                placeholder="Search images (e.g., lion, elephant, tree)..."
                value={imageBankSearch}
                onChange={(e) => setImageBankSearch(e.target.value)}
                InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                sx={{ mb: 1 }}
              />
              <Box sx={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
                {imageBankLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box>
                ) : imageBankSearch.length < 2 ? (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>Type at least 2 characters to search</Typography>
                ) : imageBankImages.length > 0 ? (
                  <Grid container spacing={1}>
                    {imageBankImages.slice(0, 30).map((img, i) => (
                      <Grid item xs={4} key={i}>
                        <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }} onClick={() => addElement(ELEMENT_TYPES.IMAGE, { src: img })}>
                          <CardMedia component="img" height="60" image={img} sx={{ objectFit: 'contain', bgcolor: '#f5f5f5' }} />
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 2 }}>No images found for &quot;{imageBankSearch}&quot;</Typography>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRefImages.current?.click()}>
                Upload from Device
              </Button>
              <input 
                ref={fileInputRefImages} 
                type="file" 
                style={{ display: 'none' }}
                accept="image/*,.png,.jpg,.jpeg,.gif,.webp" 
                onChange={handleImageUpload} 
              />
            </>
          )}
        </Box>
      </Paper>
      
      {/* Main Canvas Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: { xs: '60vh', md: 'auto' } }}>
        {/* Top Toolbar - Made responsive */}
        <Paper sx={{ p: { xs: 0.5, md: 1 }, borderRadius: 0, display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 }, flexWrap: 'wrap', overflowX: 'auto' }}>
          <Tooltip title="New Design"><IconButton onClick={handleNewDesign} color="primary" size="small"><NewIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Tooltip title="Undo"><span><IconButton onClick={handleUndo} disabled={historyIndex <= 0} size="small"><UndoIcon /></IconButton></span></Tooltip>
          <Tooltip title="Redo"><span><IconButton onClick={handleRedo} disabled={historyIndex >= history.length - 1} size="small"><RedoIcon /></IconButton></span></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Tooltip title="Clear Canvas"><IconButton onClick={handleClearCanvas} color="error" size="small"><ClearIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Tooltip title="Zoom Out"><IconButton onClick={() => setZoom(Math.max(25, zoom - 10))} size="small"><ZoomOutIcon /></IconButton></Tooltip>
          <Typography sx={{ minWidth: { xs: 35, md: 45 }, textAlign: 'center', fontSize: { xs: '0.75rem', md: '1rem' } }}>{zoom}%</Typography>
          <Tooltip title="Zoom In"><IconButton onClick={() => setZoom(Math.min(200, zoom + 10))} size="small"><ZoomInIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
          <Tooltip title="Toggle Grid"><IconButton onClick={() => setShowGrid(!showGrid)} color={showGrid ? 'primary' : 'default'} size="small"><GridIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
          {/* Page Size Quick Select */}
          <FormControl size="small" sx={{ minWidth: { xs: 70, md: 100 }, display: { xs: 'none', sm: 'block' } }}>
            <Select value={pageSize} onChange={(e) => setPageSize(e.target.value)} displayEmpty sx={{ fontSize: '0.85rem' }}>
              <MenuItem value="A3">A3</MenuItem>
              <MenuItem value="A4">A4</MenuItem>
              <MenuItem value="A5">A5</MenuItem>
              <MenuItem value="Letter">Letter</MenuItem>
              <MenuItem value="Square">Square</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          {/* Action buttons - responsive */}
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            <Button variant="outlined" size="small" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ display: { xs: 'none', md: 'inline-flex' }, color: '#1976d2', '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>Print</Button>
            <Button variant="outlined" size="small" startIcon={<SaveIcon />} onClick={() => setSaveDialog(true)} sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' }, minWidth: { xs: 60, md: 80 }, color: '#1976d2', '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>Save</Button>
            <Button variant="outlined" size="small" startIcon={<LoadIcon />} onClick={() => setLoadDialog(true)} sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' }, minWidth: { xs: 60, md: 80 }, color: '#1976d2', '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>Load</Button>
          </Box>
          <Tooltip title="Export as PNG image">
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => handleExport('png')} sx={{ color: '#1976d2', '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>Export</Button>
          </Tooltip>
        </Paper>
        
        {/* Canvas Container */}
        <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2, bgcolor: '#f5f5f5' }}>
          <Paper
            ref={canvasRef}
            sx={{
              width: canvasSize.width * (zoom / 100),
              height: canvasSize.height * (zoom / 100),
              position: 'relative',
              bgcolor: canvasBg,
              boxShadow: 3,
              overflow: 'hidden',
              backgroundImage: showGrid ? 'linear-gradient(#e0e0e0 1px, transparent 1px), linear-gradient(90deg, #e0e0e0 1px, transparent 1px)' : 'none',
              backgroundSize: showGrid ? '20px 20px' : 'auto'
            }}
            onClick={(e) => { if (e.target !== e.currentTarget) return;
              // Don't deselect if we just finished dragging
              if (!wasDraggingRef.current) {
                setSelectedElement(null);
              }
            }}
          >
            {elements.map(el => renderElement(el))}
          </Paper>
        </Box>
      </Box>
      
      {/* Right Panel - Properties */}
      <Paper sx={{ width: 260, display: 'flex', flexDirection: 'column', borderRadius: 0, p: 2, overflow: 'auto' }}>
        <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>Properties</Typography>
        
        {selectedEl ? (
          <>
            <Typography variant="caption" color="textSecondary" gutterBottom>Selected: {selectedEl.type}</Typography>
            
            {/* Position & Size */}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Position & Size</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <TextField size="small" label="X" type="number" fullWidth value={Math.round(selectedEl.x)} onChange={(e) => updateElement(selectedEl.id, { x: parseInt(e.target.value) || 0 })} />
              </Grid>
              <Grid item xs={6}>
                <TextField size="small" label="Y" type="number" fullWidth value={Math.round(selectedEl.y)} onChange={(e) => updateElement(selectedEl.id, { y: parseInt(e.target.value) || 0 })} />
              </Grid>
              <Grid item xs={6}>
                <TextField size="small" label="Width" type="number" fullWidth value={Math.round(selectedEl.width)} onChange={(e) => updateElement(selectedEl.id, { width: parseInt(e.target.value) || 10 })} />
              </Grid>
              <Grid item xs={6}>
                <TextField size="small" label="Height" type="number" fullWidth value={Math.round(selectedEl.height)} onChange={(e) => updateElement(selectedEl.id, { height: parseInt(e.target.value) || 10 })} />
              </Grid>
            </Grid>
            
            {/* Rotation */}
            <Typography variant="subtitle2" sx={{ mt: 2 }}>Rotation</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Slider size="small" value={selectedEl.rotation || 0} min={0} max={360} onChange={(e, v) => updateElement(selectedEl.id, { rotation: v })} />
              <Typography variant="caption">{selectedEl.rotation || 0}°</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" variant="outlined" onClick={() => rotateElement(selectedEl.id, -15)}>-15°</Button>
              <Button size="small" variant="outlined" onClick={() => rotateElement(selectedEl.id, 15)}>+15°</Button>
              <Button size="small" variant="outlined" onClick={() => rotateElement(selectedEl.id, 90)}>+90°</Button>
            </Box>
            
            {/* Image Properties - Auto-fit */}
            {selectedEl.type === ELEMENT_TYPES.IMAGE && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Image Options</Typography>
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                  Drag corners to resize, or use a shape as mask:
                </Typography>
                <Button 
                  size="small" 
                  variant="outlined" 
                  fullWidth
                  onClick={(e) => { if (e.target !== e.currentTarget) return;
                    // Find the last shape added (to fit image into)
                    const shapes = elements.filter(e => 
                      [ELEMENT_TYPES.RECTANGLE, ELEMENT_TYPES.CIRCLE, ELEMENT_TYPES.TRIANGLE, ELEMENT_TYPES.STAR].includes(e.type)
                    );
                    if (shapes.length > 0) {
                      const targetShape = shapes[shapes.length - 1];
                      updateElement(selectedEl.id, { 
                        x: targetShape.x, 
                        y: targetShape.y, 
                        width: targetShape.width, 
                        height: targetShape.height 
                      });
                      setSnackbar({ open: true, message: 'Image fitted to shape!', severity: 'success' });
                    } else {
                      setSnackbar({ open: true, message: 'Add a shape first to fit the image into', severity: 'info' });
                    }
                  }}
                  sx={{ mb: 1 }}
                >
                  Fit to Last Shape
                </Button>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => updateElement(selectedEl.id, { width: 100, height: 100 })}
                  >
                    100x100
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => updateElement(selectedEl.id, { width: 150, height: 150 })}
                  >
                    150x150
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => updateElement(selectedEl.id, { width: 200, height: 200 })}
                  >
                    200x200
                  </Button>
                </Box>
              </>
            )}
            
            {/* Text Properties */}
            {selectedEl.type === ELEMENT_TYPES.TEXT && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Text</Typography>
                <TextField size="small" fullWidth multiline rows={2} value={selectedEl.text} onChange={(e) => updateElement(selectedEl.id, { text: e.target.value })} sx={{ mb: 1 }} />
                <FormControl size="small" fullWidth sx={{ mb: 1 }}>
                  <InputLabel>Font</InputLabel>
                  <Select value={selectedEl.fontFamily} label="Font" onChange={(e) => updateElement(selectedEl.id, { fontFamily: e.target.value })}>
                    {FONTS.map(f => <MenuItem key={f} value={f} sx={{ fontFamily: f }}>{f}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField size="small" label="Size" type="number" value={selectedEl.fontSize} onChange={(e) => updateElement(selectedEl.id, { fontSize: parseInt(e.target.value) || 12 })} sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                  <ToggleButton size="small" value="bold" selected={selectedEl.bold} onChange={() => updateElement(selectedEl.id, { bold: !selectedEl.bold })}><BoldIcon /></ToggleButton>
                  <ToggleButton size="small" value="italic" selected={selectedEl.italic} onChange={() => updateElement(selectedEl.id, { italic: !selectedEl.italic })}><ItalicIcon /></ToggleButton>
                  <ToggleButton size="small" value="left" selected={selectedEl.align === 'left'} onChange={() => updateElement(selectedEl.id, { align: 'left' })}><AlignLeftIcon /></ToggleButton>
                  <ToggleButton size="small" value="center" selected={selectedEl.align === 'center'} onChange={() => updateElement(selectedEl.id, { align: 'center' })}><AlignCenterIcon /></ToggleButton>
                  <ToggleButton size="small" value="right" selected={selectedEl.align === 'right'} onChange={() => updateElement(selectedEl.id, { align: 'right' })}><AlignRightIcon /></ToggleButton>
                </Box>
                <Typography variant="subtitle2" sx={{ mt: 1 }}>Text Color</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {COLOR_PRESETS.slice(0, 12).map(c => (
                    <Box key={c} sx={{ width: 20, height: 20, bgcolor: c, cursor: 'pointer', border: selectedEl.color === c ? '2px solid #000' : '1px solid #ccc' }} onClick={() => updateElement(selectedEl.id, { color: c })} />
                  ))}
                </Box>
              </>
            )}
            
            {/* Shape Properties - Shapes with Fill and Stroke */}
            {[ELEMENT_TYPES.RECTANGLE, ELEMENT_TYPES.CIRCLE, ELEMENT_TYPES.TRIANGLE, ELEMENT_TYPES.STAR].includes(selectedEl.type) && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Colors</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="caption" sx={{ width: 40 }}>Fill:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {COLOR_PRESETS.slice(0, 12).map(c => (
                      <Box key={c} sx={{ width: 20, height: 20, bgcolor: c, cursor: 'pointer', border: selectedEl.fill === c ? '2px solid #000' : '1px solid #ccc' }} onClick={() => updateElement(selectedEl.id, { fill: c })} />
                    ))}
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ width: 40 }}>Stroke:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {COLOR_PRESETS.slice(0, 12).map(c => (
                      <Box key={c} sx={{ width: 20, height: 20, bgcolor: c, cursor: 'pointer', border: selectedEl.stroke === c ? '2px solid #000' : '1px solid #ccc' }} onClick={() => updateElement(selectedEl.id, { stroke: c })} />
                    ))}
                  </Box>
                </Box>
              </>
            )}
            
            {/* Line and Arrow Properties - Stroke only */}
            {[ELEMENT_TYPES.LINE, ELEMENT_TYPES.ARROW].includes(selectedEl.type) && (
              <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Line Color</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ width: 40 }}>Color:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {COLOR_PRESETS.slice(0, 12).map(c => (
                      <Box key={c} sx={{ width: 20, height: 20, bgcolor: c, cursor: 'pointer', border: selectedEl.stroke === c ? '2px solid #000' : '1px solid #ccc' }} onClick={() => updateElement(selectedEl.id, { stroke: c })} />
                    ))}
                  </Box>
                </Box>
              </>
            )}
            
            <Divider sx={{ my: 2 }} />
            
            {/* Actions */}
            <Typography variant="subtitle2">Actions</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
              <Tooltip title="Bring to Front"><IconButton size="small" onClick={() => bringToFront(selectedEl.id)}><BringFrontIcon /></IconButton></Tooltip>
              <Tooltip title="Send to Back"><IconButton size="small" onClick={() => sendToBack(selectedEl.id)}><SendBackIcon /></IconButton></Tooltip>
              <Tooltip title="Duplicate"><IconButton size="small" onClick={() => duplicateElement(selectedEl)}><CopyIcon /></IconButton></Tooltip>
              <Tooltip title={selectedEl.locked ? "Unlock" : "Lock"}><IconButton size="small" onClick={() => toggleLock(selectedEl.id)}>{selectedEl.locked ? <LockIcon /> : <UnlockIcon />}</IconButton></Tooltip>
              <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => deleteElement(selectedEl.id)}><DeleteIcon /></IconButton></Tooltip>
            </Box>
          </>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>Select an element to edit its properties</Typography>
        )}
        
        <Box sx={{ flex: 1 }} />
        
        {/* Page Info */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="textSecondary">
          Page Size: {canvasSize.width} × {canvasSize.height}px<br/>
          Elements: {elements.length}
        </Typography>
      </Paper>
      
      {/* Save Dialog */}
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)}>
        <DialogTitle>Save Design</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Design Name" value={designName} onChange={(e) => setDesignName(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>Cancel</Button>
          <Button variant="outlined" onClick={handleSave} sx={{ color: '#1976d2', '&:hover': { color: '#000000', backgroundColor: 'rgba(25, 118, 210, 0.04)' } }}>Save</Button>
        </DialogActions>
      </Dialog>
      
      {/* Load Dialog */}
      <Dialog open={loadDialog} onClose={() => setLoadDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Load Design</DialogTitle>
        <DialogContent>
          {savedDesigns.length === 0 ? (
            <Typography color="textSecondary">No saved designs found</Typography>
          ) : (
            <List>
              {savedDesigns.map(design => {
                const dateStr = design.created_at || design.createdAt;
                let dateDisplay = '';
                if (design.isSystem) {
                  dateDisplay = 'System Template';
                } else if (dateStr) {
                  try {
                    const date = new Date(dateStr);
                    dateDisplay = isNaN(date.getTime()) ? '' : date.toLocaleString();
                  } catch {
                    dateDisplay = '';
                  }
                }
                const isSystemTemplate = design.isSystem || design.id?.toString().startsWith('seed-');
                return (
                  <ListItem 
                    key={design.id} 
                    button 
                    onClick={() => handleLoad(design)}
                    secondaryAction={
                      !isSystemTemplate && (
                        <IconButton 
                          edge="end" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSaved(design.id);
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText 
                      primary={design.name} 
                      secondary={`${design.pageSize || 'A4'}${dateDisplay ? ` • ${dateDisplay}` : ''}`}
                      primaryTypographyProps={{ fontWeight: isSystemTemplate ? 500 : 400 }}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoadDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
});

export default UnifiedMaker;
