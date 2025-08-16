#!/usr/bin/env node

import { getCompatibleFlagsString, getCompatibleFlags, getSystemInfo } from '../src/version-compatibility.js';

/**
 * Wrapper script to run Node.js with version-compatible optimization flags
 * Usage: node scripts/run-with-flags.js <target-script> [args...]
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node scripts/run-with-flags.js <target-script> [args...]');
    console.error('Example: node scripts/run-with-flags.js src/benchmark.js');
    process.exit(1);
  }

  const targetScript = args[0];
  const scriptArgs = args.slice(1);

  try {
    // Get compatible flags for current Node.js version
    const flags = getCompatibleFlags();
    const flagsString = getCompatibleFlagsString();
    
    // Display system information
    const systemInfo = getSystemInfo();
    
    console.log('🚀 Node.js Version Compatibility Check');
    console.log('=====================================');
    console.log(`Node.js Version: ${systemInfo.nodeVersion}`);
    console.log(`Platform: ${systemInfo.platform} (${systemInfo.arch})`);
    console.log(`CPU Cores: ${systemInfo.cpus}`);
    console.log(`Total Memory: ${(systemInfo.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Free Memory: ${(systemInfo.freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Uptime: ${(systemInfo.uptime / 3600).toFixed(2)} hours`);
    console.log(`Hostname: ${systemInfo.hostname}`);
    
    console.log('\n🔧 Optimization Flags');
    console.log('====================');
    console.log(`Safe Flags: ${flags.safe.join(' ')}`);
    console.log(`Version-Specific: ${flags.versionSpecific.join(' ') || 'None'}`);
    console.log(`Experimental: ${flags.experimental.join(' ') || 'None'}`);
    console.log(`All Flags: ${flagsString}`);
    
    console.log('\n📊 Version Capabilities');
    console.log('======================');
    console.log(`LTS Version: ${flags.metadata.isLTS ? '✅ Yes' : '❌ No'}`);
    console.log(`AsyncContextFrame: ${flags.metadata.supportsAsyncContextFrame ? '✅ Yes' : '❌ No'}`);
    console.log(`Modern GC: ${flags.metadata.supportsModernGC ? '✅ Yes' : '❌ No'}`);
    console.log(`Advanced Options: ${flags.metadata.supportsAdvancedOpts ? '✅ Yes' : '❌ No'}`);
    
    console.log('\n🌍 Environment Variables');
    console.log('========================');
    console.log(`NODE_ENV: ${systemInfo.env.NODE_ENV || 'Not set'}`);
    console.log(`NODE_OPTIONS: ${systemInfo.env.NODE_OPTIONS || 'Not set'}`);
    console.log(`UV_THREADPOOL_SIZE: ${systemInfo.env.UV_THREADPOOL_SIZE || 'Not set'}`);
    
    console.log('\n🚀 Executing with compatible flags...');
    console.log('=====================================');
    
    // Execute the target script with compatible flags
    const { spawn } = await import('child_process');
    
    const child = spawn('node', [targetScript, ...scriptArgs], {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_OPTIONS: flagsString
      }
    });
    
    child.on('exit', (code) => {
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main().catch(console.error);
