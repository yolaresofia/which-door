import {defineField, defineType} from 'sanity'
import {TextIcon} from '@sanity/icons'

export const infoSection = defineType({
  name: 'infoSection',
  title: 'Info Section',
  type: 'object',
  icon: TextIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
    }),
    defineField({
      name: 'subheading',
      title: 'Subheading',
      type: 'string',
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'blockContent',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'video',
      title: 'Video',
      type: 'file',
      options: { accept: 'video/*' },
    }),
    defineField({
      name: 'hlsPlaylist',
      title: 'HLS playlist (.m3u8)',
      type: 'file',
      description: 'Upload a HLS manifest for this section',
      options: { accept: '.m3u8,application/vnd.apple.mpegurl,application/x-mpegURL' },
    }),
    defineField({
      name: 'hlsSegment',
      title: 'HLS segment (.ts)',
      type: 'file',
      description: 'Upload a transport stream segment if you need to store a .ts with this section',
      options: { accept: '.ts,video/mp2t,video/MP2T' },
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'subheading',
    },
    prepare({title}) {
      return {
        title: title || 'Untitled Info Section',
        subtitle: 'Info Section',
      }
    },
  },
})
