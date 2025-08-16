/**
 * GitHub Actions Optimization Configuration
 * 
 * This file contains optimized settings for running benchmarks in GitHub Actions
 * with 4-core Ubuntu runners. The settings are designed to:
 * 
 * 1. Minimize garbage collection overhead
 * 2. Optimize memory allocation for the available resources
 * 3. Take advantage of the multi-core environment
 * 4. Provide consistent, reproducible results
 */

export const GITHUB_ACTIONS_OPTIMIZATION = {
  // Node.js Memory Management
  nodeOptions: [
    '--max-old-space-size=16384',        // 16GB heap (4x increase from default)
    '--max-semi-space-size=4096',        // 4GB new generation (reduces GC frequency)
    '--initial-heap-size=8192',          // 8GB initial heap (reduces resizing)
    '--optimize-for-size=false',         // Optimize for performance, not memory
    '--gc-interval=100000',              // GC every 100k allocations (reduces GC frequency)
    '--expose-gc',                       // Enable manual GC control
    '--no-compilation-cache',            // Disable compilation cache for consistency
    '--predictable',                     // Enable predictable mode for consistent results
    '--single-threaded-gc'               // Single-threaded GC for better isolation
  ].join(' '),
  
  // Environment Variables
  environment: {
    NODE_ENV: 'production',
    UV_THREADPOOL_SIZE: '8',             // 2x CPU cores for I/O operations
    NODE_OPTIONS: '--max-old-space-size=16384 --expose-gc --max-semi-space-size=4096 --initial-heap-size=8192 --optimize-for-size=false --gc-interval=100000'
  },
  
  // Benchmark Configuration
  benchmark: {
    iterations: 15,                      // Increased from 2 to 15 for better statistics
    warmupRuns: 3,                       // Warmup runs before actual measurement
    gcBetweenRuns: true,                 // Force GC between benchmark runs
    memorySamplingInterval: 100,         // Memory sampling every 100ms
    maxConcurrentTests: 2,               // Limit concurrent tests to avoid resource contention
    timeoutMs: 300000                    // 5 minute timeout per iteration
  },
  
  // Memory Test Configuration
  memory: {
    allocationSize: '1GB',               // Allocate 1GB per test
    allocationPattern: 'random',         // Random allocation pattern
    gcThreshold: 0.8,                    // GC when 80% of heap is used
    maxMemoryUsage: '12GB',              // Maximum memory usage before cleanup
    cleanupInterval: 1000                // Cleanup every 1000ms
  },
  
  // Resource Utilization
  resources: {
    targetCpuUtilization: 0.8,          // Target 80% CPU utilization
    targetMemoryUtilization: 0.7,       // Target 70% memory utilization
    maxConcurrentWorkers: 3,             // Use 3 of 4 cores (leave 1 for system)
    workerMemoryLimit: '4GB',            // 4GB per worker process
    mainProcessMemoryLimit: '8GB'        // 8GB for main process
  },
  
  // Performance Monitoring
  monitoring: {
    enableMetrics: true,                 // Enable performance metrics collection
    metricsInterval: 5000,               // Collect metrics every 5 seconds
    enableProfiling: false,              // Disable profiling in CI (performance impact)
    logLevel: 'info',                    // Info level logging
    enableDebugOutput: false             // Disable debug output in CI
  }
};

/**
 * Get optimized Node.js flags for GitHub Actions
 */
export function getOptimizedNodeFlags() {
  return GITHUB_ACTIONS_OPTIMIZATION.nodeOptions;
}

/**
 * Get environment variables for GitHub Actions
 */
export function getOptimizedEnvironment() {
  return { ...GITHUB_ACTIONS_OPTIMIZATION.environment };
}

/**
 * Get benchmark configuration for GitHub Actions
 */
export function getBenchmarkConfig() {
  return { ...GITHUB_ACTIONS_OPTIMIZATION.benchmark };
}

/**
 * Get memory test configuration for GitHub Actions
 */
export function getMemoryConfig() {
  return { ...GITHUB_ACTIONS_OPTIMIZATION.memory };
}

/**
 * Get resource utilization settings for GitHub Actions
 */
export function getResourceConfig() {
  return { ...GITHUB_ACTIONS_OPTIMIZATION.resources };
}

/**
 * Get monitoring configuration for GitHub Actions
 */
export function getMonitoringConfig() {
  return { ...GITHUB_ACTIONS_OPTIMIZATION.monitoring };
}

export default GITHUB_ACTIONS_OPTIMIZATION;
