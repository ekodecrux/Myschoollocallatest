import React, { useEffect, useState } from "react";
import { Button, Card, Typography, Alert, Box, Chip, Paper, Divider, CircularProgress, Grid } from "@mui/material";
import EastIcon from "@mui/icons-material/East";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import { Data } from "./constant";
import "./Subscription.css";
import subscriptionIcon from "../../../../assests/auth/subscriptionIcon.svg";
import subfirst from "../../../../assests/auth/subfirst.png";
import subThird from "../../../../assests/auth/subThird.png";
import subfour from "../../../../assests/auth/subfour.png";
import { styled } from "@mui/material/styles";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import { DataGrid } from "@mui/x-data-grid";
import { columns } from './Tableconstant';
import Payment from "./payment/payment";
import { useSelector, useDispatch } from "react-redux";
import { MyProfile } from "../../../../redux/myProfileSlice";
import { RefreshToken } from "../../../../redux/authSlice";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ListUsers } from "../../../../redux/fetchUsersSlice"

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Subscription plans - synced with payment page
const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 499,
    credits: 100,
    color: '#5FCBF3',
    features: ['100 Downloads', 'Basic Templates', 'Email Support'],
    image: subfirst
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 999,
    credits: 500,
    color: '#98D74B',
    recommended: true,
    features: ['500 Downloads', 'All Templates', 'Priority Support', 'No Watermarks'],
    image: subThird
  },
  {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 2499,
    credits: 2000,
    color: '#F1564A',
    features: ['2000 Downloads', 'All Features', '24/7 Support', 'Custom Branding', 'API Access'],
    image: subfour
  }
];

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const Subscription = () => {
  const [subscription, setSubscription] = React.useState({});
  const [payment, setPayment] = React.useState(false);
  const [userData, setUserData] = React.useState({});
  const [canAccess, setCanAccess] = useState(null);
  const [accessMessage, setAccessMessage] = useState("");
  const [userCredits, setUserCredits] = useState(0);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { refreshToken, accessToken, tokenExpiry, userRole, usersList } = useSelector(
    (state) => state.login,
  );

  // Check if user can access subscription page and get current plan info
  useEffect(() => {
    const checkAccess = async () => {
      if (!accessToken) return;

      try {
        const response = await axios.get(`${BACKEND_URL}/api/rest/users/checkCredits`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { canAccessSubscription, isUnlimited, credits, registrationType, currentPlan: planInfo } = response.data;
        setUserCredits(credits);
        
        // Set current plan based on credits or plan info
        if (planInfo) {
          setCurrentPlan(planInfo);
        } else if (credits >= 2000) {
          setCurrentPlan('enterprise');
        } else if (credits >= 500) {
          setCurrentPlan('premium');
        } else if (credits >= 100) {
          setCurrentPlan('basic');
        }

        // Super Admin: Show subscription stats instead of payment page
        if (userRole === 'SUPER_ADMIN') {
          setCanAccess(true);
          return;
        }

        // School Admin: Can access subscription page
        if (userRole === 'SCHOOL_ADMIN') {
          setCanAccess(true);
          return;
        }

        // Students: Never show subscription page (Issue 23)
        if (userRole === 'STUDENT') {
          setCanAccess(false);
          setAccessMessage("Subscription plans are managed by your School or Teacher. Please contact them for credit requests.");
          return;
        }

        // Teachers: Only if self-registered (no school_code)
        if (canAccessSubscription) {
          setCanAccess(true);
        } else {
          setCanAccess(false);
          if (registrationType === 'school_onboarded') {
            setAccessMessage("Your subscription is managed by your School Admin. Please contact them for credit requests.");
          } else {
            setAccessMessage("Subscription access is not available for your account type.");
          }
        }
      } catch (e) {
        console.error("Error checking subscription access:", e);
        setCanAccess(true);
      }
    };
    checkAccess();
  }, [accessToken, userRole]);

  // Fetch subscription history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!accessToken) return;
      try {
        const response = await axios.get(`${BACKEND_URL}/api/rest/users/subscription-history`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.data.history) {
          setSubscriptionHistory(response.data.history);
        }
      } catch (e) {
        console.log("No subscription history available");
      }
    };
    fetchHistory();
  }, [accessToken]);

  const handlePayment = (plan) => {
    setSubscription({ amount: plan.price, name: plan.name, planId: plan.id });
    handleFetchUserDetails();
  };

  const handleFetchUserDetails = () => {
    let header = {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    let data = {};
    dispatch(
      MyProfile({
        headers: header,
        method: "GET",
        body: data,
      })
    ).then((res) => {
      if (res.payload.message === "Expired JWT") {
        dispatch(
          RefreshToken({
            headers: header,
            body: {
              refreshToken: refreshToken,
            },
          })
        ).then((res) => {
          header["Authorization"] = `Bearer ${res.payload.accessToken}`;
          dispatch(
            MyProfile({
              headers: header,
              method: "GET",
              body: data,
            })
          ).then((res) => {
            setUserData(res.payload);
          });
        });
      } else {
        setUserData(res.payload);
        setPayment(true);
      }
    });
  };

  // Get current plan details
  const getCurrentPlanDetails = () => {
    return SUBSCRIPTION_PLANS.find(p => p.id === currentPlan);
  };

  // Check if plan is an upgrade
  const isUpgrade = (planId) => {
    if (!currentPlan) return true;
    const planOrder = ['basic', 'premium', 'enterprise'];
    return planOrder.indexOf(planId) > planOrder.indexOf(currentPlan);
  };

  // Show loading state
  if (canAccess === null) {
    return (
      <div className="subscriptionpageMainContainer">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </div>
    );
  }

  // Show access denied message for unauthorized users
  if (canAccess === false) {
    return (
      <div className="subscriptionpageMainContainer">
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom>Subscription Not Available</Typography>
            <Typography>{accessMessage}</Typography>
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate('/auth')}
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </Box>
      </div>
    );
  }

  if (payment) {
    return (
      <div className="subscriptionpageMainContainer" style={{ gap: 0 }}>
        <Payment
          subscription={subscription}
          userData={userData}
          handleCancel={() => {
            setSubscription({});
            setPayment(false);
            // Refresh to show updated plan
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="subscriptionpageMainContainer">
        <div className="homeGutter" style={{ maxWidth: 20 }} />
        <div className="subscriptionContainer">
          <div className="subscriptionTxtContainer">
            <img src={subscriptionIcon} alt="" />
            <h2 className="SubscriptionTopHeading">Choose Your Subscription</h2>
          </div>

          {/* Current Plan Display - Issue 21: Added margin bottom to prevent overlap */}
          {currentPlan && (
            <Box sx={{ mb: 5, maxWidth: 800, mx: 'auto' }}>
              <Paper elevation={3} sx={{ p: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="overline" sx={{ opacity: 0.9 }}>Current Plan</Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StarIcon /> {getCurrentPlanDetails()?.name || 'Free Plan'}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                      {userCredits} credits remaining
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip 
                      label="Active" 
                      color="success" 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 'bold' }} 
                    />
                  </Box>
                </Box>
              </Paper>
            </Box>
          )}

          {/* Subscription Plans Grid - All 3 side by side using MUI Grid */}
          <Grid 
            container 
            spacing={3} 
            justifyContent="center" 
            alignItems="stretch"
            sx={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', paddingTop: '30px' }}
          >
            {SUBSCRIPTION_PLANS.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id} sx={{ overflow: 'visible' }}>
                <Card
                  sx={{
                    height: '100%',
                    p: 3,
                    pt: plan.recommended ? 4 : 3,
                    textAlign: 'center',
                    border: currentPlan === plan.id ? '3px solid #4CAF50' : '1px solid #e0e0e0',
                    borderRadius: 3,
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'visible',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  {plan.recommended && (
                    <Chip
                      label="Most Popular"
                      color="primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}
                    />
                  )}
                  {currentPlan === plan.id && (
                    <Chip
                      label="Current Plan"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 10,
                        right: 10,
                        fontWeight: 'bold'
                      }}
                    />
                  )}

                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mt: plan.recommended ? 2 : 0 }}>
                    {plan.name}
                  </Typography>

                  <Typography variant="h3" fontWeight="bold" sx={{ color: plan.color }}>
                    ₹{plan.price}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {plan.credits} Credits
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ textAlign: 'left', mb: 3, minHeight: 120, flex: '1 0 auto' }}>
                    {plan.features.map((feature, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CheckCircleIcon sx={{ color: 'success.main', mr: 1, fontSize: 18 }} />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, flex: '0 0 auto' }}>
                    <img src={plan.image} alt={plan.name} style={{ height: 80, objectFit: 'contain' }} />
                  </Box>

                  <Box sx={{ mt: 'auto' }}>
                    <Button
                      variant={currentPlan === plan.id ? "outlined" : "contained"}
                      fullWidth
                      sx={{
                        backgroundColor: currentPlan === plan.id ? 'transparent' : plan.color,
                        color: currentPlan === plan.id ? plan.color : 'white',
                        borderColor: plan.color,
                        fontWeight: 'bold',
                        py: 1.5,
                        '&:hover': {
                          backgroundColor: currentPlan === plan.id ? 'rgba(0,0,0,0.04)' : plan.color,
                          opacity: currentPlan === plan.id ? 1 : 0.85,
                          transform: 'scale(1.02)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                        },
                        '&:active': {
                          transform: 'scale(0.98)',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                      endIcon={<EastIcon />}
                      onClick={() => handlePayment(plan)}
                      disabled={currentPlan === plan.id}
                    >
                      {currentPlan === plan.id ? 'Current Plan' : isUpgrade(plan.id) ? 'Upgrade' : 'Select Plan'}
                    </Button>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>

          <div className="textContainer">
            <h2 fontSize="20px" className="headingSubscription">
              The One-Stop Learning Resource
            </h2>
            <h4 className="aboutSubscription">
              With MySchool membership, you get all this and a community of
              teachers, home schoolers, and <br />
              parents who share a common goal -- inspiring the next generation of
              learners.
            </h4>
          </div>

          <div className="renderCardMainContainer">
            {Data.map((item, index) => (
              <Card className="renderCard" key={index}>
                <Typography
                  className="insideCardText"
                  fontSize="21px"
                  paddingTop="20px"
                  paddingLeft="12px"
                  paddingBottom="20px"
                >
                  {<img src={item.image} className="starImage" />} {item.tittle}
                </Typography>
              </Card>
            ))}
          </div>

          {/* Subscription History (if available) */}
          {subscriptionHistory.length > 0 && (
            <Box sx={{ mt: 4, maxWidth: 800, mx: 'auto' }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Subscription History
              </Typography>
              <Paper sx={{ p: 2 }}>
                {subscriptionHistory.slice(0, 5).map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: idx < subscriptionHistory.length - 1 ? '1px solid #eee' : 'none' }}>
                    <Typography variant="body2">{item.plan_name}</Typography>
                    <Typography variant="body2" color="text.secondary">₹{item.amount}</Typography>
                    <Typography variant="body2" color="text.secondary">{new Date(item.date).toLocaleDateString()}</Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}
        </div>
        <div className="homeGutter" style={{ maxWidth: 20 }} />
      </div>
    </div>
  );
};

export default Subscription;
