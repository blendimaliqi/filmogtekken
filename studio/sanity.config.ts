import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'
//import {googleMapsInput} from '@sanity/google-maps-input'
import {schemaTypes} from './schemas'

const dataset = process.env.SANITY_DATASET || 'dev'

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
