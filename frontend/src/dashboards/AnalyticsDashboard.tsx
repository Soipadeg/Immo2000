// frontend/src/dashboards/AnalyticsDashboard.tsx

import React, { useEffect, useState } from 'react';
import {
  Card,
  Grid,
  LineChart,
  BarChart,
  PieChart,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { getApiClient } from '../api/client';

interface MetricData {
  totalUsers: number;
  activeUsers: number;
  totalListings: number;
  totalMessages: number;
  signupConversion: number;
  listingConversion: number;
}

interface TimeSeriesData {
  date: string;
  value: number;
}

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricData>({
    totalUsers: 0,
    activeUsers: 0,
    totalListings: 0,
    totalMessages: 0,
    signupConversion: 0,
    listingConversion: 0,
  });

  const [userGrowth, setUserGrowth] = useState<TimeSeriesData[]>([]);
  const [conversionData, setConversionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const api = getApiClient();

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [metricsRes, growthRes, conversionRes] = await Promise.all([
        api.get('/analytics/metrics'),
        api.get('/analytics/user-growth'),
        api.get('/analytics/conversion'),
      ]);

      setMetrics(metricsRes.data);
      setUserGrowth(growthRes.data);
      setConversionData(conversionRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom>
              Total Users
            </Typography>
            <Typography variant="h4">{metrics.totalUsers.toLocaleString()}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom>
              Active Users (24h)
            </Typography>
            <Typography variant="h4">{metrics.activeUsers.toLocaleString()}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom>
              Total Listings
            </Typography>
            <Typography variant="h4">{metrics.totalListings.toLocaleString()}</Typography>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ p: 2 }}>
            <Typography color="textSecondary" gutterBottom>
              Total Messages
            </Typography>
            <Typography variant="h4">{metrics.totalMessages.toLocaleString()}</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Growth (Last 30 Days)
            </Typography>
            <LineChart width={500} height={300} data={userGrowth} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Conversion Funnels
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Funnel</TableCell>
                  <TableCell align="right">Conversion %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {conversionData.map((row) => (
                  <TableRow key={row.funnel}>
                    <TableCell>{row.funnel}</TableCell>
                    <TableCell align="right">{row.conversion.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
