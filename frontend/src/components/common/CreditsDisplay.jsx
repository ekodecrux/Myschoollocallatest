import React, { useState, useEffect, useCallback } from 'react';
import { Chip, Tooltip, CircularProgress } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { useSelector } from 'react-redux';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const CreditsDisplay = ({ showLabel = true, size = 'medium', refreshInterval = 30000 }) => {
    const [credits, setCredits] = useState(null);
    const [isUnlimited, setIsUnlimited] = useState(false);
    const [loading, setLoading] = useState(true);
    const { accessToken, userRole } = useSelector((state) => state.login);

    const fetchCredits = useCallback(async () => {
        if (!accessToken) return;
        
        try {
            const response = await axios.get(`${BACKEND_URL}/api/rest/payments/user/credits`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            
            setCredits(response.data.credits);
            setIsUnlimited(response.data.isUnlimited);
        } catch (error) {
            console.error('Error fetching credits:', error);
        } finally {
            setLoading(false);
        }
    }, [accessToken]);

    // Initial fetch
    useEffect(() => {
        fetchCredits();
    }, [fetchCredits]);

    // Refresh credits periodically for real-time updates
    useEffect(() => {
        if (!accessToken || refreshInterval <= 0) return;
        
        const interval = setInterval(fetchCredits, refreshInterval);
        return () => clearInterval(interval);
    }, [accessToken, refreshInterval, fetchCredits]);

    // Listen for custom credit update events
    useEffect(() => {
        const handleCreditUpdate = () => {
            fetchCredits();
        };
        
        window.addEventListener('creditsUpdated', handleCreditUpdate);
        return () => window.removeEventListener('creditsUpdated', handleCreditUpdate);
    }, [fetchCredits]);

    // Don't show for certain roles
    if (userRole === 'SUPER_ADMIN') {
        return (
            <Tooltip title="Unlimited Credits">
                <Chip
                    icon={<AllInclusiveIcon />}
                    label={showLabel ? "Unlimited" : "∞"}
                    color="primary"
                    size={size}
                    variant="outlined"
                />
            </Tooltip>
        );
    }

    if (loading) {
        return <CircularProgress size={20} />;
    }

    if (credits === null) {
        return null;
    }

    // Determine color based on credits level
    const getColor = () => {
        if (isUnlimited) return 'primary';
        if (credits <= 0) return 'error';
        if (credits <= 10) return 'error';
        if (credits <= 25) return 'warning';
        return 'success';
    };

    const getTooltip = () => {
        if (isUnlimited) return 'Unlimited Credits';
        if (credits <= 0) return 'No credits remaining! Purchase more to continue.';
        if (credits <= 10) return 'Credits running low! Consider purchasing more.';
        if (credits <= 25) return 'Credits getting low.';
        return `${credits} credits available`;
    };

    return (
        <Tooltip title={getTooltip()}>
            <Chip
                icon={isUnlimited ? <AllInclusiveIcon /> : <AccountBalanceWalletIcon />}
                label={isUnlimited ? (showLabel ? "Unlimited" : "∞") : `${credits} ${showLabel ? 'Credits' : ''}`}
                color={getColor()}
                size={size}
                variant={credits <= 10 && !isUnlimited ? "filled" : "outlined"}
                sx={{ 
                    fontWeight: 'bold',
                    cursor: 'pointer'
                }}
            />
        </Tooltip>
    );
};

// Helper function to trigger credit refresh from anywhere in the app
export const triggerCreditsRefresh = () => {
    window.dispatchEvent(new CustomEvent('creditsUpdated'));
};

export default CreditsDisplay;
