export type Post = {
  slug: string
  title: string
  description: string
  published: string
  updated: string
}

export const posts: Post[] = [
  {
    slug: "tablet-for-handwritten-notes",
    title: "How to choose a tablet for handwritten notes",
    description:
      "What a tablet for handwritten notes needs in India: a named active pen, palm rejection and the full setup cost, with dated prices for verified setups.",
    published: "2026-11-26",
    updated: "2026-11-26",
  },
]

export const postPath = (post: Post) => `/blog/${post.slug}/`

export const postBySlug = (slug: string) =>
  posts.find((post) => post.slug === slug)!
