/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["cdn.sanity.io"],
  },
  env: {
    SANITY_PROJECT_ID: process.env.REACT_APP_SANITY_PROJECT_ID,
    SANITY_TOKEN: process.env.REACT_APP_SANITY_TOKEN,
  },
};

module.exports = nextConfig;
