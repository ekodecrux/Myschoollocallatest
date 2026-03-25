import { useState, useCallback } from 'react';
import { generateId } from '../utils/helpers';
import { DEFAULT_ELEMENT_PROPS } from '../utils/constants';

/**
 * Custom hook for managing canvas elements
 */
export const useCanvasElements = (initialElements = []) => {
  const [elements, setElements] = useState(initialElements);
  const [selectedId, setSelectedId] = useState(null);

  // Add element
  const addElement = useCallback((type, props = {}) => {
    const defaults = DEFAULT_ELEMENT_PROPS[type] || {};
    const newElement = {
      id: generateId(),
      type,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      rotation: 0,
      locked: false,
      ...defaults,
      ...props
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    return newElement;
  }, []);

  // Update element
  const updateElement = useCallback((id, updates) => {
    setElements(prev => 
      prev.map(el => el.id === id ? { ...el, ...updates } : el)
    );
  }, []);

  // Delete element
  const deleteElement = useCallback((id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  // Duplicate element
  const duplicateElement = useCallback((id) => {
    const element = elements.find(el => el.id === id);
    if (!element) return null;
    
    const newElement = {
      ...element,
      id: generateId(),
      x: element.x + 20,
      y: element.y + 20
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedId(newElement.id);
    return newElement;
  }, [elements]);

  // Move element to front
  const bringToFront = useCallback((id) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      return [...prev.filter(el => el.id !== id), element];
    });
  }, []);

  // Move element to back
  const sendToBack = useCallback((id) => {
    setElements(prev => {
      const element = prev.find(el => el.id === id);
      if (!element) return prev;
      return [element, ...prev.filter(el => el.id !== id)];
    });
  }, []);

  // Clear all elements
  const clearAll = useCallback(() => {
    setElements([]);
    setSelectedId(null);
  }, []);

  // Get selected element
  const selectedElement = elements.find(el => el.id === selectedId);

  return {
    elements,
    setElements,
    selectedId,
    setSelectedId,
    selectedElement,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    clearAll
  };
};

export default useCanvasElements;
