export default {
  name: 'comment',
  title: 'Comment',
  type: 'document',
  fields: [
    {
      name: 'person',
      title: 'Person',
      type: 'reference',
      to: [{type: 'person'}],
    },
    {
      name: 'comment',
      title: 'Comment',
      type: 'text',
    },
  ],
}
