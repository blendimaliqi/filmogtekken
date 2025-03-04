import { defineCliConfig } from '@sanity/cli';

// Determine which dataset to use based on environment
const dataset = process.env.NODE_ENV === 'development' ? 'dev' : 'production';

export default defineCliConfig({
  api: {
    projectId: 'mp1k1dez',
    dataset: dataset
  }
})
