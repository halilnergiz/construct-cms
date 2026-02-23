export interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  cover_image: string | null
  images: string[]
  category: string | null
  status: 'draft' | 'published'
  featured: boolean
  created_at: string
  updated_at: string
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>
export type ProjectUpdate = Partial<ProjectInsert>
