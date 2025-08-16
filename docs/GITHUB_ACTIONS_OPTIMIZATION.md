# GitHub Actions Optimization Guide

This document explains the optimizations implemented for running AsyncLocalStorage benchmarks in GitHub Actions with 4-core Ubuntu runners.

## Overview

The benchmark workflow has been optimized to:
- **Minimize garbage collection overhead** during benchmark runs
- **Optimize memory allocation** for the available 4-core environment
- **Provide consistent, reproducible results** across different runs
- **Take advantage of the full runner resources** efficiently

## Key Optimizations

### 1. Node.js Memory Management

**Important Note**: Most Node.js optimization flags cannot be used in `NODE_OPTIONS` environment variable due to security restrictions in GitHub Actions. We use a simplified but effective approach with only compatible flags.

```bash
# Flags used in NODE_OPTIONS (environment variable) - SAFE
--max-old-space-size=16384        # 16GB heap (4x increase from default)

# Flags used in npm scripts (compatible across Node.js versions)
--expose-gc                       # Enable manual GC control (security-sensitive)
--no-compilation-cache            # Disable compilation cache for consistency

# Flags removed due to compatibility issues
# --max-semi-space-size=4096        # Not available in Node.js 16-18
# --initial-heap-size=8192          # Not available in Node.js 16-18  
# --optimize-for-size=false         # Syntax error in older versions
# --gc-interval=100000              # Not available in Node.js 16-18
# --predictable                     # Not available in Node.js 16-18
# --single-threaded-gc              # Not available in Node.js 16-18
```

### 2. Environment Variables

```bash
NODE_ENV=production               # Production mode optimizations
UV_THREADPOOL_SIZE=8             # 2x CPU cores for I/O operations
NODE_OPTIONS=<optimized_flags>    # All Node.js optimization flags
```

### 3. Benchmark Configuration

- **Iterations**: Increased from 2 to 15 for better statistical significance
- **Warmup Runs**: 3 warmup iterations before actual measurements
- **GC Between Runs**: Forced garbage collection between benchmark runs
- **Memory Sampling**: Every 100ms for detailed memory analysis
- **Concurrent Tests**: Limited to 2 to avoid resource contention
- **Timeout**: 5 minutes per iteration to prevent hanging

### 4. Memory Test Configuration

- **Allocation Size**: 1GB per test for realistic memory pressure
- **GC Threshold**: 80% heap usage before triggering GC
- **Max Memory**: 12GB limit with automatic cleanup
- **Cleanup Interval**: Every 1000ms for consistent memory state

### 5. Resource Utilization

- **CPU Target**: 80% utilization (leaves 20% for system)
- **Memory Target**: 70% utilization (leaves 30% buffer)
- **Worker Processes**: 3 of 4 cores (leaves 1 for system)
- **Memory Limits**: 4GB per worker, 8GB for main process

## Implementation Details

### Workflow Changes

The GitHub Actions workflow now includes:

1. **Safe Node.js flags** in environment variables (`--max-old-space-size=16384`)
2. **Advanced optimization flags** applied directly in npm scripts
3. **Environment variables** for consistent optimization
4. **Resource monitoring** and cleanup between runs
5. **Warmup phase** before actual measurements

### Current Optimization Strategy

Due to GitHub Actions restrictions, we use a two-tier approach:

1. **Environment Variables** (Safe flags):
   - `NODE_OPTIONS="--max-old-space-size=16384"`

2. **NPM Scripts** (Advanced flags):
   - All other optimization flags are applied directly in package.json scripts
   - This ensures all optimizations are still active despite environment restrictions

### Script Optimizations

The `run-multi-iterations.js` script includes:

1. **Warmup iterations** (not measured) to stabilize the environment
2. **Forced garbage collection** between test runs
3. **Memory state management** for consistent results
4. **Resource cleanup** between iterations

### Package.json Scripts

Updated npm scripts with simplified but effective flags:

```json
{
  "benchmark": "node --max-old-space-size=16384 --expose-gc src/benchmark.js",
  "memory-test": "node --max-old-space-size=16384 --expose-gc src/memory-test.js"
}
```

**Note**: We've simplified the flags to ensure compatibility across all Node.js versions (16.20.2 to 24.6.0) while maintaining the most impactful optimizations.

## Performance Benefits

### Garbage Collection Optimization

- **Reduced GC frequency**: Large heap (16GB) prevents frequent memory pressure
- **Larger heap sizes**: Reduces memory pressure and allocation overhead
- **Manual GC control**: Ensures clean state between benchmark runs
- **Consistent performance**: Disabled compilation cache for reproducible results

### Memory Management

- **Large heap allocation**: 16GB heap prevents resizing overhead during tests
- **Memory pressure reduction**: Large heap reduces minor GC frequency
- **Memory isolation**: Separate memory limits for workers and main process
- **Cleanup protocols**: Regular memory cleanup between test phases

### Resource Utilization

- **CPU efficiency**: 80% target utilization maximizes benchmark throughput
- **Memory efficiency**: 70% target utilization prevents swapping
- **Worker optimization**: 3 workers on 4 cores balances load and system resources
- **I/O optimization**: 8 thread pool size for optimal I/O operations

## Monitoring and Debugging

### Performance Metrics

- **Memory usage tracking** every 100ms during tests
- **GC timing analysis** for optimization validation
- **Resource utilization** monitoring across all cores
- **Iteration timing** for performance regression detection

### Debug Information

- **Detailed logging** of optimization settings
- **Resource usage** reporting in workflow summaries
- **Memory state** validation between iterations
- **Performance regression** analysis in PR workflows

## Best Practices

### For Benchmark Development

1. **Use warmup runs** to stabilize the environment
2. **Force GC** between unrelated test phases
3. **Monitor memory usage** to detect leaks
4. **Limit concurrent operations** to prevent resource contention

### For Workflow Maintenance

1. **Monitor resource utilization** in workflow runs
2. **Validate optimization flags** across Node.js versions
3. **Track performance trends** over time
4. **Adjust resource limits** based on runner performance

## Troubleshooting

### Common Issues

#### Node.js Flag Restrictions

**Error**: `node: --expose-gc is not allowed in NODE_OPTIONS`

**Cause**: GitHub Actions restricts certain security-sensitive Node.js flags from being used in the `NODE_OPTIONS` environment variable.

**Solution**: Security-sensitive flags like `--expose-gc` are applied directly in the npm scripts, while performance flags are set via `NODE_OPTIONS`.

**Flags that CAN be in NODE_OPTIONS**:
- `--max-old-space-size=16384` (heap size - safe)

**Flags that CANNOT be in NODE_OPTIONS**:
- `--expose-gc` (security-sensitive)
- `--no-compilation-cache` (compilation - restricted)

**Flags removed due to compatibility issues**:
- `--max-semi-space-size=4096` (not available in Node.js 16-18)
- `--initial-heap-size=8192` (not available in Node.js 16-18)
- `--optimize-for-size=false` (syntax error in older versions)
- `--gc-interval=100000` (not available in Node.js 16-18)
- `--predictable` (not available in Node.js 16-18)
- `--single-threaded-gc` (not available in Node.js 16-18)

### Common Issues

1. **Memory allocation failures**: Increase heap sizes or reduce allocation patterns
2. **GC overhead**: Adjust GC interval or force manual GC more frequently
3. **Resource contention**: Reduce concurrent test count or worker processes
4. **Timeout issues**: Increase timeout values or optimize test execution

### Performance Degradation

1. **Check memory usage patterns** for leaks
2. **Analyze GC timing** for frequency issues
3. **Monitor CPU utilization** for contention
4. **Validate optimization flags** are being applied

## Future Improvements

### Planned Optimizations

1. **Dynamic resource allocation** based on runner performance
2. **Adaptive GC strategies** for different Node.js versions
3. **Parallel test execution** with resource-aware scheduling
4. **Real-time performance monitoring** during benchmark runs

### Research Areas

1. **Node.js version-specific optimizations**
2. **Memory allocation pattern analysis**
3. **GC algorithm performance comparison**
4. **Resource utilization correlation studies**

---

*This optimization guide is maintained as part of the AsyncLocalStorage benchmark suite. For questions or improvements, please refer to the project documentation or create an issue.*
