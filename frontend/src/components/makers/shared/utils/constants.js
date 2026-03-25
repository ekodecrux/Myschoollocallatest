/**
 * Constants for UnifiedMaker component
 */

// Element Types
export const ELEMENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  RECTANGLE: 'rectangle',
  CIRCLE: 'circle',
  TRIANGLE: 'triangle',
  LINE: 'line',
  STAR: 'star',
  ARROW: 'arrow'
};

// Page Sizes
export const PAGE_SIZES = {
  'A3': { width: 842, height: 1191, label: 'A3 (297×420mm)' },
  'A4': { width: 595, height: 842, label: 'A4 (210×297mm)' },
  'A5': { width: 420, height: 595, label: 'A5 (148×210mm)' },
  'Letter': { width: 612, height: 792, label: 'Letter (8.5×11")' },
  'Square': { width: 600, height: 600, label: 'Square (600×600)' },
  'Social': { width: 1080, height: 1080, label: 'Social (1080×1080)' },
  'Custom': { width: 800, height: 600, label: 'Custom' }
};

// Color Presets
export const COLOR_PRESETS = [
  '#000000', '#ffffff', '#f44336', '#e91e63', '#9c27b0', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
  '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
];

// Font Families
export const FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana',
  'Trebuchet MS', 'Comic Sans MS', 'Impact', 'Courier New', 'Roboto'
];

// Image Bank Categories
export const IMAGE_BANK_CATEGORIES = [
  'ANIMALS', 'BIRDS', 'FRUITS', 'VEGETABLES', 'FLOWERS',
  'FESTIVALS', 'PROFESSIONS', 'VEHICLES', 'EXPRESSIONS',
  'GOOD MANNERS', 'HABITS', 'INSECTS', 'PLANTS', 'POLLUTION'
];

// Default element properties
export const DEFAULT_ELEMENT_PROPS = {
  text: {
    content: 'Enter text here',
    fontSize: 24,
    fontFamily: 'Arial',
    fill: '#000000',
    bold: false,
    italic: false,
    align: 'left',
    width: 200,
    height: 40
  },
  rectangle: {
    fill: '#2196f3',
    stroke: '#000000',
    strokeWidth: 1,
    width: 120,
    height: 80
  },
  circle: {
    fill: '#4caf50',
    stroke: '#000000',
    strokeWidth: 1,
    width: 80,
    height: 80
  },
  triangle: {
    fill: '#ff9800',
    stroke: '#000000',
    strokeWidth: 1,
    width: 100,
    height: 100
  },
  star: {
    fill: '#ffc107',
    stroke: '#000000',
    strokeWidth: 1,
    width: 100,
    height: 100
  },
  line: {
    stroke: '#000000',
    strokeWidth: 2,
    width: 150,
    height: 2
  },
  arrow: {
    stroke: '#000000',
    strokeWidth: 2,
    width: 150,
    height: 2
  },
  image: {
    width: 150,
    height: 150
  }
};
