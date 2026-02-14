import { useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../redux/authSlice';
import { useSnackbar } from './useSnackbar';

const IDLE_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours of inactivity

export const useSessionTimeout = () => {
  const dispatch = useDispatch();
  const { displaySnackbar } = useSnackbar();
  const { accessToken, tokenExpiry } = useSelector((state) => state.login);
  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  
  const handleLogout = useCallback(() => {
    dispatch(logoutUser());
    displaySnackbar({ message: 'Session expired. Please sign in again.' });
  }, [dispatch, displaySnackbar]);
  
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }
    
    if (accessToken) {
      // Show warning 5 minutes before logout
      warningTimerRef.current = setTimeout(() => {
        displaySnackbar({ message: 'Session will expire soon due to inactivity. Please interact with the page.' });
      }, IDLE_TIMEOUT - 5 * 60 * 1000);
      
      // Logout after idle timeout
      idleTimerRef.current = setTimeout(() => {
        handleLogout();
      }, IDLE_TIMEOUT);
    }
  }, [accessToken, handleLogout, displaySnackbar]);
  
  // Check token expiry
  useEffect(() => {
    if (!accessToken || !tokenExpiry) return;
    
    const checkTokenExpiry = () => {
      const now = Math.floor(Date.now() / 1000);
      if (tokenExpiry <= now) {
        handleLogout();
      }
    };
    
    // Check immediately and then every minute
    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 60000);
    
    return () => clearInterval(interval);
  }, [accessToken, tokenExpiry, handleLogout]);
  
  // Track user activity
  useEffect(() => {
    if (!accessToken) return;
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetIdleTimer();
    };
    
    // Initial timer
    resetIdleTimer();
    
    // Add event listeners
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [accessToken, resetIdleTimer]);
  
  return { resetIdleTimer };
};

export default useSessionTimeout;
