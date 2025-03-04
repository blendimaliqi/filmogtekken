This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Development Environment Setup

This project uses environment variables for configuration. To set up your environment:

1. Rename `env.example` to `.env.development` and `.env.production` for your development and production environments respectively
2. Update the values in these files with your actual API keys and secrets
3. The `.env.local` file will be automatically created when you run one of the environment switching scripts

### Switching Between Environments

The project includes scripts to easily switch between development and production environments:

- `npm run dev:local` - Run the development server with development environment variables (uses `.env.development`)
- `npm run dev:prod` - Run the development server with production environment variables (uses `.env.production`)
- `npm run dev` - Run the development server with the current environment variables in `.env.local`

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
  - `SANITY_DATASET` - Sanity dataset to use ('dev' or 'production')
  - `NEXT_PUBLIC_SANITY_DATASET` - Client-side accessible version of SANITY_DATASET

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

## Sanity Studio

The project includes a Sanity Studio for content management. To run the Sanity Studio:

```bash
# Navigate to the studio directory
cd studio

# Use development environment
npm run dev:local

# Or use production environment
npm run dev:prod
```

Open [http://localhost:3333](http://localhost:3333) with your browser to access the Sanity Studio.

**Important**: When switching between development and production environments, you need to run the corresponding environment script for both the Next.js app and the Sanity Studio to ensure they're both using the same dataset.
