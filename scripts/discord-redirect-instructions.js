/**
 * This script provides instructions for updating your Discord application redirect URIs
 */

console.log('=== Discord OAuth2 Redirect URI Instructions ===');
console.log('\nTo fix the "Invalid OAuth2 redirect_uri" error, follow these steps:');
console.log('\n1. Go to the Discord Developer Portal: https://discord.com/developers/applications');
console.log('2. Select your application (Client ID: 1119999195206656101)');
console.log('3. Go to the "OAuth2" section in the left sidebar');
console.log('4. Under "Redirects", make sure you have these exact URLs:');
console.log('   - https://filmogtekken-blendimaliqi.vercel.app/api/auth/callback/discord (for production)');
console.log('   - http://localhost:3000/api/auth/callback/discord (for local development)');
console.log('\nImportant: The format must be exact, including the http:// or https:// prefix and the /api/auth/callback/discord path');
console.log('\nAfter updating the redirect URIs:');
console.log('1. Save the changes in the Discord Developer Portal');
console.log('2. Run your application with: npm run dev:local');
console.log('3. Try logging in again');
console.log('\nNote: It may take a few minutes for Discord to update the redirect URI settings');
