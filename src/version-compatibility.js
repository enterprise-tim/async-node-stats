/**
 * Node.js Version Compatibility Checker
 * 
 * This module provides version-aware Node.js optimization flags
 * based on the specific Node.js version being used.
 */

/**
 * Get optimization flags compatible with the current Node.js version
 * @returns {Object} Object containing compatible flags and metadata
 */
export function getCompatibleFlags() {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split('.')[0]);
  const minor = parseInt(nodeVersion.slice(1).split('.')[1]);
  const patch = parseInt(nodeVersion.slice(1).split('.')[2]);
  
  const flags = {
    // Always safe and available
    safe: [
      '--max-old-space-size=16384',
      '--expose-gc'
    ],
    
    // Version-specific flags
    versionSpecific: [],
    
    // Flags that might not be available
    experimental: [],
    
    // Metadata
    metadata: {
      nodeVersion: process.version,
      major,
      minor,
      patch,
      platform: process.platform,
      arch: process.arch,
      isLTS: isLTSVersion(major, minor),
      supportsAsyncContextFrame: major >= 24,
      supportsModernGC: major >= 18,
      supportsAdvancedOpts: major >= 20
    }
  };

  // Add version-specific flags
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

  // Add experimental flags for newer versions
  if (major >= 21) {
    flags.experimental.push('--experimental-gc-profiler');
  }

  return flags;
}

/**
 * Check if a Node.js version is LTS
 * @param {number} major - Major version
 * @param {number} minor - Minor version
 * @returns {boolean} True if LTS
 */
function isLTSVersion(major, minor) {
  const ltsVersions = [
    { major: 16, minor: 20 },
    { major: 18, minor: 19 },
    { major: 20, minor: 11 },
    { major: 22, minor: 18 },
    { major: 24, minor: 6 }
  ];
  
  return ltsVersions.some(v => v.major === major && v.minor >= minor);
}

/**
 * Get all compatible flags as a single string
 * @returns {string} Space-separated flags
 */
export function getCompatibleFlagsString() {
  const flags = getCompatibleFlags();
  return [...flags.safe, ...flags.versionSpecific, ...flags.experimental].join(' ');
}

/**
 * Get flags for specific Node.js version
 * @param {string} version - Node.js version (e.g., "16.20.2")
 * @returns {Object} Compatible flags for that version
 */
export function getFlagsForVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  
  const flags = {
    safe: [
      '--max-old-space-size=16384',
      '--expose-gc'
    ],
    versionSpecific: [],
    experimental: [],
    metadata: {
      nodeVersion: `v${version}`,
      major,
      minor,
      patch,
      isLTS: isLTSVersion(major, minor),
      supportsAsyncContextFrame: major >= 24,
      supportsModernGC: major >= 18,
      supportsAdvancedOpts: major >= 20
    }
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
}

/**
 * Get system information
 * @returns {Object} System information
 */
export function getSystemInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    v8Version: process.versions.v8,
    opensslVersion: process.versions.openssl,
    zlibVersion: process.versions.zlib,
    uvVersion: process.versions.uv,
    cpus: require('os').cpus().length,
    totalMemory: require('os').totalmem(),
    freeMemory: require('os').freemem(),
    uptime: require('os').uptime(),
    hostname: require('os').hostname(),
    userInfo: require('os').userInfo(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      NODE_OPTIONS: process.env.NODE_OPTIONS,
      UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE
    }
  };
}

export default {
  getCompatibleFlags,
  getCompatibleFlagsString,
  getFlagsForVersion,
  getSystemInfo
};
