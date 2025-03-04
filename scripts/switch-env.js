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
const envFile = env === 'production' ? '.env.local' : '.env.development';
const targetFile = path.join(rootDir, '.env.local');
const sourceFile = path.join(rootDir, envFile);

// Check if source file exists
if (!fs.existsSync(sourceFile)) {
  console.error(`Error: Source file ${envFile} does not exist`);
  process.exit(1);
}

try {
  // Copy the source file to .env.local
  fs.copyFileSync(sourceFile, targetFile);
  console.log(`Successfully switched to ${env} environment`);
  console.log(`Copied ${envFile} to .env.local`);
} catch (error) {
  console.error('Error switching environments:', error.message);
  process.exit(1);
}
