/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      "cdn.sanity.io",
      "m.media-amazon.com",
      "api.themoviedb.org",
      "image.tmdb.org",
      "www.themoviedb.org",
      "localhost",
      "discord.com",
      "cdn.discordapp.com",
    ],
  },
  env: {
    SANITY_PROJECT_ID: process.env.REACT_APP_SANITY_PROJECT_ID,
    SANITY_TOKEN: process.env.REACT_APP_SANITY_TOKEN,
    TMDB_API_KEY: process.env.REACT_APP_TMDB_API_KEY,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID,
  },
};

module.exports = nextConfig;
