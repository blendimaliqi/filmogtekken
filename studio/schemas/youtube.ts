export default {
  title: 'YouTube',
  name: 'youtube',
  type: 'object',
  fields: [
    {
      title: 'Youtube video id',
      name: 'videoId',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
  ],
}
