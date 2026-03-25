import { useState, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Custom hook for template management (save/load designs)
 */
export const useTemplates = (accessToken, makerType) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/templates/${makerType}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      setTemplates(response.data || []);
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load templates');
    }
    setLoading(false);
  }, [accessToken, makerType]);

  // Save template
  const saveTemplate = useCallback(async (name, data) => {
    if (!accessToken) {
      setError('Please login to save designs');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/templates/`,
        {
          name,
          type: makerType,
          data
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      // Refresh templates list
      await fetchTemplates();
      return response.data;
    } catch (err) {
      console.error('Error saving template:', err);
      setError('Failed to save design');
      return null;
    } finally {
      setLoading(false);
    }
  }, [accessToken, makerType, fetchTemplates]);

  // Delete template
  const deleteTemplate = useCallback(async (templateId) => {
    if (!accessToken) return false;

    setLoading(true);
    setError(null);

    try {
      await axios.delete(
        `${BACKEND_URL}/api/templates/${templateId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      // Refresh templates list
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('Error deleting template:', err);
      setError('Failed to delete design');
      return false;
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchTemplates]);

  return {
    templates,
    loading,
    error,
    fetchTemplates,
    saveTemplate,
    deleteTemplate
  };
};

export default useTemplates;
