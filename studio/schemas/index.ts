import blockContent from './blockContent'
import crewMember from './crewMember'
import castMember from './castMember'
import movie from './movie'
import person from './person'
import plotSummary from './plotSummary'
import plotSummaries from './plotSummaries'

import youtube from './youtube'

export const schemaTypes = [
  // Document types
  movie,
  person,
  youtube,

  // Other types
  blockContent,
  plotSummary,
  plotSummaries,
  castMember,
  crewMember,
]
