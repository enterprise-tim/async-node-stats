#!/usr/bin/env node

import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const REPO_OWNER = 'enterprise-tim';
const REPO_NAME = 'als-benchmark-basic';
const RELEASE_ASSET_NAME = 'benchmark-results.tar.gz';

async function fetchLatestRelease() {
  console.log('🔍 Fetching latest release from GitHub...');
  
  return new Promise((resolve, reject) => {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/latest`;
    
    https.get(url, {
      headers: {
        'User-Agent': 'async-node-stats-downloader'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const release = JSON.parse(data);
          resolve(release);
        } catch (error) {
          reject(new Error(`Failed to parse release data: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch release: ${error.message}`));
    });
  });
}

async function downloadAsset(assetUrl, outputPath) {
  console.log(`📥 Downloading ${RELEASE_ASSET_NAME}...`);
  
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    
    const makeRequest = (url) => {
      https.get(url, {
        headers: {
          'User-Agent': 'async-node-stats-downloader'
        }
      }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          // Handle redirect
          const location = res.headers.location;
          if (location) {
            console.log(`🔄 Following redirect to: ${location}`);
            makeRequest(location);
            return;
          }
        }
        
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }
        
        res.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
        
        file.on('error', (error) => {
          fs.unlink(outputPath).catch(() => {}); // Clean up on error
          reject(error);
        });
      }).on('error', (error) => {
        reject(error);
      });
    };
    
    makeRequest(assetUrl);
  });
}

async function extractArchive(archivePath) {
  console.log('📦 Extracting benchmark data...');
  
  try {
    // Use tar command to extract
    execSync(`tar -xzf "${archivePath}"`, { 
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log('✅ Extraction completed');
  } catch (error) {
    throw new Error(`Failed to extract archive: ${error.message}`);
  }
}

async function cleanupArchive(archivePath) {
  try {
    await fsPromises.unlink(archivePath);
    console.log('🧹 Cleaned up downloaded archive');
  } catch (error) {
    console.warn('⚠️  Could not clean up archive:', error.message);
  }
}

async function processBenchmarkData() {
  console.log('🔄 Processing benchmark data for local development...');
  
  try {
    const resultsPath = path.join(projectRoot, 'results');
    const docsPath = path.join(projectRoot, 'docs');
    
    // Create docs directory
    await fsPromises.mkdir(docsPath, { recursive: true });
    
    // Read and process benchmark data
    const versionDirs = await fsPromises.readdir(resultsPath);
    const comparisons = [];
    
    for (const versionDir of versionDirs) {
      if (versionDir.startsWith('node_')) {
        const version = versionDir.replace('node_', '');
        const versionPath = path.join(resultsPath, versionDir);
        
        try {
          const files = await fsPromises.readdir(versionPath);
          const benchmarkFile = files.find(f => f.startsWith('benchmark_'));
          const memoryFile = files.find(f => f.startsWith('memory_'));
          
          if (benchmarkFile) {
            const benchmarkPath = path.join(versionPath, benchmarkFile);
            const benchmarkData = JSON.parse(await fsPromises.readFile(benchmarkPath, 'utf8'));
            
            // Create a simplified comparison entry
            const comparison = {
              nodeVersion: version,
              testResults: benchmarkData.benchmarks?.map(benchmark => ({
                name: benchmark.name,
                type: 'traditional',
                overheadPercent: benchmark.overhead?.timePercent || 0,
                nestedOverheadPercent: benchmark.overhead?.nestedTimePercent || 0,
                memoryOverheadBytes: benchmark.overhead?.memoryRSSBytes || 0
              })) || [],
              totalMemoryOverheadBytes: 0
            };
            
            comparisons.push(comparison);
          }
        } catch (error) {
          console.warn(`⚠️  Could not process ${versionDir}: ${error.message}`);
        }
      }
    }
    
    // Create version-comparison.json
    const versionComparisonData = {
      metadata: {
        generated: new Date().toISOString(),
        source: 'local-development',
        totalVersions: comparisons.length
      },
      comparisons: comparisons
    };
    
    await fsPromises.writeFile(
      path.join(docsPath, 'version-comparison.json'),
      JSON.stringify(versionComparisonData, null, 2)
    );
    
    console.log(`✅ Processed ${comparisons.length} Node.js versions`);
    console.log(`✅ Created docs/version-comparison.json`);
    
  } catch (error) {
    console.error('❌ Error processing benchmark data:', error.message);
  }
}

async function verifyData() {
  console.log('🔍 Verifying downloaded data...');
  
  const resultsPath = path.join(projectRoot, 'results');
  const docsPath = path.join(projectRoot, 'docs');
  
  try {
    const resultsExists = await fsPromises.access(resultsPath).then(() => true).catch(() => false);
    const docsExists = await fsPromises.access(docsPath).then(() => true).catch(() => false);
    
    if (resultsExists) {
      const resultsStats = await fsPromises.stat(resultsPath);
      console.log(`✅ Results directory found (${resultsStats.size} bytes)`);
    } else {
      console.warn('⚠️  Results directory not found');
    }
    
    if (docsExists) {
      const docsStats = await fsPromises.stat(docsPath);
      console.log(`✅ Docs directory found (${docsStats.size} bytes)`);
    } else {
      console.warn('⚠️  Docs directory not found');
    }
    
    // Check for key files
    const keyFiles = [
      'docs/version-comparison.json'
    ];
    
    for (const file of keyFiles) {
      const filePath = path.join(projectRoot, file);
      try {
        await fsPromises.access(filePath);
        const stats = await fsPromises.stat(filePath);
        console.log(`✅ ${file} found (${stats.size} bytes)`);
      } catch (error) {
        console.warn(`⚠️  ${file} not found`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
}

async function main() {
  try {
    console.log('🚀 Starting benchmark data download...');
    console.log(`📋 Target repository: ${REPO_OWNER}/${REPO_NAME}`);
    
    // Fetch latest release
    const release = await fetchLatestRelease();
    
    if (!release.tag_name) {
      throw new Error('No release found');
    }
    
    console.log(`📋 Latest release: ${release.tag_name}`);
    console.log(`📅 Published: ${release.published_at}`);
    
    // Find the benchmark results asset
    const asset = release.assets.find(a => a.name === RELEASE_ASSET_NAME);
    if (!asset) {
      throw new Error(`Asset ${RELEASE_ASSET_NAME} not found in release`);
    }
    
    console.log(`📦 Asset found: ${asset.name} (${asset.size} bytes)`);
    
    // Download the asset
    const archivePath = path.join(projectRoot, RELEASE_ASSET_NAME);
    await downloadAsset(asset.browser_download_url, archivePath);
    
    // Extract the archive
    await extractArchive(archivePath);
    
    // Clean up the archive
    await cleanupArchive(archivePath);
    
    // Process the benchmark data for local development
    await processBenchmarkData();
    
    // Verify the extracted data
    await verifyData();
    
    console.log('🎉 Benchmark data download completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('  npm run dev     # Start development server');
    console.log('  npm run build   # Build for production');
    console.log('  npm run preview # Preview production build');
    
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
