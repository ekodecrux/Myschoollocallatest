import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { useSelector } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Paper, IconButton, Tooltip, Divider, Slider, Typography, Menu, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Snackbar, Alert, Chip, LinearProgress } from '@mui/material';
import {
  Brush, BorderColor, Delete, Undo, Redo, Save, FolderOpen, ZoomIn, ZoomOut, PanTool,
  CropSquare, RadioButtonUnchecked, ArrowForward, Remove, ChangeHistory, TextFields, StickyNote2,
  FormatColorFill, SelectAll, ClearAll, GridOn, GridOff, Download, Fullscreen, FullscreenExit,
  FiberManualRecord, Stop, Image as ImageIcon, ArrowBack, PictureAsPdf
} from '@mui/icons-material';
import { HexColorPicker } from 'react-colorful';
import * as pdfjsLib from 'pdfjs-dist';
import './DigitalBoard.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const DigitalBoard = ({ lessonData, onClose, isPreview = false }) => {
  const boardCanvas = useRef(null);
  const fabricCanvas = useRef(null);
  const wrapperRef = useRef(null);
  const recorderRef = useRef(null);
  const videoChunks = useRef([]);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  
  const { userDetails } = useSelector((state) => state.login);

  const [tool, setTool] = useState('select');
  const [penColor, setPenColor] = useState('#000000');
  const [penWidth, setPenWidth] = useState(5);
  const [markerColor, setMarkerColor] = useState('#FFFF00');
  const [shapeFill, setShapeFill] = useState('transparent');
  const [undoStack, setUndoStack] = useState([]);
  const [stackPtr, setStackPtr] = useState(-1);
  const [scale, setScale] = useState(1);
  const [gridVisible, setGridVisible] = useState(false);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  const [pickerAnchor, setPickerAnchor] = useState(null);
  const [pickerTarget, setPickerTarget] = useState('pen');
  
  const [recording, setRecording] = useState(false);
  const [recTime, setRecTime] = useState(0);
  const [recTimer, setRecTimer] = useState(null);
  
  const [boardList, setBoardList] = useState([]);
  const [boardId, setBoardId] = useState(null);
  const [boardTitle, setBoardTitle] = useState('Untitled Board');
  const [saveModal, setSaveModal] = useState(false);
  const [loadModal, setLoadModal] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  
  const [currLesson, setCurrLesson] = useState(lessonData || null);
  const [lessonPanelOpen, setLessonPanelOpen] = useState(!!lessonData);
  
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  useEffect(() => {
    const lId = params.get('lessonId');
    const lTitle = params.get('title');
    const lContent = params.get('content');
    
    if (lId || lTitle) {
      setCurrLesson({
        id: lId,
        title: lTitle || 'Lesson',
        content: lContent ? decodeURIComponent(lContent) : '',
      });
      setLessonPanelOpen(true);
      setBoardTitle(lTitle || 'Lesson Board');
    }
  }, [params]);

  useEffect(() => {
    if (fabricCanvas.current) return;

    const w = wrapperRef.current?.clientWidth || 1000;
    const h = wrapperRef.current?.clientHeight || 600;

    const canvas = new fabric.Canvas(boardCanvas.current, {
      width: Math.max(w - 150, 800),
      height: Math.max(h - 80, 500),
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricCanvas.current = canvas;

    const pushHistory = () => trackChanges();
    canvas.on('object:added', pushHistory);
    canvas.on('object:modified', pushHistory);
    canvas.on('object:removed', pushHistory);

    canvas.on('mouse:wheel', (e) => {
      if (!e.e.ctrlKey) return;
      const delta = e.e.deltaY;
      let newScale = canvas.getZoom() * (1 - delta / 500);
      newScale = Math.min(Math.max(0.1, newScale), 5);
      canvas.zoomToPoint({ x: e.e.offsetX, y: e.e.offsetY }, newScale);
      setScale(newScale);
      e.e.preventDefault();
      e.e.stopPropagation();
    });

    let dragX, dragY;
    canvas.on('mouse:down', (e) => {
      if (!e.e.altKey) return;
      canvas.isDragging = true;
      canvas.selection = false;
      dragX = e.e.clientX;
      dragY = e.e.clientY;
    });

    canvas.on('mouse:move', (e) => {
      if (!canvas.isDragging) return;
      const vpt = canvas.viewportTransform;
      vpt[4] += e.e.clientX - dragX;
      vpt[5] += e.e.clientY - dragY;
      canvas.requestRenderAll();
      dragX = e.e.clientX;
      dragY = e.e.clientY;
    });

    canvas.on('mouse:up', () => {
      canvas.isDragging = false;
      canvas.selection = true;
    });

    const onResize = () => {
      if (!wrapperRef.current || !fabricCanvas.current) return;
      fabricCanvas.current.setDimensions({
        width: Math.max(wrapperRef.current.clientWidth - 150, 800),
        height: Math.max(wrapperRef.current.clientHeight - 80, 500)
      });
    };

    window.addEventListener('resize', onResize);
    fetchBoardList();

    if (currLesson?.content) {
      addLessonText(currLesson.content);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, []);

  const addLessonText = (txt) => {
    const c = fabricCanvas.current;
    if (!c || !txt) return;

    const textObj = new fabric.IText(txt, {
      left: 50,
      top: 50,
      fontFamily: 'Arial',
      fontSize: 18,
      fill: '#333333',
    });
    c.add(textObj);
    c.renderAll();
  };

  const trackChanges = useCallback(() => {
    if (!fabricCanvas.current) return;
    const state = fabricCanvas.current.toJSON();
    setUndoStack(prev => {
      const newStack = prev.slice(0, stackPtr + 1);
      newStack.push(state);
      return newStack.slice(-50);
    });
    setStackPtr(prev => Math.min(prev + 1, 49));
  }, [stackPtr]);

  const doUndo = () => {
    if (stackPtr <= 0) return;
    const idx = stackPtr - 1;
    fabricCanvas.current.loadFromJSON(undoStack[idx]).then(() => {
      fabricCanvas.current.renderAll();
      setStackPtr(idx);
    });
  };

  const doRedo = () => {
    if (stackPtr >= undoStack.length - 1) return;
    const idx = stackPtr + 1;
    fabricCanvas.current.loadFromJSON(undoStack[idx]).then(() => {
      fabricCanvas.current.renderAll();
      setStackPtr(idx);
    });
  };

  const switchTool = (t) => {
    setTool(t);
    const c = fabricCanvas.current;
    if (!c) return;

    c.isDrawingMode = false;
    c.selection = true;

    if (t === 'pen') {
      c.isDrawingMode = true;
      c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.freeDrawingBrush.color = penColor;
      c.freeDrawingBrush.width = penWidth;
    } else if (t === 'marker') {
      c.isDrawingMode = true;
      c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.freeDrawingBrush.color = markerColor + '80';
      c.freeDrawingBrush.width = penWidth * 3;
    } else if (t === 'eraser') {
      c.isDrawingMode = true;
      c.freeDrawingBrush = new fabric.PencilBrush(c);
      c.freeDrawingBrush.color = '#ffffff';
      c.freeDrawingBrush.width = penWidth * 2;
    } else if (t === 'pan') {
      c.selection = false;
    }
  };

  const getViewportCenter = () => {
    const c = fabricCanvas.current;
    if (!c) return { x: 400, y: 300 };
    
    const zoom = c.getZoom();
    const vpt = c.viewportTransform;
    const cx = (c.width / 2 - vpt[4]) / zoom;
    const cy = (c.height / 2 - vpt[5]) / zoom;
    return { x: cx, y: cy };
  };

  const insertShape = (type) => {
    const c = fabricCanvas.current;
    if (!c) return;

    const center = getViewportCenter();
    const cx = center.x;
    const cy = center.y;
    let obj;

    if (type === 'rect') {
      obj = new fabric.Rect({
        left: cx - 50, top: cy - 35, width: 100, height: 70,
        fill: shapeFill === 'transparent' ? 'transparent' : shapeFill,
        stroke: penColor, strokeWidth: 2,
      });
    } else if (type === 'circle') {
      obj = new fabric.Circle({
        left: cx - 40, top: cy - 40, radius: 40,
        fill: shapeFill === 'transparent' ? 'transparent' : shapeFill,
        stroke: penColor, strokeWidth: 2,
      });
    } else if (type === 'triangle') {
      obj = new fabric.Triangle({
        left: cx - 40, top: cy - 35, width: 80, height: 70,
        fill: shapeFill === 'transparent' ? 'transparent' : shapeFill,
        stroke: penColor, strokeWidth: 2,
      });
    } else if (type === 'line') {
      obj = new fabric.Line([cx - 50, cy, cx + 50, cy], {
        stroke: penColor, strokeWidth: 2,
      });
    } else if (type === 'arrow') {
      const len = 15;
      const path = `M ${cx - 50} ${cy} L ${cx + 50} ${cy} M ${cx + 50} ${cy} L ${cx + 50 - len * Math.cos(-Math.PI / 6)} ${cy - len * Math.sin(-Math.PI / 6)} M ${cx + 50} ${cy} L ${cx + 50 - len * Math.cos(Math.PI / 6)} ${cy - len * Math.sin(Math.PI / 6)}`;
      obj = new fabric.Path(path, { fill: 'transparent', stroke: penColor, strokeWidth: 2 });
    }

    if (!obj) return;
    c.add(obj);
    c.setActiveObject(obj);
    c.renderAll();
    setTool('select');
  };

  const insertText = () => {
    const c = fabricCanvas.current;
    if (!c) return;

    const center = getViewportCenter();
    const txt = new fabric.IText('Double click to edit', {
      left: center.x - 80, top: center.y - 15,
      fontFamily: 'Arial', fontSize: 20, fill: penColor,
    });
    c.add(txt);
    c.setActiveObject(txt);
    c.renderAll();
    setTool('select');
  };

  const insertNote = () => {
    const c = fabricCanvas.current;
    if (!c) return;

    const colors = ['#FFEB3B', '#FF9800', '#4CAF50', '#2196F3', '#E91E63'];
    const bg = colors[Math.floor(Math.random() * colors.length)];
    const center = getViewportCenter();

    const rect = new fabric.Rect({
      width: 150, height: 150, fill: bg, rx: 5, ry: 5,
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.3)', blur: 10, offsetX: 3, offsetY: 3 }),
    });
    const txt = new fabric.IText('Note...', {
      fontSize: 14, fontFamily: 'Arial', fill: '#333', left: 10, top: 10,
    });
    const grp = new fabric.Group([rect, txt], {
      left: center.x - 75, top: center.y - 75,
    });

    c.add(grp);
    c.setActiveObject(grp);
    c.renderAll();
    setTool('select');
  };

  const removeSelected = () => {
    const c = fabricCanvas.current;
    if (!c) return;
    const objs = c.getActiveObjects();
    if (!objs.length) return;
    objs.forEach(o => c.remove(o));
    c.discardActiveObject();
    c.renderAll();
  };

  const clearBoard = () => {
    const c = fabricCanvas.current;
    if (!c) return;
    c.clear();
    c.backgroundColor = '#ffffff';
    c.renderAll();
    setBoardId(null);
    setBoardTitle('Untitled Board');
  };

  const zoomBoard = (dir) => {
    const c = fabricCanvas.current;
    if (!c) return;
    let z = dir === 'in' ? scale * 1.1 : scale / 1.1;
    z = Math.min(Math.max(0.1, z), 5);
    c.setZoom(z);
    setScale(z);
  };

  const resetView = () => {
    const c = fabricCanvas.current;
    if (!c) return;
    c.setZoom(1);
    c.viewportTransform = [1, 0, 0, 1, 0, 0];
    setScale(1);
    c.renderAll();
  };

  const toggleGrid = () => {
    const c = fabricCanvas.current;
    if (!c) return;

    if (gridVisible) {
      c.backgroundColor = '#ffffff';
    } else {
      const sz = 20;
      const gCanvas = document.createElement('canvas');
      gCanvas.width = sz;
      gCanvas.height = sz;
      const ctx = gCanvas.getContext('2d');
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sz, 0);
      ctx.lineTo(sz, sz);
      ctx.lineTo(0, sz);
      ctx.stroke();
      c.backgroundColor = new fabric.Pattern({ source: gCanvas, repeat: 'repeat' });
    }
    c.renderAll();
    setGridVisible(!gridVisible);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wrapperRef.current?.requestFullscreen();
      setFullscreenMode(true);
    } else {
      document.exitFullscreen();
      setFullscreenMode(false);
    }
  };

  // screen capture
  const startCapture = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: true
      });

      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      recorderRef.current = recorder;
      videoChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) videoChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(videoChunks.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${boardTitle}_${new Date().toISOString().slice(0, 10)}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setToast({ show: true, msg: 'Recording saved!', type: 'success' });
      };

      recorder.start();
      setRecording(true);
      
      const timer = setInterval(() => setRecTime(t => t + 1), 1000);
      setRecTimer(timer);

      stream.getVideoTracks()[0].onended = () => stopCapture();
    } catch (err) {
      setToast({ show: true, msg: 'Recording failed', type: 'error' });
    }
  };

  const stopCapture = () => {
    if (!recorderRef.current || !recording) return;
    recorderRef.current.stop();
    recorderRef.current.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
    setRecTime(0);
    if (recTimer) {
      clearInterval(recTimer);
      setRecTimer(null);
    }
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const uploadImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      fabric.FabricImage.fromURL(ev.target.result).then((img) => {
        const c = fabricCanvas.current;
        const center = getViewportCenter();
        const ratio = Math.min((c.width * 0.5) / img.width, (c.height * 0.5) / img.height);
        img.scale(ratio);
        img.set({
          left: center.x - (img.width * ratio) / 2,
          top: center.y - (img.height * ratio) / 2,
        });
        c.add(img);
        c.setActiveObject(img);
        c.renderAll();
      });
    };
    reader.readAsDataURL(file);
  };

  const importPdfPpt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isPpt = file.name.toLowerCase().endsWith('.pptx') || file.name.toLowerCase().endsWith('.ppt');

    if (!isPdf && !isPpt) {
      setToast({ show: true, msg: 'Please select a PDF or PPT file', type: 'error' });
      return;
    }

    if (isPpt) {
      setToast({ show: true, msg: 'PPT import coming soon. Please convert to PDF first.', type: 'info' });
      return;
    }

    setPdfLoading(true);
    setPdfProgress(0);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const totalPages = pdf.numPages;

      const c = fabricCanvas.current;
      if (!c) {
        setPdfLoading(false);
        return;
      }

      const center = getViewportCenter();
      let xOffset = center.x - 200;
      let yOffset = center.y - 150;

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        setPdfProgress(Math.round((pageNum / totalPages) * 100));

        const page = await pdf.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;

        const dataUrl = canvas.toDataURL('image/png');
        const img = await fabric.FabricImage.fromURL(dataUrl);

        const fitRatio = Math.min(400 / img.width, 300 / img.height);
        img.scale(fitRatio);
        img.set({
          left: xOffset + (pageNum - 1) * (img.width * fitRatio + 20),
          top: yOffset,
        });

        c.add(img);

        if (pageNum % 3 === 0) {
          yOffset += img.height * fitRatio + 20;
          xOffset = center.x - 200;
        }
      }

      c.renderAll();
      setToast({ show: true, msg: `Imported ${totalPages} pages from PDF`, type: 'success' });
    } catch (err) {
      console.error('PDF import error:', err);
      setToast({ show: true, msg: 'Failed to import PDF', type: 'error' });
    } finally {
      setPdfLoading(false);
      setPdfProgress(0);
    }
  };

  const fetchBoardList = async () => {
    try {
      const tkn = localStorage.getItem('token');
      if (!tkn) return;
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/digital-boards`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      if (res.ok) {
        const d = await res.json();
        setBoardList(d.boards || []);
      }
    } catch (e) {
      // silent fail
    }
  };

  const saveBoard = async () => {
    const c = fabricCanvas.current;
    if (!c) return;

    try {
      const tkn = localStorage.getItem('token');
      const payload = {
        name: boardTitle,
        data: JSON.stringify(c.toJSON()),
        thumbnail: c.toDataURL({ format: 'png', quality: 0.3, multiplier: 0.2 }),
        lesson_plan_id: currLesson?.id || null
      };

      const endpoint = boardId 
        ? `${process.env.REACT_APP_BACKEND_URL}/api/rest/digital-boards/${boardId}`
        : `${process.env.REACT_APP_BACKEND_URL}/api/rest/digital-boards`;

      const res = await fetch(endpoint, {
        method: boardId ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${tkn}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const d = await res.json();
        setBoardId(d.board_id);
        setToast({ show: true, msg: 'Saved!', type: 'success' });
        fetchBoardList();
        setSaveModal(false);
      }
    } catch (e) {
      setToast({ show: true, msg: 'Save failed', type: 'error' });
    }
  };

  const loadBoard = async (id) => {
    try {
      const tkn = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/digital-boards/${id}`, {
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      
      if (res.ok) {
        const d = await res.json();
        fabricCanvas.current.loadFromJSON(JSON.parse(d.data)).then(() => {
          fabricCanvas.current.renderAll();
          setBoardId(d.id);
          setBoardTitle(d.name);
          setLoadModal(false);
          setToast({ show: true, msg: 'Loaded!', type: 'success' });
        });
      }
    } catch (e) {
      setToast({ show: true, msg: 'Load failed', type: 'error' });
    }
  };

  const deleteBoard = async (id) => {
    try {
      const tkn = localStorage.getItem('token');
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/rest/digital-boards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${tkn}` }
      });
      fetchBoardList();
      setToast({ show: true, msg: 'Deleted', type: 'info' });
    } catch (e) {
      // silent
    }
  };

  const exportBoard = (fmt = 'png') => {
    const c = fabricCanvas.current;
    if (!c) return;
    const url = c.toDataURL({ format: fmt, quality: 1, multiplier: 2 });
    const a = document.createElement('a');
    a.download = `${boardTitle}.${fmt}`;
    a.href = url;
    a.click();
  };

  const openPicker = (e, target) => {
    setPickerTarget(target);
    setPickerAnchor(e.currentTarget);
  };

  const closePicker = () => setPickerAnchor(null);

  const onColorChange = (clr) => {
    if (pickerTarget === 'pen') {
      setPenColor(clr);
      if (fabricCanvas.current?.freeDrawingBrush) {
        fabricCanvas.current.freeDrawingBrush.color = clr;
      }
    } else if (pickerTarget === 'marker') {
      setMarkerColor(clr);
    } else if (pickerTarget === 'fill') {
      setShapeFill(clr);
    }
  };

  const goBack = () => {
    if (onClose) onClose();
    else navigate(-1);
  };

  return (
    <Box className="digital-board-wrapper" ref={wrapperRef} data-testid="digital-board">
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Paper className="db-top-toolbar" elevation={3}>
          {isPreview && (
            <Tooltip title="Back">
              <IconButton onClick={goBack} size="small"><ArrowBack /></IconButton>
            </Tooltip>
          )}
          
          <TextField
            size="small"
            value={boardTitle}
            onChange={(e) => setBoardTitle(e.target.value)}
            variant="standard"
            sx={{ width: 180, mx: 1 }}
          />
          
          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Tooltip title="New"><IconButton onClick={clearBoard} size="small"><ClearAll /></IconButton></Tooltip>
          <Tooltip title="Save"><IconButton onClick={() => setSaveModal(true)} size="small"><Save /></IconButton></Tooltip>
          <Tooltip title="Open"><IconButton onClick={() => { fetchBoardList(); setLoadModal(true); }} size="small"><FolderOpen /></IconButton></Tooltip>
          <Tooltip title="Export"><IconButton onClick={() => exportBoard('png')} size="small"><Download /></IconButton></Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Tooltip title="Undo"><IconButton onClick={doUndo} disabled={stackPtr <= 0} size="small"><Undo /></IconButton></Tooltip>
          <Tooltip title="Redo"><IconButton onClick={doRedo} disabled={stackPtr >= undoStack.length - 1} size="small"><Redo /></IconButton></Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          <Tooltip title="Zoom In"><IconButton onClick={() => zoomBoard('in')} size="small"><ZoomIn /></IconButton></Tooltip>
          <Typography variant="caption" sx={{ mx: 1, minWidth: 40, textAlign: 'center' }}>{Math.round(scale * 100)}%</Typography>
          <Tooltip title="Zoom Out"><IconButton onClick={() => zoomBoard('out')} size="small"><ZoomOut /></IconButton></Tooltip>
          <Tooltip title="Reset"><IconButton onClick={resetView} size="small" sx={{ fontSize: 11 }}>1:1</IconButton></Tooltip>
          <Tooltip title={gridVisible ? "Hide Grid" : "Show Grid"}>
            <IconButton onClick={toggleGrid} size="small">{gridVisible ? <GridOff /> : <GridOn />}</IconButton>
          </Tooltip>
          <Tooltip title="Fullscreen">
            <IconButton onClick={toggleFullscreen} size="small">{fullscreenMode ? <FullscreenExit /> : <Fullscreen />}</IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

          {recording ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip icon={<FiberManualRecord sx={{ color: 'red' }} />} label={fmtTime(recTime)} color="error" size="small" />
              <Tooltip title="Stop"><IconButton onClick={stopCapture} size="small" color="error"><Stop /></IconButton></Tooltip>
            </Box>
          ) : (
            <Tooltip title="Record Screen"><IconButton onClick={startCapture} size="small"><FiberManualRecord /></IconButton></Tooltip>
          )}

          <Tooltip title="Add Image">
            <IconButton component="label" size="small">
              <ImageIcon />
              <input type="file" hidden accept="image/*" onChange={uploadImage} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Import PDF">
            <IconButton component="label" size="small" disabled={pdfLoading}>
              <PictureAsPdf />
              <input type="file" hidden accept=".pdf,.pptx,.ppt" onChange={importPdfPpt} />
            </IconButton>
          </Tooltip>

          {currLesson && (
            <>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <Chip label={`Lesson: ${currLesson.title}`} size="small" color="primary" variant="outlined" />
            </>
          )}
        </Paper>

        {pdfLoading && (
          <Box sx={{ width: '100%', px: 2, py: 1 }}>
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}>
              Importing PDF... {pdfProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={pdfProgress} />
          </Box>
        )}

        <Box sx={{ flex: 1, position: 'relative' }}>
          {lessonPanelOpen && currLesson && (
            <Paper className="db-lesson-panel" elevation={2}>
              <Typography variant="subtitle2" gutterBottom>{currLesson.title}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ maxHeight: 200, overflow: 'auto' }}>
                {currLesson.content || currLesson.objectives || 'No content'}
              </Typography>
              <Button size="small" onClick={() => setLessonPanelOpen(false)} sx={{ mt: 1 }}>Hide</Button>
            </Paper>
          )}

          <Paper className="db-left-toolbar" elevation={3}>
            <Tooltip title="Select" placement="right">
              <IconButton onClick={() => switchTool('select')} color={tool === 'select' ? 'primary' : 'default'} size="small"><SelectAll /></IconButton>
            </Tooltip>
            <Tooltip title="Pan" placement="right">
              <IconButton onClick={() => switchTool('pan')} color={tool === 'pan' ? 'primary' : 'default'} size="small"><PanTool /></IconButton>
            </Tooltip>

            <Divider sx={{ my: 1 }} />

            <Tooltip title="Pen" placement="right">
              <IconButton onClick={() => switchTool('pen')} color={tool === 'pen' ? 'primary' : 'default'} size="small"><Brush /></IconButton>
            </Tooltip>
            <Tooltip title="Highlighter" placement="right">
              <IconButton onClick={() => switchTool('marker')} color={tool === 'marker' ? 'primary' : 'default'} size="small"><BorderColor /></IconButton>
            </Tooltip>
            <Tooltip title="Eraser" placement="right">
              <IconButton onClick={() => switchTool('eraser')} color={tool === 'eraser' ? 'primary' : 'default'} size="small"><Delete /></IconButton>
            </Tooltip>

            <Divider sx={{ my: 1 }} />

            <Tooltip title="Rectangle" placement="right"><IconButton onClick={() => insertShape('rect')} size="small"><CropSquare /></IconButton></Tooltip>
            <Tooltip title="Circle" placement="right"><IconButton onClick={() => insertShape('circle')} size="small"><RadioButtonUnchecked /></IconButton></Tooltip>
            <Tooltip title="Triangle" placement="right"><IconButton onClick={() => insertShape('triangle')} size="small"><ChangeHistory /></IconButton></Tooltip>
            <Tooltip title="Line" placement="right"><IconButton onClick={() => insertShape('line')} size="small"><Remove /></IconButton></Tooltip>
            <Tooltip title="Arrow" placement="right"><IconButton onClick={() => insertShape('arrow')} size="small"><ArrowForward /></IconButton></Tooltip>

            <Divider sx={{ my: 1 }} />

            <Tooltip title="Text" placement="right"><IconButton onClick={insertText} size="small"><TextFields /></IconButton></Tooltip>
            <Tooltip title="Sticky Note" placement="right"><IconButton onClick={insertNote} size="small"><StickyNote2 /></IconButton></Tooltip>

            <Divider sx={{ my: 1 }} />

            <Tooltip title="Pen Color" placement="right">
              <IconButton onClick={(e) => openPicker(e, 'pen')} size="small">
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: penColor, border: '2px solid #ccc' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Fill" placement="right">
              <IconButton onClick={(e) => openPicker(e, 'fill')} size="small">
                <FormatColorFill sx={{ color: shapeFill === 'transparent' ? '#ccc' : shapeFill }} />
              </IconButton>
            </Tooltip>

            <Divider sx={{ my: 1 }} />

            <Tooltip title="Delete" placement="right">
              <IconButton onClick={removeSelected} size="small" color="error"><Delete /></IconButton>
            </Tooltip>
          </Paper>

          <Paper className="db-right-toolbar" elevation={3}>
            <Typography variant="caption">Size</Typography>
            <Slider
              orientation="vertical"
              value={penWidth}
              onChange={(e, v) => {
                setPenWidth(v);
                if (fabricCanvas.current?.freeDrawingBrush) fabricCanvas.current.freeDrawingBrush.width = v;
              }}
              min={1}
              max={50}
              sx={{ height: 120 }}
            />
            <Typography variant="caption">{penWidth}px</Typography>
          </Paper>

          <Box className="db-canvas-area">
            <canvas ref={boardCanvas} id="board-canvas" />
          </Box>
        </Box>
      </Box>

      <Menu anchorEl={pickerAnchor} open={Boolean(pickerAnchor)} onClose={closePicker} PaperProps={{ sx: { p: 2 } }}>
        <HexColorPicker 
          color={pickerTarget === 'pen' ? penColor : pickerTarget === 'marker' ? markerColor : shapeFill} 
          onChange={onColorChange} 
        />
        {pickerTarget === 'fill' && (
          <Button onClick={() => { setShapeFill('transparent'); closePicker(); }} fullWidth sx={{ mt: 1 }}>None</Button>
        )}
      </Menu>

      <Dialog open={saveModal} onClose={() => setSaveModal(false)}>
        <DialogTitle>Save Board</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" label="Name" fullWidth value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveModal(false)}>Cancel</Button>
          <Button onClick={saveBoard} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={loadModal} onClose={() => setLoadModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>Open Board</DialogTitle>
        <DialogContent>
          {boardList.length === 0 ? (
            <Typography color="textSecondary">No saved boards.</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 2, mt: 1 }}>
              {boardList.map((b) => (
                <Paper key={b.id} sx={{ p: 1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }} onClick={() => loadBoard(b.id)}>
                  {b.thumbnail && <img src={b.thumbnail} alt={b.name} style={{ width: '100%', height: 100, objectFit: 'cover' }} />}
                  <Typography variant="subtitle2" noWrap>{b.name}</Typography>
                  <Typography variant="caption" color="textSecondary">{new Date(b.updated_at).toLocaleDateString()}</Typography>
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteBoard(b.id); }} sx={{ float: 'right' }}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setLoadModal(false)}>Close</Button></DialogActions>
      </Dialog>

      <Snackbar open={toast.show} autoHideDuration={3000} onClose={() => setToast({ ...toast, show: false })}>
        <Alert severity={toast.type} onClose={() => setToast({ ...toast, show: false })}>{toast.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default DigitalBoard;
