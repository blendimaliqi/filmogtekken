import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
//import {googleMapsInput} from '@sanity/google-maps-input'
import {schemaTypes} from './schemas'

// Determine which dataset to use based on environment
const dataset = process.env.NODE_ENV === 'development' ? 'dev' : 'production'

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
