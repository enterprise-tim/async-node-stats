// Service to load and process benchmark data from version-comparison.json endpoint
// This provides a simple way to load all benchmark data in one request
// 
// Data Flow:
// 1. loadVersionComparisonData() fetches data from the GitHub Pages site
// 2. NODE_VERSIONS is populated dynamically from the loaded data
// 3. All other functions use the dynamically loaded data

const VERSION_COMPARISON_URL = 'https://tobrien.github.io/async-node-stats/version-comparison.json'

// NODE_VERSIONS will be populated dynamically from the loaded data
let NODE_VERSIONS = [];

// Load version comparison data from the centralized endpoint
async function loadVersionComparisonData() {
  try {
    // First try to load from local development data
    const localUrl = '/docs/version-comparison.json';
    console.log('Trying to load version comparison data from local development:', localUrl);
    
    try {
      const localResponse = await fetch(localUrl);
      if (localResponse.ok) {
        const localData = await localResponse.json();
        console.log('Version comparison data loaded successfully from local development:', localData);
        
        // Populate NODE_VERSIONS dynamically from the loaded data
        if (localData && localData.comparisons && Array.isArray(localData.comparisons)) {
          NODE_VERSIONS = localData.comparisons.map(comparison => comparison.nodeVersion).sort();
          console.log('Dynamically populated NODE_VERSIONS from local data:', NODE_VERSIONS);
        }
        
        return localData;
      }
    } catch (localError) {
      console.log('Local development data not available, trying production URL');
    }
    
    // Fall back to production URL
    console.log('Loading version comparison data from production:', VERSION_COMPARISON_URL);
    const response = await fetch(VERSION_COMPARISON_URL);
    
    if (!response.ok) {
      throw new Error(`Failed to load version comparison data: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Version comparison data loaded successfully from production:', data);
    
    // Populate NODE_VERSIONS dynamically from the loaded data
    if (data && data.comparisons && Array.isArray(data.comparisons)) {
      NODE_VERSIONS = data.comparisons.map(comparison => comparison.nodeVersion).sort();
      console.log('Dynamically populated NODE_VERSIONS from production data:', NODE_VERSIONS);
    } else {
      console.warn('No comparisons data found, NODE_VERSIONS will remain empty');
    }
    
    return data;
  } catch (error) {
    console.error('Error loading version comparison data:', error);
    throw error;
  }
}

// Get aggregated performance data across all versions
async function getPerformanceComparison() {
  try {
    console.log('Loading performance comparison data...');
    
    const versionData = await loadVersionComparisonData();
    if (!versionData || !versionData.comparisons) {
      console.log('No benchmark data available');
      return [];
    }
    
    const performanceData = versionData.comparisons.map(comparison => ({
      version: comparison.nodeVersion,
      basicOverhead: comparison.testResults
        .filter(test => test.type === 'traditional')
        .map(test => ({
          name: test.name,
          overhead: test.overheadPercent
        })),
      nestedOverhead: comparison.testResults
        .filter(test => test.type === 'traditional')
        .map(test => ({
          name: test.name,
          overhead: test.nestedOverheadPercent
        })),
      memoryOverhead: comparison.testResults
        .filter(test => test.type === 'traditional')
        .map(test => ({
          name: test.name,
          overhead: test.memoryOverheadBytes / 1024 / 1024 // Convert to MB
        }))
    }));
    
    console.log(`Loaded performance data for ${performanceData.length} versions`);
    return performanceData;
  } catch (error) {
    console.error('Error loading performance comparison:', error);
    return [];
  }
}

// Get aggregated memory data across all versions
async function getMemoryComparison() {
  try {
    console.log('Loading memory comparison data...');
    
    const versionData = await loadVersionComparisonData();
    if (!versionData || !versionData.comparisons) {
      console.log('No memory data available');
      return [];
    }
    
    const memoryData = versionData.comparisons.map(comparison => ({
      version: comparison.nodeVersion,
      memoryOverhead: comparison.testResults
        .filter(test => test.type === 'traditional')
        .map(test => test.memoryOverheadBytes / 1024), // Convert to KB
      memoryGrowth: comparison.testResults
        .filter(test => test.type === 'traditional' && test.memoryOverheadBytes > 0)
        .map(test => ({
          size: test.name,
          growth: test.memoryOverheadBytes / 1024 // Convert to KB
        })),
      totalMemoryOverhead: comparison.totalMemoryOverheadBytes / 1024 // Convert to KB
    }));
    
    console.log(`Loaded memory data for ${memoryData.length} versions`);
    return memoryData;
  } catch (error) {
    console.error('Error loading memory comparison:', error);
    return [];
  }
}

// Get summary statistics for performance
function getPerformanceSummary(performanceData) {
  if (!performanceData.length) return null;
  
  const summary = {
    versions: performanceData.map(d => d.version),
    averageBasicOverhead: [],
    averageNestedOverhead: [],
    bestVersion: null,
    worstVersion: null
  };
  
  performanceData.forEach(data => {
    if (data.basicOverhead.length > 0) {
      const avgBasic = data.basicOverhead.reduce((sum, item) => sum + item.overhead, 0) / data.basicOverhead.length;
      summary.averageBasicOverhead.push(avgBasic);
    }
    
    if (data.nestedOverhead.length > 0) {
      const avgNested = data.nestedOverhead.reduce((sum, item) => sum + item.overhead, 0) / data.nestedOverhead.length;
      summary.averageNestedOverhead.push(avgNested);
    }
  });
  
  // Find best and worst versions based on basic overhead
  if (summary.averageBasicOverhead.length > 0) {
    const minIndex = summary.averageBasicOverhead.indexOf(Math.min(...summary.averageBasicOverhead));
    const maxIndex = summary.averageBasicOverhead.indexOf(Math.max(...summary.averageBasicOverhead));
    summary.bestVersion = summary.versions[minIndex];
    summary.worstVersion = summary.versions[maxIndex];
  }
  
  return summary;
}

// Get current NODE_VERSIONS (will be empty until data is loaded)
function getNodeVersions() {
  return [...NODE_VERSIONS]; // Return a copy to prevent external modification
}

// Debug function for testing data loading (simplified)
async function debugDataLoading(version) {
  console.log(`=== Debugging data loading for ${version} ===`);
  
  try {
    const data = await loadVersionComparisonData();
    const versionData = data.comparisons.find(c => c.nodeVersion === version);
    
    if (versionData) {
      console.log(`Found data for ${version}:`, versionData);
    } else {
      console.log(`No data found for ${version}`);
    }
  } catch (error) {
    console.error('Debug error:', error);
  }
  
  console.log(`=== End debugging for ${version} ===`);
}

export {
  loadVersionComparisonData,
  getPerformanceComparison,
  getMemoryComparison,
  getPerformanceSummary,
  debugDataLoading,
  getNodeVersions
};