export interface ProjectLocation {
  city: string | null
  district: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
}

export interface Project {
  id: string
  title: string
  slug: string
  description: string | null
  content: string | null
  cover_image: string | null
  images: string[]
  category: string | null
  location?: ProjectLocation | null
  status: 'draft' | 'published'
  featured: boolean
  created_at: string
  updated_at: string
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>
export type ProjectUpdate = Partial<ProjectInsert>
