import { useState, useCallback } from 'react';

/**
 * Custom hook for undo/redo functionality
 */
export const useHistory = (maxHistory = 50) => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Push state to history
  const pushState = useCallback((state) => {
    setHistory(prev => {
      // Remove any future states if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      // Add new state
      newHistory.push(JSON.stringify(state));
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [historyIndex, maxHistory]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      return JSON.parse(history[historyIndex - 1]);
    }
    return null;
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      return JSON.parse(history[historyIndex + 1]);
    }
    return null;
  }, [history, historyIndex]);

  // Check if can undo/redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Reset history
  const resetHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  return {
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    resetHistory,
    historyIndex,
    historyLength: history.length
  };
};

export default useHistory;
