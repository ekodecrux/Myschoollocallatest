import React from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Button
} from '@mui/material';
import {
  FormatBold as BoldIcon,
  FormatItalic as ItalicIcon,
  FormatUnderlined as UnderlineIcon,
  FormatAlignLeft as AlignLeftIcon,
  FormatAlignCenter as AlignCenterIcon,
  FormatAlignRight as AlignRightIcon
} from '@mui/icons-material';
import { FONTS, COLOR_PRESETS } from '../utils/constants';

const RightPanel = ({
  selectedElement,
  onUpdateElement,
  pageSize,
  pageSizes,
  onPageSizeChange,
  backgroundColor,
  onBackgroundColorChange
}) => {
  if (!selectedElement) {
    return (
      <Paper sx={{ width: 280, height: '100%', overflow: 'auto', p: 2 }}>
        <Typography variant="subtitle2" gutterBottom>Canvas Settings</Typography>
        
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Page Size</InputLabel>
          <Select
            value={pageSize}
            label="Page Size"
            onChange={(e) => onPageSizeChange(e.target.value)}
          >
            {Object.entries(pageSizes).map(([key, value]) => (
              <MenuItem key={key} value={key}>{value.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography variant="caption" gutterBottom>Background Color</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {['#ffffff', '#f5f5f5', '#e3f2fd', '#fff3e0', '#fce4ec', '#e8f5e9'].map((color) => (
            <Box
              key={color}
              onClick={() => onBackgroundColorChange(color)}
              sx={{
                width: 28,
                height: 28,
                bgcolor: color,
                border: backgroundColor === color ? '2px solid #1976d2' : '1px solid #ddd',
                borderRadius: 0.5,
                cursor: 'pointer'
              }}
            />
          ))}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Select an element on the canvas to edit its properties.
        </Typography>
      </Paper>
    );
  }

  const { type } = selectedElement;
  const isText = type === 'text';
  const isShape = ['rectangle', 'circle', 'triangle', 'star'].includes(type);
  const isLine = ['line', 'arrow'].includes(type);

  return (
    <Paper sx={{ width: 280, height: '100%', overflow: 'auto', p: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        {type.charAt(0).toUpperCase() + type.slice(1)} Properties
      </Typography>

      {/* Position & Size */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">Position & Size</Typography>
        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <TextField
            size="small"
            label="X"
            type="number"
            value={Math.round(selectedElement.x || 0)}
            onChange={(e) => onUpdateElement({ x: parseInt(e.target.value) || 0 })}
            sx={{ width: '50%' }}
          />
          <TextField
            size="small"
            label="Y"
            type="number"
            value={Math.round(selectedElement.y || 0)}
            onChange={(e) => onUpdateElement({ y: parseInt(e.target.value) || 0 })}
            sx={{ width: '50%' }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <TextField
            size="small"
            label="Width"
            type="number"
            value={Math.round(selectedElement.width || 0)}
            onChange={(e) => onUpdateElement({ width: parseInt(e.target.value) || 0 })}
            sx={{ width: '50%' }}
          />
          <TextField
            size="small"
            label="Height"
            type="number"
            value={Math.round(selectedElement.height || 0)}
            onChange={(e) => onUpdateElement({ height: parseInt(e.target.value) || 0 })}
            sx={{ width: '50%' }}
          />
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Rotation */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">Rotation: {selectedElement.rotation || 0}°</Typography>
        <Slider
          value={selectedElement.rotation || 0}
          onChange={(e, v) => onUpdateElement({ rotation: v })}
          min={0}
          max={360}
          step={1}
          size="small"
        />
      </Box>

      {/* Text-specific properties */}
      {isText && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">Text Settings</Typography>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Content"
            value={selectedElement.content || ''}
            onChange={(e) => onUpdateElement({ content: e.target.value })}
            sx={{ mt: 1, mb: 1 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 1 }}>
            <InputLabel>Font</InputLabel>
            <Select
              value={selectedElement.fontFamily || 'Arial'}
              label="Font"
              onChange={(e) => onUpdateElement({ fontFamily: e.target.value })}
            >
              {FONTS.map((font) => (
                <MenuItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            size="small"
            label="Font Size"
            type="number"
            value={selectedElement.fontSize || 24}
            onChange={(e) => onUpdateElement({ fontSize: parseInt(e.target.value) || 24 })}
            sx={{ mb: 1 }}
          />

          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <ToggleButtonGroup size="small">
              <ToggleButton
                value="bold"
                selected={selectedElement.bold}
                onChange={() => onUpdateElement({ bold: !selectedElement.bold })}
              >
                <BoldIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton
                value="italic"
                selected={selectedElement.italic}
                onChange={() => onUpdateElement({ italic: !selectedElement.italic })}
              >
                <ItalicIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton
                value="underline"
                selected={selectedElement.underline}
                onChange={() => onUpdateElement({ underline: !selectedElement.underline })}
              >
                <UnderlineIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>

            <ToggleButtonGroup
              size="small"
              exclusive
              value={selectedElement.align || 'left'}
              onChange={(e, v) => v && onUpdateElement({ align: v })}
            >
              <ToggleButton value="left"><AlignLeftIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="center"><AlignCenterIcon fontSize="small" /></ToggleButton>
              <ToggleButton value="right"><AlignRightIcon fontSize="small" /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </>
      )}

      {/* Color properties for shapes and text */}
      {(isShape || isText || isLine) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">Colors</Typography>
          
          {(isShape || isText) && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="caption">Fill Color</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {COLOR_PRESETS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => onUpdateElement({ fill: color })}
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: color,
                      border: selectedElement.fill === color ? '2px solid #1976d2' : '1px solid #ddd',
                      borderRadius: 0.5,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {(isShape || isLine) && (
            <Box sx={{ mt: 1, mb: 1 }}>
              <Typography variant="caption">Stroke Color</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {COLOR_PRESETS.map((color) => (
                  <Box
                    key={color}
                    onClick={() => onUpdateElement({ stroke: color })}
                    sx={{
                      width: 24,
                      height: 24,
                      bgcolor: color,
                      border: selectedElement.stroke === color ? '2px solid #1976d2' : '1px solid #ddd',
                      borderRadius: 0.5,
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {(isShape || isLine) && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption">Stroke Width: {selectedElement.strokeWidth || 1}px</Typography>
              <Slider
                value={selectedElement.strokeWidth || 1}
                onChange={(e, v) => onUpdateElement({ strokeWidth: v })}
                min={0}
                max={10}
                step={1}
                size="small"
              />
            </Box>
          )}
        </>
      )}

      {/* Opacity */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        Opacity: {Math.round((selectedElement.opacity || 1) * 100)}%
      </Typography>
      <Slider
        value={(selectedElement.opacity || 1) * 100}
        onChange={(e, v) => onUpdateElement({ opacity: v / 100 })}
        min={10}
        max={100}
        step={5}
        size="small"
      />
    </Paper>
  );
};

export default RightPanel;
