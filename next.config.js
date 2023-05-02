/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["cdn.sanity.io", "m.media-amazon.com"],
  },
  env: {
    SANITY_PROJECT_ID: process.env.REACT_APP_SANITY_PROJECT_ID,
    SANITY_TOKEN: process.env.REACT_APP_SANITY_TOKEN,
  },
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

module.exports = nextConfig;
