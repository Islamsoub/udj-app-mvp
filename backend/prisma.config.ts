import path from 'path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrate: {
    adapter: async () => {
      const { PrismaNeon } = await import('@prisma/adapter-neon')
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL!)
      return new PrismaNeon(sql)
    },
  },
})
