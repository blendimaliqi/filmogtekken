const fs = require('fs');
const path = require('path');

// Get the environment from command line arguments
const args = process.argv.slice(2);
const env = args[0] || 'development';

if (!['development', 'production'].includes(env)) {
  console.error('Error: Environment must be either "development" or "production"');
  process.exit(1);
}

const rootDir = path.resolve(__dirname, '..');

// Source files
const devEnvFile = path.join(rootDir, '.env.development');
const prodEnvFile = path.join(rootDir, '.env.production');

// Target file (always .env.local)
const targetFile = path.join(rootDir, '.env.local');

// Determine which source file to use
const sourceFile = env === 'production' ? prodEnvFile : devEnvFile;

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Source file ${path.basename(sourceFile)} does not exist`);
  process.exit(1);
}

try {
  // Copy the source file to .env.local
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Successfully switched to ${env} environment`);
  console.log(`Copied ${path.basename(sourceFile)} to .env.local`);
  
  // Also create a .env file in the studio directory with the SANITY_DATASET variable
  const studioEnvFile = path.join(rootDir, 'studio', '.env');
  
  // Read the source file to extract the SANITY_DATASET value
  const envContent = fs.readFileSync(sourceFile, 'utf8');
  const datasetMatch = envContent.match(/SANITY_DATASET=(\w+)/);
  
  if (datasetMatch) {
    const dataset = datasetMatch[1];
    fs.writeFileSync(studioEnvFile, `SANITY_DATASET=${dataset}\n`);
    console.log(`Set SANITY_DATASET=${dataset} in studio/.env`);
  } else {
    console.warn(`Warning: SANITY_DATASET not found in ${path.basename(sourceFile)}`);
  }
} catch (error) {
  console.error('Error switching environments:', error.message);
  process.exit(1);
}
