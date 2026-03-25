import React, { useState, useEffect, useCallback } from 'react';
import subscriptionIcon from "../../../../../assests/auth/subscriptionIcon.svg";
import "./payment.css";
import { 
    Button, Typography, Box, Card, CardContent, 
    Grid, Paper, Divider, CircularProgress, Alert,
    Chip
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useSnackbar } from '../../../../../hook/useSnackbar';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import axios from 'axios';
import { triggerCreditsRefresh } from '../../../../common/CreditsDisplay';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        if (window.Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

const Payment = (props) => {
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState('premium');
    const [loading, setLoading] = useState(false);
    const [fetchingPlans, setFetchingPlans] = useState(true);
    const [error, setError] = useState('');
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [creditsAdded, setCreditsAdded] = useState(0);
    const { displaySnackbar } = useSnackbar();
    const { accessToken } = useSelector((state) => state.login);

    // Fetch subscription plans on mount
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/api/rest/payments/plans`);
                setPlans(response.data.plans);
                setFetchingPlans(false);
            } catch (err) {
                setError('Failed to load subscription plans');
                setFetchingPlans(false);
                // Fallback plans
                setPlans([
                    { id: 'basic', name: 'Basic Plan', price: 499, credits: 100, features: ['100 Downloads', 'Basic Templates', 'Email Support'] },
                    { id: 'premium', name: 'Premium Plan', price: 999, credits: 500, features: ['500 Downloads', 'All Templates', 'Priority Support', 'No Watermarks'] },
                    { id: 'enterprise', name: 'Enterprise Plan', price: 2499, credits: 2000, features: ['Unlimited Downloads', 'All Features', '24/7 Support', 'Custom Branding', 'API Access'] }
                ]);
            }
        };
        fetchPlans();
    }, []);

    // Load Razorpay script on mount
    useEffect(() => {
        loadRazorpayScript();
    }, []);

    const verifyPayment = useCallback(async (paymentData) => {
        try {
            const response = await axios.post(
                `${BACKEND_URL}/api/rest/payments/razorpay/verify-payment`,
                paymentData,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            
            if (response.data.success) {
                setPaymentSuccess(true);
                setCreditsAdded(response.data.credits_added);
                displaySnackbar({ message: response.data.message });
                
                // Trigger real-time credits refresh across the app
                triggerCreditsRefresh();
            } else {
                setError(response.data.message || 'Payment verification failed');
                displaySnackbar({ message: 'Payment verification failed' });
            }
        } catch (err) {
            setError('Payment verification failed. Please contact support.');
            displaySnackbar({ message: 'Payment verification failed' });
        }
        setLoading(false);
    }, [accessToken, displaySnackbar]);

    const handlePayment = async () => {
        if (!selectedPlan) {
            displaySnackbar({ message: 'Please select a plan' });
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Load Razorpay script if not loaded
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                throw new Error('Failed to load Razorpay SDK');
            }

            // Create order on backend
            const orderResponse = await axios.post(
                `${BACKEND_URL}/api/rest/payments/razorpay/create-order`,
                { plan_type: selectedPlan },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            const { order_id, amount, currency, key_id, plan_name, user } = orderResponse.data;

            // Configure Razorpay options
            const options = {
                key: key_id,
                amount: amount,
                currency: currency,
                name: 'MySchool',
                description: `${plan_name} Subscription`,
                order_id: order_id,
                handler: function (response) {
                    // Payment successful - verify on backend
                    verifyPayment({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature
                    });
                },
                prefill: {
                    name: user?.name || '',
                    email: user?.email || '',
                    contact: user?.phone || ''
                },
                notes: {
                    plan_type: selectedPlan
                },
                theme: {
                    color: '#1976d2'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        displaySnackbar({ message: 'Payment cancelled' });
                    }
                }
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                setLoading(false);
                setError(`Payment failed: ${response.error.description}`);
                displaySnackbar({ message: 'Payment failed. Please try again.' });
            });
            razorpay.open();

        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Payment initialization failed.';
            setError(errorMsg);
            displaySnackbar({ message: 'Payment service error. Please try again.' });
            setLoading(false);
        }
    };

    const getSelectedPlan = () => plans.find(p => p.id === selectedPlan);

    if (fetchingPlans) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    // Show success message after payment
    if (paymentSuccess) {
        return (
            <Box className="paymentContainer" sx={{ p: 3 }}>
                <Card sx={{ maxWidth: 600, mx: 'auto', mt: 3, textAlign: 'center' }}>
                    <CardContent sx={{ py: 5 }}>
                        <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            Payment Successful!
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
                            {creditsAdded > 0 
                                ? `${creditsAdded} credits have been added to your account.`
                                : 'Your subscription is now active.'}
                        </Typography>
                        <Button 
                            variant="contained" 
                            size="large"
                            onClick={props.handleCancel}
                            sx={{ mt: 2 }}
                        >
                            Continue
                        </Button>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box className="paymentContainer" sx={{ p: 3 }}>
            <Card sx={{ maxWidth: 900, mx: 'auto', mt: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <img src={subscriptionIcon} alt="subscription" style={{ width: 48, height: 48, marginRight: 16 }} />
                        <Box>
                            <Typography variant="h5" fontWeight="bold">Subscription Plans</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Choose a plan to unlock premium features
                            </Typography>
                        </Box>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                    )}

                    <Divider sx={{ my: 2 }} />

                    {/* Subscription Plans */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {plans.map((plan) => (
                            <Grid item xs={12} md={4} key={plan.id}>
                                <Paper 
                                    elevation={selectedPlan === plan.id ? 8 : 1}
                                    sx={{ 
                                        p: 3, 
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        border: selectedPlan === plan.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        position: 'relative',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            borderColor: '#1976d2',
                                            transform: 'translateY(-4px)',
                                            boxShadow: 4
                                        }
                                    }}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    {plan.id === 'premium' && (
                                        <Chip 
                                            label="Most Popular" 
                                            color="primary" 
                                            size="small"
                                            sx={{ 
                                                position: 'absolute', 
                                                top: -12, 
                                                left: '50%', 
                                                transform: 'translateX(-50%)' 
                                            }}
                                        />
                                    )}
                                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                                        {plan.name}
                                    </Typography>
                                    <Typography variant="h3" color="primary" fontWeight="bold">
                                        ₹{plan.price}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                        {plan.credits} Credits
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Box sx={{ textAlign: 'left' }}>
                                        {plan.features.map((feature, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                                                <Typography variant="body2">{feature}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Selected Plan Summary */}
                    {getSelectedPlan() && (
                        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                            <Typography variant="subtitle2" color="text.secondary">Selected Plan</Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">{getSelectedPlan().name}</Typography>
                                <Typography variant="h5" color="primary" fontWeight="bold">
                                    ₹{getSelectedPlan().price}
                                </Typography>
                            </Box>
                        </Paper>
                    )}

                    {/* Pay Button */}
                    <Button 
                        variant="contained" 
                        fullWidth 
                        size="large"
                        onClick={handlePayment}
                        disabled={loading || !selectedPlan}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CreditCardIcon />}
                        sx={{ py: 1.5, fontSize: '1.1rem' }}
                    >
                        {loading ? 'Processing...' : `Pay ₹${getSelectedPlan()?.price || 0}`}
                    </Button>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                            Secure payment powered by Razorpay. Your payment information is encrypted.
                        </Typography>
                    </Box>

                    {/* Cancel Button */}
                    <Button 
                        variant="text" 
                        fullWidth 
                        sx={{ mt: 2 }}
                        onClick={props.handleCancel}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                </CardContent>
            </Card>
        </Box>
    );
};

export default Payment;
