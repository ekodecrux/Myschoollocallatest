import { useState, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useSnackbar } from './useSnackbar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

/**
 * Custom hook for managing credits
 * Handles credit check and deduction for download, save, print actions
 */
export const useCredits = () => {
  const [loading, setLoading] = useState(false);
  const { accessToken, userRole } = useSelector((state) => state.login);
  const { displaySnackbar } = useSnackbar();

  /**
   * Check if user has enough credits and deduct if they do
   * @param {number} creditsToUse - Number of credits to use (default 1)
   * @param {string} actionType - Type of action: 'download', 'save', 'print'
   * @returns {Promise<{success: boolean, message: string}>}
   */
  const useCredits = useCallback(async (creditsToUse = 1, actionType = 'general') => {
    if (!accessToken) {
      return { success: false, message: 'Not authenticated' };
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/rest/users/useCredits`,
        { credits: creditsToUse, actionType },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      const data = response.data;

      if (data.success) {
        // Show warning if credits are low
        if (data.warningMessage) {
          displaySnackbar({ 
            message: data.warningMessage, 
            severity: data.warningLevel === 'critical' ? 'error' : 'warning' 
          });
        }
        return { success: true, remainingCredits: data.remainingCredits };
      } else {
        // Insufficient credits
        displaySnackbar({ 
          message: data.message, 
          severity: 'error' 
        });
        return { success: false, message: data.message, needsSubscription: data.needsSubscription };
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to process credits';
      displaySnackbar({ message: errorMessage, severity: 'error' });
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [accessToken, displaySnackbar]);

  /**
   * Check current credit balance
   * @returns {Promise<{credits: number, isUnlimited: boolean, warningLevel: string}>}
   */
  const checkCredits = useCallback(async () => {
    if (!accessToken) {
      return { credits: 0, isUnlimited: false };
    }

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/rest/users/checkCredits`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error checking credits:', error);
      return { credits: 0, isUnlimited: false };
    }
  }, [accessToken]);

  /**
   * Request to purchase credits (School Admin only)
   * @param {number} credits - Number of credits to request
   */
  const requestCredits = useCallback(async (credits) => {
    if (!accessToken) {
      return { success: false, message: 'Not authenticated' };
    }

    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/rest/users/purchaseCredits`,
        { credits },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      displaySnackbar({ message: response.data.message, severity: 'success' });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to submit credit request';
      displaySnackbar({ message: errorMessage, severity: 'error' });
      return { success: false, message: errorMessage };
    }
  }, [accessToken, displaySnackbar]);

  return {
    useCredits,
    checkCredits,
    requestCredits,
    loading
  };
};

export default useCredits;
