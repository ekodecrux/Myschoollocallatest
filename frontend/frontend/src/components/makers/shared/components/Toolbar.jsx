import React from 'react';
import { Box, Paper, IconButton, Tooltip } from '@mui/material';
import {
  Undo as UndoIcon,
  Redo as RedoIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  FlipToFront as BringToFrontIcon,
  FlipToBack as SendToBackIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  GridOn as GridIcon,
  Download as DownloadIcon,
  Save as SaveIcon
} from '@mui/icons-material';

const Toolbar = ({
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  selectedElement,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  showGrid,
  onToggleGrid,
  onExport,
  onSave
}) => {
  return (
    <Paper 
      sx={{ 
        display: 'flex', 
        gap: 0.5, 
        p: 1, 
        mb: 1, 
        alignItems: 'center',
        flexWrap: 'wrap'
      }}
    >
      {/* History Controls */}
      <Box sx={{ display: 'flex', gap: 0.5, borderRight: '1px solid #ddd', pr: 1, mr: 1 }}>
        <Tooltip title="Undo (Ctrl+Z)">
          <span>
            <IconButton size="small" onClick={onUndo} disabled={!canUndo}>
              <UndoIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Redo (Ctrl+Y)">
          <span>
            <IconButton size="small" onClick={onRedo} disabled={!canRedo}>
              <RedoIcon />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Zoom Controls */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', borderRight: '1px solid #ddd', pr: 1, mr: 1 }}>
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={onZoomOut}>
            <ZoomOutIcon />
          </IconButton>
        </Tooltip>
        <Box sx={{ minWidth: 50, textAlign: 'center', fontSize: '0.875rem' }}>
          {Math.round(zoom * 100)}%
        </Box>
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={onZoomIn}>
            <ZoomInIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Element Actions */}
      {selectedElement && (
        <Box sx={{ display: 'flex', gap: 0.5, borderRight: '1px solid #ddd', pr: 1, mr: 1 }}>
          <Tooltip title="Delete (Del)">
            <IconButton size="small" onClick={onDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate (Ctrl+D)">
            <IconButton size="small" onClick={onDuplicate}>
              <DuplicateIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bring to Front">
            <IconButton size="small" onClick={onBringToFront}>
              <BringToFrontIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Send to Back">
            <IconButton size="small" onClick={onSendToBack}>
              <SendToBackIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={selectedElement.locked ? "Unlock" : "Lock"}>
            <IconButton size="small" onClick={onToggleLock}>
              {selectedElement.locked ? <LockIcon color="warning" /> : <LockOpenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* View Options */}
      <Box sx={{ display: 'flex', gap: 0.5, borderRight: '1px solid #ddd', pr: 1, mr: 1 }}>
        <Tooltip title="Toggle Grid">
          <IconButton 
            size="small" 
            onClick={onToggleGrid}
            color={showGrid ? 'primary' : 'default'}
          >
            <GridIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Export/Save */}
      <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
        <Tooltip title="Save Design">
          <IconButton size="small" onClick={onSave} color="primary">
            <SaveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Export as Image">
          <IconButton size="small" onClick={onExport} color="success">
            <DownloadIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default Toolbar;
