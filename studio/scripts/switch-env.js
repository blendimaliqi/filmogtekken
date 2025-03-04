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
const parentDir = path.resolve(rootDir, '..');

// Source files
const devEnvFile = path.join(parentDir, '.env.development');
const prodEnvFile = path.join(parentDir, '.env.production');

// Target file
const targetFile = path.join(rootDir, '.env');

// Determine which source file to use
const sourceFile = env === 'production' ? prodEnvFile : devEnvFile;

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Source file ${path.basename(sourceFile)} does not exist`);
  process.exit(1);
}

try {
  // Read the source file
  const envContent = fs.readFileSync(sourceFile, 'utf8');
  
  // Extract the SANITY_DATASET value
  let dataset;
  const datasetMatch = envContent.match(/SANITY_DATASET=(\w+)/);
  const publicDatasetMatch = envContent.match(/NEXT_PUBLIC_SANITY_DATASET=(\w+)/);
  
  if (datasetMatch) {
    dataset = datasetMatch[1];
  } else if (publicDatasetMatch) {
    dataset = publicDatasetMatch[1];
  } else {
    console.error(`Error: Neither SANITY_DATASET nor NEXT_PUBLIC_SANITY_DATASET found in ${path.basename(sourceFile)}`);
    process.exit(1);
  }
  
  // Create or update the .env file for the studio
  fs.writeFileSync(targetFile, `SANITY_DATASET=${dataset}\n`);
  
  console.log(`Successfully switched to ${env} environment`);
  console.log(`Set SANITY_DATASET=${dataset} in studio/.env`);
} catch (error) {
  console.error('Error switching environments:', error.message);
  process.exit(1);
}
