/**
 * Utility functions for UnifiedMaker component
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Convert image URL to base64 (for reliable export)
 */
export const imageUrlToBase64 = async (url) => {
  try {
    // Use proxy endpoint for R2 images
    const proxyUrl = `${BACKEND_URL}/api/rest/images/proxy?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Could not convert to base64, using original URL:', error);
    return url; // Fall back to original URL
  }
};

/**
 * Generate unique ID for elements
 */
export const generateId = () => {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Calculate element bounds
 */
export const getElementBounds = (element) => {
  return {
    left: element.x,
    top: element.y,
    right: element.x + (element.width || 0),
    bottom: element.y + (element.height || 0),
    centerX: element.x + (element.width || 0) / 2,
    centerY: element.y + (element.height || 0) / 2
  };
};

/**
 * Check if point is inside element
 */
export const isPointInElement = (x, y, element) => {
  const bounds = getElementBounds(element);
  return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
};

/**
 * Snap value to grid
 */
export const snapToGrid = (value, gridSize = 10) => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Clone element with new ID
 */
export const cloneElement = (element) => {
  return {
    ...element,
    id: generateId(),
    x: element.x + 20,
    y: element.y + 20
  };
};

/**
 * Export canvas to image (requires html2canvas to be passed as parameter)
 */
export const exportCanvasToImage = async (canvasRef, html2canvasLib, filename = 'design.png') => {
  if (!canvasRef || !html2canvasLib) return null;
  
  try {
    const canvas = await html2canvasLib(canvasRef, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: false
    });
    
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (error) {
    console.error('Error exporting canvas:', error);
    throw error;
  }
};

/**
 * Download data URL as file
 */
export const downloadDataUrl = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
};

/**
 * Calculate resize handle position
 */
export const getResizeHandles = (element) => {
  const size = 8;
  const halfSize = size / 2;
  
  return {
    nw: { x: element.x - halfSize, y: element.y - halfSize, cursor: 'nw-resize' },
    n: { x: element.x + element.width / 2 - halfSize, y: element.y - halfSize, cursor: 'n-resize' },
    ne: { x: element.x + element.width - halfSize, y: element.y - halfSize, cursor: 'ne-resize' },
    e: { x: element.x + element.width - halfSize, y: element.y + element.height / 2 - halfSize, cursor: 'e-resize' },
    se: { x: element.x + element.width - halfSize, y: element.y + element.height - halfSize, cursor: 'se-resize' },
    s: { x: element.x + element.width / 2 - halfSize, y: element.y + element.height - halfSize, cursor: 's-resize' },
    sw: { x: element.x - halfSize, y: element.y + element.height - halfSize, cursor: 'sw-resize' },
    w: { x: element.x - halfSize, y: element.y + element.height / 2 - halfSize, cursor: 'w-resize' }
  };
};
