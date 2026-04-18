import { defineConfig } from 'orval'

export default defineConfig({
  Admin: {
    input: './public/openapi.json',
    output: {
      mode: 'tags-split',
      target: './src/lib/api/generated',
      schemas: './src/lib/api/generated/schemas',
      clean: true,
      client: 'react-query',
      tsconfig: './tsconfig.app.json',
      override: {
        mutator: {
          path: './src/lib/api/client.ts',
          name: 'customFetch',
        },
        query: {
          useQuery: true,
          useSuspenseQuery: true,
          version: 5,
        },
      },
    },
  },
})
