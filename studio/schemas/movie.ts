import {defineField, defineType} from 'sanity'
import {MdLocalMovies as icon} from 'react-icons/md'

export default defineType({
  name: 'movie',
  title: 'Movie',
  type: 'document',
  icon,
  fields: [
    defineField({
      name: 'comments',
      title: 'Comments',
      type: 'array',
      of: [
        {type: 'reference', to: [{type: 'comment'}]},
        {
          type: 'object',
          name: 'inlineComment',
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
            {
              name: 'createdAt',
              title: 'Created At',
              type: 'datetime',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required().error('Title is required'),
    }),
    defineField({
      name: 'ratings',
      title: 'Ratings',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'person',
              title: 'Person',
              type: 'reference',
              to: [{type: 'person'}],
            },
            {
              name: 'rating',
              title: 'Rating',
              type: 'number',
            },
          ],
        },
      ],
    }),

    defineField({
      name: 'length',
      title: 'Length',
      type: 'number',
    }),
    defineField({
      name: 'plot',
      title: 'Plot',
      type: 'text',
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 100,
      },
      validation: (Rule: any) => Rule.required().error('Slug is required'),
    }),
    defineField({
      name: 'overview',
      title: 'Overview',
      type: 'blockContent',
    }),
    defineField({
      name: 'releaseDate',
      title: 'Release date',
      type: 'datetime',
    }),
    defineField({
      name: 'poster',
      title: 'Poster Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required().error('Poster is required'),
    }),
    //genres movie
    defineField({
      name: 'genres',
      title: 'Genres',
      type: 'array',
      //type string
      of: [{type: 'string'}],
    }),

    defineField({
      name: 'poster_backdrop',
      title: 'Poster Backdrop Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: (Rule: any) => Rule.required().error('Poster Backdrop Image is required'),
    }),

    defineField({
      name: 'externalId',
      title: 'External ID',
      type: 'number',
    }),
    defineField({
      name: 'popularity',
      title: 'Popularity',
      type: 'number',
    }),
    defineField({
      name: 'castMembers',
      title: 'Cast Members',
      type: 'array',
      of: [{type: 'castMember'}],
    }),
    defineField({
      name: 'crewMembers',
      title: 'Crew Members',
      type: 'array',
      of: [{type: 'crewMember'}],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      date: 'releaseDate',
      media: 'poster',
      castName0: 'castMembers.0.person.name',
      castName1: 'castMembers.1.person.name',
    },
    prepare(selection: any) {
      const year = selection.date && selection.date.split('-')[0]
      const cast = [selection.castName0, selection.castName1].filter(Boolean).join(', ')

      return {
        title: `${selection.title} ${year ? `(${year})` : ''}`,
        date: selection.date,
        subtitle: cast,
        media: selection.media,
      }
    },
  },
})
