const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rootDir = path.resolve(__dirname, '..');
const devEnvFile = path.join(rootDir, '.env.development');
const prodEnvFile = path.join(rootDir, '.env.local');

// Function to update an environment file
function updateEnvFile(filePath, dataset) {
  if (!fs.existsSync(filePath)) {
    console.error(`Error: File ${filePath} does not exist`);
    return false;
  }

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if SANITY_DATASET already exists
    const hasDataset = content.match(/SANITY_DATASET=/);
    const hasPublicDataset = content.match(/NEXT_PUBLIC_SANITY_DATASET=/);
    
    if (hasDataset) {
      // Replace existing SANITY_DATASET
      content = content.replace(/SANITY_DATASET=\w+/, `SANITY_DATASET=${dataset}`);
    } else {
      // Add SANITY_DATASET
      content += `\nSANITY_DATASET=${dataset}`;
    }
    
    if (hasPublicDataset) {
      // Replace existing NEXT_PUBLIC_SANITY_DATASET
      content = content.replace(/NEXT_PUBLIC_SANITY_DATASET=\w+/, `NEXT_PUBLIC_SANITY_DATASET=${dataset}`);
    } else {
      // Add NEXT_PUBLIC_SANITY_DATASET
      content += `\nNEXT_PUBLIC_SANITY_DATASET=${dataset}`;
    }
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${path.basename(filePath)} with dataset ${dataset}`);
    return true;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Update both environment files
const devSuccess = updateEnvFile(devEnvFile, 'dev');
const prodSuccess = updateEnvFile(prodEnvFile, 'production');

if (devSuccess && prodSuccess) {
  console.log('\nBoth environment files updated successfully!');
  console.log('\nTo switch to development environment:');
  console.log('  npm run dev:local');
  console.log('  cd studio && npm run dev:local');
  console.log('\nTo switch to production environment:');
  console.log('  npm run dev:prod');
  console.log('  cd studio && npm run dev:prod');
} else {
  console.error('\nFailed to update one or both environment files.');
}
