import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { TextField, Button, Paper, Typography, Snackbar, Alert } from '@mui/material';
const FooterHelp = () => {
  const [formData, setFormData] = useState({
    email: '',
    mobile: '',
    subject: '',
    message: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    setSnackbar({ open: true, message: 'Thank you for your message. We will get back to you soon!', severity: 'success' });
    setFormData({ email: '', mobile: '', subject: '', message: '' });
  };
  return (
    <div style={{ margin: isMobile ? '35px 10px' : 80 }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontFamily: 'Arial', color: '#000', marginBottom: '20px' }}>HELP & SUPPORT</h1>
        <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', marginBottom: '30px', lineHeight: '1.6' }}>
          Need help? We're here for you. Fill out the form below and our support team will get back to you as soon as possible.
        </p>
        <Paper elevation={2} style={{ padding: '30px', borderRadius: '12px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <TextField
                label="Email Address *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                fullWidth
                placeholder="Enter your email address"
              />
              <TextField
                label="Mobile Number"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleChange}
                fullWidth
                placeholder="+91 Enter mobile number"
              />
              <TextField
                label="Subject *"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                fullWidth
                placeholder="What do you need help with?"
              />
              <TextField
                label="Your Message *"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                fullWidth
                multiline
                rows={4}
                placeholder="Please describe your issue or question in detail..."
              />
              <Button 
                type="submit" 
                variant="contained"
                style={{ 
                  backgroundColor: '#1976d2', 
                  color: 'white',
                  padding: '12px 30px',
                  alignSelf: 'flex-start'
                }}
              >
                Submit
              </Button>
            </div>
          </form>
        </Paper>
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ fontSize: '19px', fontFamily: 'Arial', color: '#000', marginBottom: '15px' }}>Other Ways to Reach Us</h2>
          <p style={{ color: '#595959', fontSize: '14px', fontFamily: 'Arial', lineHeight: '1.6' }}>
            <strong>Email:</strong> info@myschool.in<br />
            <strong>Website:</strong> <a href="http://www.myschool.in" style={{ color: '#3030F1' }}>www.myschool.in</a>
          </p>
        </div>
      </div>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};
export default FooterHelp;
