/**
 * Script to generate a secure random string for NextAuth secret
 * Run with: node scripts/generate-secret.js
 */

const crypto = require('crypto');

// Generate a random string that is suitable for use as a NextAuth secret
function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

const secret = generateSecret();
console.log('Generated NextAuth Secret:');
console.log(secret);
console.log('\nAdd this to your .env.development file as:');
console.log(`NEXTAUTH_SECRET="${secret}"`);
