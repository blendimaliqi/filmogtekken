// video.js

export default {
  title: 'Video',
  name: 'video',
  type: 'document',
  fields: [
    {
      title: 'Title',
      name: 'title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      title: 'Author',
      name: 'author',
      type: 'string',
    },
    {
      title: 'Video File',
      name: 'videoFile',
      type: 'file',
      options: {
        accept: 'video/mp4,video/x-matroska',
      },
      validation: (Rule: any) => Rule.required(),
    },
  ],
}
