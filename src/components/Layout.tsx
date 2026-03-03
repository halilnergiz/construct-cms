import { useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import {
  CircleUserRound,
  LayoutDashboard,
  FolderKanban,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projeler', icon: FolderKanban },
]

const profileNavItem = { to: '/profile', label: 'Profil', icon: CircleUserRound }

export default function Layout() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarCompanyName =
    typeof user?.user_metadata?.company_name === 'string' &&
    user.user_metadata.company_name.trim().length > 0
      ? user.user_metadata.company_name.trim()
      : 'Firma İsmi'
  const sidebarLogoUrl =
    typeof user?.user_metadata?.avatar_url === 'string' &&
    user.user_metadata.avatar_url.length > 0
      ? user.user_metadata.avatar_url
      : null

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-slate-900 text-white transition-transform lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-slate-700 px-4 py-4">
          <div className="flex items-center gap-3">
            {sidebarLogoUrl ? (
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-700 bg-white/5">
                <img
                  src={sidebarLogoUrl}
                  alt="Firma logosu"
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-500 text-xs font-medium tracking-tight text-slate-300">
                Logo
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p
                className="mt-1 overflow-hidden text-lg font-semibold leading-5 text-slate-100"
                style={{ display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}
                title={sidebarCompanyName}
              >
                {sidebarCompanyName}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              item.to === '/projects'
                ? location.pathname.startsWith('/projects')
                : location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-slate-700 p-4">
          <Link
            to={profileNavItem.to}
            onClick={() => setSidebarOpen(false)}
            className={`mb-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              location.pathname === profileNavItem.to
                ? 'bg-slate-800 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <profileNavItem.icon className="h-4 w-4" />
            {profileNavItem.label}
          </Link>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Çıkış Yap
          </button>
          <div className="mt-3 ml-3 truncate text-xs text-slate-400">
            {user?.email}
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="border-b border-slate-200 bg-white px-6 py-3 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 lg:hidden"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
