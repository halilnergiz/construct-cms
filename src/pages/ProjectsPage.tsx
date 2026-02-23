import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import type { Project } from '@/types/project';

type FilterStatus = 'all' | 'published' | 'draft';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const fetchProjects = async () => {
      let query = supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (!ignore) {
        if (!error && data) {
          setProjects(data as Project[]);
        }
        setLoading(false);
      }
    };

    fetchProjects();

    return () => {
      ignore = true;
    };
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;

    setDeletingId(id);
    const project = projects.find((p) => p.id === id);

    if (project?.cover_image) {
      const path = extractStoragePath(project.cover_image);
      if (path) {
        await supabase.storage.from('project-images').remove([path]);
      }
    }

    if (project?.images?.length) {
      const paths = project.images
        .map(extractStoragePath)
        .filter(Boolean) as string[];
      if (paths.length) {
        await supabase.storage.from('project-images').remove(paths);
      }
    }

    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
    setDeletingId(null);
  };

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-slate-900'>Projeler</h2>
          <p className='mt-1 text-sm text-slate-500'>Tüm projeleri yönetin</p>
        </div>
        <Link
          to='/projects/new'
          className='flex items-center gap-2 self-start rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800'
        >
          <Plus className='h-4 w-4' />
          Yeni Proje
        </Link>
      </div>

      <div className='flex gap-2'>
        {(['all', 'published', 'draft'] as FilterStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => {
              setLoading(true);
              setFilter(status);
            }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${filter === status
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
          >
            {status === 'all'
              ? 'Tümü'
              : status === 'published'
                ? 'Yayında'
                : 'Taslak'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className='flex justify-center py-12'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-slate-800' />
        </div>
      ) : projects.length === 0 ? (
        <div className='rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center'>
          <p className='text-slate-500'>Henüz proje eklenmemiş</p>
          <Link
            to='/projects/new'
            className='mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700'
          >
            <Plus className='h-4 w-4' />
            İlk projeyi ekle
          </Link>
        </div>
      ) : (
        <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500'>
                <th className='px-6 py-3'>Proje</th>
                <th className='hidden px-6 py-3 sm:table-cell'>Kategori</th>
                <th className='px-6 py-3'>Durum</th>
                <th className='px-6 py-3 text-right'>İşlemler</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-200'>
              {projects.map((project) => (
                <tr key={project.id} className='hover:bg-slate-50'>
                  <td className='px-6 py-4'>
                    <div className='flex items-center gap-3'>
                      {project.cover_image ? (
                        <img
                          src={project.cover_image}
                          alt={project.title}
                          className='h-10 w-10 rounded-lg object-cover'
                        />
                      ) : (
                        <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400'>
                          <Eye className='h-4 w-4' />
                        </div>
                      )}
                      <div>
                        <p className='font-medium text-slate-900'>
                          {project.title}
                        </p>
                        <p className='text-xs text-slate-500'>
                          /{project.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className='hidden px-6 py-4 text-sm text-slate-600 sm:table-cell'>
                    {project.category ?? '—'}
                  </td>
                  <td className='px-6 py-4'>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${project.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                        }`}
                    >
                      {project.status === 'published' ? (
                        <Eye className='h-3 w-3' />
                      ) : (
                        <EyeOff className='h-3 w-3' />
                      )}
                      {project.status === 'published' ? 'Yayında' : 'Taslak'}
                    </span>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex items-center justify-end gap-2'>
                      <Link
                        to={`/projects/${project.id}/edit`}
                        className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700'
                      >
                        <Pencil className='h-4 w-4' />
                      </Link>
                      <button
                        onClick={() => handleDelete(project.id)}
                        disabled={deletingId === project.id}
                        className='rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function extractStoragePath(url: string): string | null {
  const match = url.match(/project-images\/(.+)$/);
  return match ? match[1] : null;
}
