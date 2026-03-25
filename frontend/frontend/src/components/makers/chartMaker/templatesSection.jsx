import React, { useState, useEffect } from 'react';
import { Typography, Box, Paper, Grid, Card, CardContent, Pagination, Stack, CircularProgress } from '@mui/material';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const TemplatesPanel = ({ store }) => {
  const location = useLocation();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const makerType = location.pathname.split("/")[4];
  const { isLoggedin, accessToken } = useSelector((state) => state.login);

  useEffect(() => {
    let isMounted = true;
    
    const fetchTemplates = async () => {
      if (!isLoggedin || !accessToken) {
        if (isMounted) setTemplates([]);
        return;
      }
      if (isMounted) setLoading(true);
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/rest/templates/list?makerType=${makerType}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (response.ok && isMounted) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      } catch (error) {
        console.error('Error loading templates:', error);
      }
      if (isMounted) setLoading(false);
    };
    
    fetchTemplates();
    
    return () => { isMounted = false; };
  }, [isLoggedin, accessToken, makerType]);

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box sx={{ p: 2, height: '92%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h6" gutterBottom>Templates</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : templates.length === 0 ? (
        <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 4 }}>
          {isLoggedin ? 'No templates saved yet' : 'Login to view saved templates'}
        </Typography>
      ) : (
        <>
          <Grid container spacing={2} sx={{ flex: 1, overflow: 'auto' }}>
            {templates.slice((page - 1) * 4, page * 4).map((template) => (
              <Grid item xs={6} key={template.id}>
                <Card sx={{ cursor: 'pointer' }}>
                  <CardContent sx={{ py: 1, px: 1.5 }}>
                    <Typography variant="body2" noWrap fontWeight={template.isSystem ? 500 : 400}>
                      {template.name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {template.isSystem ? 'System' : template.pageSize || 'A4'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {templates.length > 4 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Stack spacing={1}>
                <Pagination
                  count={Math.ceil(templates.length / 4)}
                  variant="outlined"
                  size="small"
                  shape="rounded"
                  page={page}
                  onChange={handlePageChange}
                />
              </Stack>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
// define the new custom section
export const TemplatesSection = {
  name: 'custom-templates',
  Tab: (props) => (
    <Paper sx={{ p: 1, cursor: 'pointer' }} {...props}>
      <Typography>Templates</Typography>
    </Paper>
  ),
  Panel: TemplatesPanel,
};
