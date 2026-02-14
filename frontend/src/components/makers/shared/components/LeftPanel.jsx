import React, { useState } from 'react';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  TextField,
  Grid,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  TextFields as TextIcon,
  Image as ImageIcon,
  CropSquare as RectIcon,
  RadioButtonUnchecked as CircleIcon,
  ChangeHistory as TriangleIcon,
  Star as StarIcon,
  Remove as LineIcon,
  ArrowRightAlt as ArrowIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { ELEMENT_TYPES, COLOR_PRESETS } from '../utils/constants';

const LeftPanel = ({
  activeTab,
  onTabChange,
  onAddElement,
  imageBankImages,
  imageBankLoading,
  imageBankSearch,
  onImageBankSearchChange,
  onAddImageFromBank
}) => {
  const [selectedCategory, setSelectedCategory] = useState('ANIMALS');

  const categories = [
    'ANIMALS', 'BIRDS', 'FRUITS', 'VEGETABLES', 'FLOWERS',
    'FESTIVALS', 'PROFESSIONS', 'VEHICLES', 'EXPRESSIONS'
  ];

  const shapeButtons = [
    { type: ELEMENT_TYPES.TEXT, icon: <TextIcon />, label: 'Text' },
    { type: ELEMENT_TYPES.RECTANGLE, icon: <RectIcon />, label: 'Rectangle' },
    { type: ELEMENT_TYPES.CIRCLE, icon: <CircleIcon />, label: 'Circle' },
    { type: ELEMENT_TYPES.TRIANGLE, icon: <TriangleIcon />, label: 'Triangle' },
    { type: ELEMENT_TYPES.STAR, icon: <StarIcon />, label: 'Star' },
    { type: ELEMENT_TYPES.LINE, icon: <LineIcon />, label: 'Line' },
    { type: ELEMENT_TYPES.ARROW, icon: <ArrowIcon />, label: 'Arrow' }
  ];

  return (
    <Paper sx={{ width: 250, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <Tabs
        value={activeTab}
        onChange={(e, v) => onTabChange(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Elements" />
        <Tab label="Upload" />
        <Tab label="Image Bank" />
      </Tabs>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {/* Elements Tab */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Shapes & Text</Typography>
            <Grid container spacing={1}>
              {shapeButtons.map((btn) => (
                <Grid item xs={6} key={btn.type}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={btn.icon}
                    onClick={() => onAddElement(btn.type)}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                  >
                    {btn.label}
                  </Button>
                </Grid>
              ))}
            </Grid>

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Quick Colors</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {COLOR_PRESETS.slice(0, 12).map((color) => (
                <Box
                  key={color}
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: color,
                    border: '1px solid #ddd',
                    borderRadius: 0.5,
                    cursor: 'pointer'
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Upload Tab */}
        {activeTab === 1 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Upload Image</Typography>
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              id="image-upload-input"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    onAddElement(ELEMENT_TYPES.IMAGE, { src: event.target?.result });
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <label htmlFor="image-upload-input">
              <Button
                variant="contained"
                component="span"
                fullWidth
                startIcon={<ImageIcon />}
              >
                Choose Image
              </Button>
            </label>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Supported: JPG, PNG, GIF
            </Typography>
          </Box>
        )}

        {/* Image Bank Tab */}
        {activeTab === 2 && (
          <Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Search images..."
              value={imageBankSearch}
              onChange={(e) => onImageBankSearchChange(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" gutterBottom>Categories</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  size="small"
                  variant={selectedCategory === cat ? 'contained' : 'outlined'}
                  onClick={() => {
                    setSelectedCategory(cat);
                    onImageBankSearchChange(cat);
                  }}
                  sx={{ fontSize: '0.65rem', py: 0.25, px: 1 }}
                >
                  {cat}
                </Button>
              ))}
            </Box>

            {imageBankLoading ? (
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Grid container spacing={1}>
                {imageBankImages.slice(0, 20).map((img, idx) => (
                  <Grid item xs={4} key={idx}>
                    <Box
                      onClick={() => onAddImageFromBank(img)}
                      sx={{
                        width: '100%',
                        paddingTop: '100%',
                        position: 'relative',
                        cursor: 'pointer',
                        border: '1px solid #ddd',
                        borderRadius: 1,
                        overflow: 'hidden',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                    >
                      <img
                        src={img}
                        alt=""
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LeftPanel;
