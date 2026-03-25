import * as React from "react";
import { useState, useEffect } from "react";
import { Button, MenuItem, Select, Typography, Card, Box, TextField, Grid, Paper, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from "@mui/material";
import { useSelector } from "react-redux";
import axios from "axios";
import './analytics.css';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import DownloadIcon from '@mui/icons-material/Download';
import HistoryIcon from '@mui/icons-material/History';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const StatCard = ({ title, value, icon, color, subtitle }) => (
    <Card sx={{ p: 2, height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
                <Typography variant="subtitle2" color="text.secondary">{title}</Typography>
                <Typography variant="h4">{value}</Typography>
                {subtitle && <Typography variant="caption" color={color}>{subtitle}</Typography>}
            </Box>
            <Box sx={{ color: color, opacity: 0.8 }}>{icon}</Box>
        </Box>
    </Card>
);

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [userLogs, setUserLogs] = useState([]);
    const [logStats, setLogStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const { accessToken, userRole } = useSelector((state) => state.login);
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    useEffect(() => {
        const fetchData = async () => {
            if (!accessToken) return;
            try {
                setLoading(true);
                
                // Fetch dashboard stats
                const statsResponse = await axios.get(`${BACKEND_URL}/api/admin/dashboard-stats`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setStats(statsResponse.data);

                // Fetch recent user logs
                const logsResponse = await axios.get(`${BACKEND_URL}/api/admin/user-logs?limit=10`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setUserLogs(logsResponse.data.logs || []);

                // Fetch log stats
                const logStatsResponse = await axios.get(`${BACKEND_URL}/api/admin/user-logs/stats`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setLogStats(logStatsResponse.data);

            } catch (error) {
                console.error('Error fetching analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [accessToken]);

    const getActionColor = (action) => {
        const colors = { login: 'success', logout: 'default', download: 'primary', upload: 'secondary' };
        return colors[action] || 'default';
    };

    if (loading) {
        return (
            <Box className="analyticsContainer" sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '60vh',
                width: '100%'
            }}>
                <CircularProgress size={50} />
            </Box>
        );
    }

    return (
        <Box className="analyticsContainer" sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                {isSuperAdmin ? 'Analytics Dashboard' : 'School Analytics Dashboard'}
            </Typography>
            
            {/* Main Stats */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {isSuperAdmin && (
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Schools"
                            value={stats?.totalSchools || 0}
                            icon={<SchoolIcon sx={{ fontSize: 40 }} />}
                            color="#1976d2"
                        />
                    </Grid>
                )}
                <Grid item xs={12} sm={6} md={isSuperAdmin ? 3 : 4}>
                    <StatCard
                        title={isSuperAdmin ? "Total Teachers" : "School Teachers"}
                        value={stats?.totalTeachers || 0}
                        icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                        color="#2e7d32"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={isSuperAdmin ? 3 : 4}>
                    <StatCard
                        title={isSuperAdmin ? "Total Students" : "School Students"}
                        value={stats?.totalStudents || 0}
                        icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                        color="#ed6c02"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={isSuperAdmin ? 3 : 4}>
                    <StatCard
                        title="Total Downloads"
                        value={stats?.totalDownloads || 0}
                        icon={<DownloadIcon sx={{ fontSize: 40 }} />}
                        color="#9c27b0"
                    />
                </Grid>
            </Grid>

            {/* Activity Stats */}
            <Typography variant="h6" sx={{ mb: 2 }}>Today's Activity</Typography>
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Logins"
                        value={logStats?.todayLogins || 0}
                        icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
                        color="#00bcd4"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Today's Downloads"
                        value={logStats?.todayDownloads || 0}
                        icon={<DownloadIcon sx={{ fontSize: 40 }} />}
                        color="#ff9800"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Active Users (24h)"
                        value={logStats?.activeUsers || 0}
                        icon={<PeopleIcon sx={{ fontSize: 40 }} />}
                        color="#4caf50"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Actions"
                        value={logStats?.totalActions || 0}
                        icon={<HistoryIcon sx={{ fontSize: 40 }} />}
                        color="#607d8b"
                    />
                </Grid>
            </Grid>

            {/* Recent Activity Logs */}
            <Typography variant="h6" sx={{ mb: 2 }}>Recent Activity</Typography>
            <TableContainer component={Paper}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>User</TableCell>
                            <TableCell>Action</TableCell>
                            <TableCell>Details</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {userLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">No recent activity</TableCell>
                            </TableRow>
                        ) : (
                            userLogs.map((log, idx) => (
                                <TableRow key={idx}>
                                    <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{log.user_name || 'Unknown'}</Typography>
                                        <Typography variant="caption" color="text.secondary">{log.user_email}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Chip label={log.action} size="small" color={getActionColor(log.action)} />
                                    </TableCell>
                                    <TableCell>{log.details || '-'}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
export default Analytics;
