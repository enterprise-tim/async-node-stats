import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Chip, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Divider
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const OptimizationInfo = () => {
  const [optimizationData, setOptimizationData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOptimizationData();
  }, []);

  const fetchOptimizationData = async () => {
    try {
      setLoading(true);
      
      // Fetch benchmark results to get version information
      const response = await fetch('/api/optimization-info');
      if (response.ok) {
        const data = await response.json();
        setOptimizationData(data);
      } else {
        // Fallback: generate mock data for demonstration
        setOptimizationData(generateMockOptimizationData());
      }
    } catch (err) {
      console.warn('Could not fetch optimization data, using mock data:', err);
      setOptimizationData(generateMockOptimizationData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockOptimizationData = () => {
    const versions = [
      { version: '16.20.2', major: 16, minor: 20, patch: 2, isLTS: true },
      { version: '18.19.1', major: 18, minor: 19, patch: 1, isLTS: true },
      { version: '20.0.0', major: 20, minor: 0, patch: 0, isLTS: true },
      { version: '20.11.0', major: 20, minor: 11, patch: 0, isLTS: true },
      { version: '21.7.3', major: 21, minor: 7, patch: 3, isLTS: false },
      { version: '22.18.0', major: 22, minor: 18, patch: 0, isLTS: false },
      { version: '24.6.0', major: 24, minor: 6, patch: 0, isLTS: true }
    ];

    return {
      systemInfo: {
        platform: 'ubuntu-latest-4-cores',
        cpus: 4,
        totalMemory: '16GB',
        architecture: 'x64',
        environment: 'GitHub Actions'
      },
      versions: versions.map(v => ({
        ...v,
        flags: generateFlagsForVersion(v.major, v.minor),
        capabilities: generateCapabilities(v.major, v.minor)
      }))
    };
  };

  const generateFlagsForVersion = (major, minor) => {
    const flags = {
      safe: ['--max-old-space-size=16384', '--expose-gc'],
      versionSpecific: [],
      experimental: []
    };

    if (major >= 18) {
      flags.versionSpecific.push('--max-semi-space-size=4096');
      flags.versionSpecific.push('--initial-heap-size=8192');
    }
    
    if (major >= 20) {
      flags.versionSpecific.push('--gc-interval=100000');
      flags.versionSpecific.push('--no-compilation-cache');
    }
    
    if (major >= 22) {
      flags.versionSpecific.push('--predictable');
      flags.versionSpecific.push('--single-threaded-gc');
    }
    
    if (major >= 24) {
      flags.versionSpecific.push('--harmony-import-assertions');
      flags.versionSpecific.push('--experimental-async-context');
    }

    if (major >= 21) {
      flags.experimental.push('--experimental-gc-profiler');
    }

    return flags;
  };

  const generateCapabilities = (major, minor) => {
    return {
      asyncContextFrame: major >= 24,
      modernGC: major >= 18,
      advancedOpts: major >= 20,
      experimentalFeatures: major >= 21,
      predictableMode: major >= 22,
      singleThreadedGC: major >= 22
    };
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6">Loading optimization information...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error">Error loading optimization information: {error}</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        🚀 Node.js Optimization Information
      </Typography>
      
      {/* System Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🖥️ System Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography><strong>Platform:</strong> {optimizationData.systemInfo.platform}</Typography>
              <Typography><strong>CPU Cores:</strong> {optimizationData.systemInfo.cpus}</Typography>
              <Typography><strong>Total Memory:</strong> {optimizationData.systemInfo.totalMemory}</Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography><strong>Architecture:</strong> {optimizationData.systemInfo.architecture}</Typography>
              <Typography><strong>Environment:</strong> {optimizationData.systemInfo.environment}</Typography>
              <Typography><strong>Runner Type:</strong> GitHub Actions Ubuntu 4-core</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Version-specific optimization details */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        🔧 Node.js Version Optimization Details
      </Typography>

      {optimizationData.versions.map((version, index) => (
        <Accordion key={version.version} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Typography variant="h6">
                  Node.js {version.version}
                </Typography>
              </Grid>
              <Grid item>
                {version.isLTS && (
                  <Chip label="LTS" color="success" size="small" />
                )}
                {version.capabilities.asyncContextFrame && (
                  <Chip label="AsyncContextFrame" color="primary" size="small" />
                )}
                {version.capabilities.modernGC && (
                  <Chip label="Modern GC" color="info" size="small" />
                )}
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              {/* Flags Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>🔧 Optimization Flags</strong>
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell>Flags</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell><strong>Safe</strong></TableCell>
                        <TableCell>
                          {version.flags.safe.map(flag => (
                            <Chip key={flag} label={flag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Version-Specific</strong></TableCell>
                        <TableCell>
                          {version.flags.versionSpecific.length > 0 ? (
                            version.flags.versionSpecific.map(flag => (
                              <Chip key={flag} label={flag} size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">None available</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell><strong>Experimental</strong></TableCell>
                        <TableCell>
                          {version.flags.experimental.length > 0 ? (
                            version.flags.experimental.map(flag => (
                              <Chip key={flag} label={flag} size="small" color="warning" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))
                          ) : (
                            <Typography variant="body2" color="text.secondary">None available</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Capabilities Information */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>
                  <strong>📊 Version Capabilities</strong>
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Chip 
                    label={`AsyncContextFrame: ${version.capabilities.asyncContextFrame ? '✅ Yes' : '❌ No'}`}
                    color={version.capabilities.asyncContextFrame ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Modern GC: ${version.capabilities.modernGC ? '✅ Yes' : '❌ No'}`}
                    color={version.capabilities.modernGC ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Advanced Options: ${version.capabilities.advancedOpts ? '✅ Yes' : '❌ No'}`}
                    color={version.capabilities.advancedOpts ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Experimental Features: ${version.capabilities.experimentalFeatures ? '✅ Yes' : '❌ No'}`}
                    color={version.capabilities.experimentalFeatures ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Predictable Mode: ${version.capabilities.predictableMode ? '✅ Yes' : '❌ No'}`}
                    color={version.capabilities.predictableMode ? 'success' : 'default'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Single-threaded GC: ${version.capabilities.singleThreadedGC ? '✅ Yes' : '❌ No'}`}
                    color={version.capabilities.singleThreadedGC ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Grid>
            </Grid>

            {/* All Flags Summary */}
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                <strong>🚀 Complete Command Line</strong>
              </Typography>
              <Typography 
                variant="body2" 
                component="code" 
                sx={{ 
                  display: 'block', 
                  p: 1, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem'
                }}
              >
                node {[...version.flags.safe, ...version.flags.versionSpecific, ...version.flags.experimental].join(' ')} src/benchmark.js
              </Typography>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Optimization Strategy Summary */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            🎯 Optimization Strategy
          </Typography>
          <Typography paragraph>
            Our optimization approach automatically detects Node.js version capabilities and applies the most 
            effective flags for each version. This ensures maximum performance while maintaining compatibility 
            across all tested versions.
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            <strong>Key Benefits:</strong> Version-aware optimization, automatic flag selection, 
            cross-version compatibility, and maximum performance for each Node.js release.
          </Typography>
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizationInfo;
