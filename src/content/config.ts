import { defineCollection, z } from 'astro:content';

const videosCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.date(),
    description: z.string(),
    category: z.enum([
      'tutorial',
      'presentation', 
      'demo',
      'webinar',
      'vlog',
      'interview',
      'other'
    ]),
    tags: z.array(z.enum([
      'frontend',
      'backend',
      'astro',
      'vuejs',
      'typescript',
      'javascript',
      'css',
      'devops',
      'database',
      'api',
      'mobile',
      'performance',
      'security',
      'design',
      'ux-ui'
    ])),
    thumbnail: z.string().optional(),
    videoFile: z.string(),
    duration: z.number().int().nonnegative().optional(),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  videos: videosCollection,
};