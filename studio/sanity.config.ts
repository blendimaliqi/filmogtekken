import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
//import {googleMapsInput} from '@sanity/google-maps-input'
import {schemaTypes} from './schemas'

// Determine which dataset to use based on custom environment variable
const dataset = process.env.SANITY_DATASET || 'dev'

// Debug which dataset is being used
console.log("Sanity Studio using dataset:", dataset);
console.log("Environment variables:", {
  SANITY_DATASET: process.env.SANITY_DATASET,
  NODE_ENV: process.env.NODE_ENV
});

export default defineConfig({
  name: 'default',
  title: 'filmogtekken',

  projectId: 'mp1k1dez',
  dataset: dataset,

  plugins: [
    deskTool(),
    visionTool(),
    //googleMapsInput(),
  ],

  schema: {
    types: schemaTypes,
  },
})
