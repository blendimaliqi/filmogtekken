This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Development Environment Setup

This project uses environment variables for configuration. To set up a development environment:

1. Create a `.env.development` file in the root directory with your development environment variables
2. Create a `.env.local` file in the root directory with your production environment variables

### Switching Between Environments

The project includes scripts to easily switch between development and production environments:

- `npm run dev:local` - Run the development server with development environment variables
- `npm run dev:prod` - Run the development server with production environment variables
- `npm run dev` - Run the development server with the current environment variables

### Environment Variables

The following environment variables are used in this project:

- Discord Authentication:
  - `DISCORD_CLIENT_ID` - Discord OAuth client ID
  - `DISCORD_CLIENT_SECRET` - Discord OAuth client secret
  - `DISCORD_GUILD_ID` - Discord guild ID
  - `DISCORD_GUILD_ID2` - Secondary Discord guild ID

- NextAuth:
  - `NEXTAUTH_SECRET` - Secret for NextAuth
  - `NEXTAUTH_URL` - URL for NextAuth (use `http://localhost:3000` for local development)

- Sanity CMS:
  - `SANITY_PROJECT_ID` - Sanity project ID
  - `SANITY_TOKEN` - Sanity API token

- TMDB API:
  - `TMDB_API_KEY` - The Movie Database API key

## Getting Started

First, run the development server:

```bash
# Use development environment
npm run dev:local

# Or use production environment
npm run dev:prod
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
