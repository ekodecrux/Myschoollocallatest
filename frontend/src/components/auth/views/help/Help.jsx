import React, { useState } from "react";
import MSTextField from "../../../../customTheme/textField/MSTextField";
import { Button, Paper, Typography, Snackbar, Alert, CircularProgress } from "@mui/material";
import helpIcon from "../../../../assests/auth/helpIcon.svg";
import "../../../../components/auth/views/student/addNewStudent/AddNewStudent.css";
import "./Help.css";
import { useSelector } from "react-redux";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Help = () => {
    const { accessToken, userData } = useSelector((state) => state.login);
    const [formData, setFormData] = useState({
        email: userData?.email || '',
        mobile: userData?.mobileNumber || '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.subject.trim()) {
            setSnackbar({ open: true, message: 'Please enter a subject', severity: 'error' });
            return;
        }
        if (!formData.message.trim() || formData.message.trim().length < 10) {
            setSnackbar({ open: true, message: 'Please enter a message (at least 10 characters)', severity: 'error' });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(
                `${BACKEND_URL}/api/rest/support/submit`,
                {
                    subject: formData.subject,
                    message: formData.message,
                    category: 'general'
                },
                {
                    headers: { Authorization: `Bearer ${accessToken}` }
                }
            );
            
            setSnackbar({ 
                open: true, 
                message: response.data.message || 'Support request submitted successfully!', 
                severity: 'success' 
            });
            
            // Clear form
            setFormData(prev => ({ ...prev, subject: '', message: '' }));
        } catch (error) {
            setSnackbar({ 
                open: true, 
                message: error.response?.data?.detail || 'Failed to submit support request', 
                severity: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="addStudentManinContainer">
            <div className="addStudentContainer">
                <div className="addStudentHeaderTxtContainer">
                    <img src={helpIcon} alt="help icon" />
                    <Typography fontSize="15px" fontWeight="bold">
                        Help & Support
                    </Typography>
                </div>
            </div>
            <form className="addNewSchoolContainer" onSubmit={handleSubmit}>
                <Paper
                    elevation={0}
                    className="AddFormContainer"
                    style={{ backgroundColor: "white" }}
                >
                    <div className="addTextfieldContainer">
                        <div className="AddStudentTextFieldContainer">
                            <MSTextField
                                id="helpEmail"
                                type="text"
                                placeholder="Enter email id"
                                label="* Email ID"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                disabled
                            />
                            <MSTextField
                                id="helpMobile"
                                type="text"
                                placeholder="+91 Enter mobile number"
                                label="* Mobile Number"
                                value={formData.mobile}
                                onChange={(e) => handleChange('mobile', e.target.value)}
                                disabled
                            />
                            <MSTextField
                                id="helpSubject"
                                type="text"
                                placeholder="Enter subject"
                                label="* Subject"
                                value={formData.subject}
                                onChange={(e) => handleChange('subject', e.target.value)}
                            />
                        </div>
                        <div className="AddStudentTextFieldContainer">
                            <MSTextField
                                id="helpMessage"
                                type="text"
                                placeholder="Enter your message here... (min 10 characters)"
                                label="* Your Message"
                                value={formData.message}
                                onChange={(e) => handleChange('message', e.target.value)}
                                multiline
                                rows={4}
                            />
                        </div>
                        <div className="submitBtnContainer">
                            <Button 
                                type="submit"
                                style={{ backgroundColor: loading ? "#ccc" : "#B3DAFF" }} 
                                className="saveDataBtn"
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={20} /> : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </Paper>
            </form>
            
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={6000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default Help;
