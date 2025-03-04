/**
 * Script to update the .env.development file with the correct NEXTAUTH_URL
 * Run with: node scripts/update-env.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envFile = path.join(__dirname, '..', '.env.development');

// Check if .env.development exists
if (!fs.existsSync(envFile)) {
  console.error('Error: .env.development file does not exist');
  process.exit(1);
}

// Read the current .env.development file
const envContent = fs.readFileSync(envFile, 'utf8');

console.log('Current redirect URIs in your Discord Developer Portal:');
console.log('1. https://filmogtekken-blendimaliqi.vercel.app/api/auth/callback/discord');
console.log('2. localhost:3000/api/auth/callback/discord');
console.log('3. http://localhost:3000/');
console.log('\nYour NEXTAUTH_URL should match one of these formats.');

rl.question('\nEnter the NEXTAUTH_URL to use (default: http://localhost:3000): ', (answer) => {
  const nextAuthUrl = answer.trim() || 'http://localhost:3000';
  
  // Update the NEXTAUTH_URL in the .env.development file
  const updatedContent = envContent.replace(
    /NEXTAUTH_URL=.*/,
    `NEXTAUTH_URL=${nextAuthUrl}`
  );
  
  fs.writeFileSync(envFile, updatedContent);
  
  console.log(`\nUpdated NEXTAUTH_URL to: ${nextAuthUrl}`);
  console.log('\nImportant: Make sure this URL exactly matches one of the redirect URIs in your Discord developer portal.');
  console.log('The callback URL that NextAuth will use is: ' + nextAuthUrl + '/api/auth/callback/discord');
  
  rl.close();
});
