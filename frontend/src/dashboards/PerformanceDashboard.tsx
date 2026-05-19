// frontend/src/dashboards/PerformanceDashboard.tsx

import React, { useEffect, useState } from 'react';
import {
  Card,
  Grid,
  LinearProgress,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { getApiClient } from '../api/client';

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  threshold: number;
}

interface ApiEndpoint {
  path: string;
  method: string;
  count: number;
  avgTime: number;
  p95Time: number;
  errorRate: number;
}

export const PerformanceDashboard: React.FC = () => {
  const [webVitals, setWebVitals] = useState<WebVital[]>([]);
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const api = getApiClient();

  useEffect(() => {
    loadPerformanceMetrics();
    const interval = setInterval(loadPerformanceMetrics, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceMetrics = async () => {
    try {
      setLoading(true);
      const [vitalsRes, endpointsRes] = await Promise.all([
        api.get('/analytics/web-vitals'),
        api.get('/analytics/api-endpoints'),
      ]);

      setWebVitals(vitalsRes.data);
      setEndpoints(endpointsRes.data);
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'success';
      case 'needs-improvement':
        return 'warning';
      case 'poor':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Performance Dashboard
      </Typography>

      {/* Web Vitals */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Core Web Vitals
            </Typography>

            <Grid container spacing={2}>
              {webVitals.map((vital) => (
                <Grid item xs={12} sm={6} md={4} key={vital.name}>
                  <Card sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {vital.name}
                    </Typography>

                    <Typography variant="h5" sx={{ mb: 2 }}>
                      {vital.value.toFixed(0)}
                      {vital.name.includes('Shift') ? '' : 'ms'}
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={vital.rating.toUpperCase()}
                        color={getRatingColor(vital.rating)}
                        size="small"
                      />
                    </Box>

                    <LinearProgress
                      variant="determinate"
                      value={Math.min((vital.value / vital.threshold) * 100, 100)}
                      sx={{ mb: 1 }}
                    />

                    <Typography variant="caption">
                      Threshold: {vital.threshold}
                      {vital.name.includes('Shift') ? '' : 'ms'}
                    </Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* API Endpoints */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              API Endpoint Performance
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Endpoint</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell align="right">Avg Time</TableCell>
                  <TableCell align="right">P95 Time</TableCell>
                  <TableCell align="right">Error Rate</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {endpoints.map((endpoint) => (
                  <TableRow key={`${endpoint.method}-${endpoint.path}`}>
                    <TableCell>
                      {endpoint.method} {endpoint.path}
                    </TableCell>
                    <TableCell align="right">{endpoint.count}</TableCell>
                    <TableCell align="right">{endpoint.avgTime.toFixed(0)}ms</TableCell>
                    <TableCell align="right">{endpoint.p95Time.toFixed(0)}ms</TableCell>
                    <TableCell align="right">{endpoint.errorRate.toFixed(2)}%</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={endpoint.errorRate > 5 ? 'Degraded' : 'Healthy'}
                        color={endpoint.errorRate > 5 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
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

export default PerformanceDashboard;
