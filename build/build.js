#!/usr/bin/env node
/**
 * Build Script for Aria2-Explorer
 * 
 * Builds browser-specific extension packages for Chrome and Firefox.
 * 
 * Usage:
 *   node build/build.js --chrome    # Build Chrome version
 *   node build/build.js --firefox   # Build Firefox version
 *   node build/build.js --all       # Build both versions
 * 
 * Requirements: 14.1, 14.2
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateChromeManifest, generateFirefoxManifest } = require('./manifest-generator');

// Project root directory
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// Files and directories to include in the build
const FILES_TO_COPY = [
    'background.js',
    'options.html',
    'aria2.html',
    'magnet.html',
    'acknowledgment.txt'
];

const DIRS_TO_COPY = [
    '_locales',
    'css',
    'images',
    'js',
    'ui'
];

// Files and directories to exclude
const EXCLUDE_PATTERNS = [
    '.git',
    '.github',
    '.kiro',
    '.vscode',
    'build',
    'node_modules',
    'dist',
    '*.md',
    '*.SVG',
    '*.svg'
];

/**
 * Ensure a directory exists, creating it if necessary
 * @param {string} dirPath - Directory path to ensure
 */
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Remove a directory and all its contents
 * @param {string} dirPath - Directory path to remove
 */
function removeDir(dirPath) {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
    }
}

/**
 * Copy a file from source to destination
 * @param {string} src - Source file path
 * @param {string} dest - Destination file path
 */
function copyFile(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}

/**
 * Copy a directory recursively
 * @param {string} src - Source directory path
 * @param {string} dest - Destination directory path
 */
function copyDir(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    }
}

/**
 * Copy extension files to the target directory
 * @param {string} targetDir - Target directory path
 */
function copyExtensionFiles(targetDir) {
    console.log(`  Copying extension files to ${targetDir}...`);
    
    // Copy individual files
    for (const file of FILES_TO_COPY) {
        const srcPath = path.join(ROOT_DIR, file);
        const destPath = path.join(targetDir, file);
        
        if (fs.existsSync(srcPath)) {
            copyFile(srcPath, destPath);
            console.log(`    Copied: ${file}`);
        } else {
            console.warn(`    Warning: ${file} not found, skipping`);
        }
    }
    
    // Copy directories
    for (const dir of DIRS_TO_COPY) {
        const srcPath = path.join(ROOT_DIR, dir);
        const destPath = path.join(targetDir, dir);
        
        if (fs.existsSync(srcPath)) {
            copyDir(srcPath, destPath);
            console.log(`    Copied: ${dir}/`);
        } else {
            console.warn(`    Warning: ${dir}/ not found, skipping`);
        }
    }
}

/**
 * Write manifest.json to the target directory
 * @param {string} targetDir - Target directory path
 * @param {string} browser - Browser type ('chrome' or 'firefox')
 */
function writeManifest(targetDir, browser) {
    console.log(`  Generating ${browser} manifest.json...`);
    
    const manifest = browser === 'chrome' 
        ? generateChromeManifest() 
        : generateFirefoxManifest();
    
    const manifestPath = path.join(targetDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`    Generated: manifest.json`);
}

/**
 * Create a zip file from a directory
 * @param {string} sourceDir - Source directory to zip
 * @param {string} outputPath - Output zip file path
 */
function createZip(sourceDir, outputPath) {
    console.log(`  Creating zip: ${path.basename(outputPath)}...`);
    
    // Ensure output directory exists
    ensureDir(path.dirname(outputPath));
    
    // Remove existing zip if present
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }
    
    // Detect platform and use appropriate zip command
    const isWindows = process.platform === 'win32';
    
    try {
        if (isWindows) {
            // Use PowerShell on Windows
            const command = `powershell -Command "Compress-Archive -Path '${sourceDir}\\*' -DestinationPath '${outputPath}' -Force"`;
            execSync(command, { stdio: 'pipe' });
        } else {
            // Use zip command on Unix-like systems
            const command = `cd "${sourceDir}" && zip -r "${outputPath}" .`;
            execSync(command, { stdio: 'pipe', shell: '/bin/sh' });
        }
        console.log(`    Created: ${path.basename(outputPath)}`);
    } catch (error) {
        console.error(`    Error creating zip: ${error.message}`);
        console.log(`    Tip: Make sure 'zip' command is available on your system`);
        throw error;
    }
}

/**
 * Build extension for a specific browser
 * @param {string} browser - Browser type ('chrome' or 'firefox')
 */
function buildForBrowser(browser) {
    console.log(`\nBuilding ${browser.toUpperCase()} extension...`);
    
    const targetDir = path.join(DIST_DIR, browser);
    const zipPath = path.join(DIST_DIR, `aria2-explorer-${browser}.zip`);
    
    // Clean and create target directory
    removeDir(targetDir);
    ensureDir(targetDir);
    
    // Copy extension files
    copyExtensionFiles(targetDir);
    
    // Generate and write manifest
    writeManifest(targetDir, browser);
    
    // Create zip file
    createZip(targetDir, zipPath);
    
    console.log(`  ${browser.toUpperCase()} build complete!`);
    
    return {
        dir: targetDir,
        zip: zipPath
    };
}

/**
 * Build Chrome extension
 * @returns {Object} Build result with dir and zip paths
 */
function buildChrome() {
    return buildForBrowser('chrome');
}

/**
 * Build Firefox extension
 * @returns {Object} Build result with dir and zip paths
 */
function buildFirefox() {
    return buildForBrowser('firefox');
}

/**
 * Build both Chrome and Firefox extensions
 * @returns {Object} Build results for both browsers
 */
function buildAll() {
    return {
        chrome: buildChrome(),
        firefox: buildFirefox()
    };
}

/**
 * Display usage information
 */
function showUsage() {
    console.log(`
Build Script for Aria2-Explorer

Usage:
  node build/build.js [options]

Options:
  --chrome              Build Chrome extension
  --firefox             Build Firefox extension
  --all                 Build both Chrome and Firefox extensions
  --clean               Clean dist directory before building
  --help, -h            Show this help message

Output:
  dist/chrome/          Chrome extension files
  dist/firefox/         Firefox extension files
  dist/aria2-explorer-chrome.zip    Chrome extension package
  dist/aria2-explorer-firefox.zip   Firefox extension package

Examples:
  node build/build.js --chrome
  node build/build.js --firefox
  node build/build.js --all
  node build/build.js --all --clean
`);
}

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {
        chrome: false,
        firefox: false,
        all: false,
        clean: false,
        help: false
    };

    for (const arg of args) {
        switch (arg) {
            case '--chrome':
                result.chrome = true;
                break;
            case '--firefox':
                result.firefox = true;
                break;
            case '--all':
                result.all = true;
                break;
            case '--clean':
                result.clean = true;
                break;
            case '--help':
            case '-h':
                result.help = true;
                break;
            default:
                console.error(`Unknown option: ${arg}`);
                showUsage();
                process.exit(1);
        }
    }

    return result;
}

/**
 * Main entry point
 */
function main() {
    const args = parseArgs();

    if (args.help) {
        showUsage();
        process.exit(0);
    }

    // If no browser specified, show usage
    if (!args.chrome && !args.firefox && !args.all) {
        showUsage();
        process.exit(1);
    }

    console.log('=== Aria2-Explorer Build Script ===');

    // Clean dist directory if requested
    if (args.clean) {
        console.log('\nCleaning dist directory...');
        removeDir(DIST_DIR);
        console.log('  Cleaned!');
    }

    // Ensure dist directory exists
    ensureDir(DIST_DIR);

    const results = {};

    // Build based on arguments
    if (args.all) {
        const allResults = buildAll();
        results.chrome = allResults.chrome;
        results.firefox = allResults.firefox;
    } else {
        if (args.chrome) {
            results.chrome = buildChrome();
        }
        if (args.firefox) {
            results.firefox = buildFirefox();
        }
    }

    // Print summary
    console.log('\n=== Build Summary ===');
    if (results.chrome) {
        console.log(`Chrome:  ${results.chrome.zip}`);
    }
    if (results.firefox) {
        console.log(`Firefox: ${results.firefox.zip}`);
    }
    console.log('\nBuild completed successfully!');
}

// Export functions for testing and programmatic use
module.exports = {
    buildChrome,
    buildFirefox,
    buildAll,
    copyExtensionFiles,
    writeManifest,
    createZip,
    ensureDir,
    removeDir,
    copyFile,
    copyDir,
    FILES_TO_COPY,
    DIRS_TO_COPY,
    EXCLUDE_PATTERNS,
    ROOT_DIR,
    DIST_DIR
};

// Run main if executed directly
if (require.main === module) {
    main();
}
