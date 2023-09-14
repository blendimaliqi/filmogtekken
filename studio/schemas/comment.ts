//comment sanity schema for movie

export default {
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    //make person field for comment
    {
      name: 'person',
      title: 'Person',
      type: 'reference',
      to: [{type: 'person'}],
    },
    {
      name: 'movie',
      title: 'Movie',
      type: 'reference',
      to: [{type: 'movie'}],
    },
    {
      name: 'comment',
      title: 'Comment',
      type: 'text',
    },
  ],
}
