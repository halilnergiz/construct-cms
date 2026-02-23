import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { FolderKanban, Eye, FileEdit, Plus } from 'lucide-react'

import { supabase } from '@/lib/supabase'

interface Stats {
  total: number
  published: number
  draft: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ total: 0, published: 0, draft: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from('projects')
        .select('status')

      if (!error && data) {
        setStats({
          total: data.length,
          published: data.filter((p) => p.status === 'published').length,
          draft: data.filter((p) => p.status === 'draft').length,
        })
      }
      setLoading(false)
    }
    fetchStats()
  }, [])

  const cards = [
    {
      label: 'Toplam Proje',
      value: stats.total,
      icon: FolderKanban,
      color: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Yayında',
      value: stats.published,
      icon: Eye,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Taslak',
      value: stats.draft,
      icon: FileEdit,
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">Projelerin genel durumu</p>
        </div>
        <Link
          to="/projects/new"
          className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          Yeni Proje
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{card.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
