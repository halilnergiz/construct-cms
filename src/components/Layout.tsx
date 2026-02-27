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
        <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-6">
          <FolderKanban className="h-6 w-6 text-sky-400" />
          <span className="text-lg font-bold tracking-tight">Construct CMS</span>
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

      {/* // TODO: Header ve sayfa başlıkları aynı oluyor, header'a veya sayfalardaki başlıklara gerek yok */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center gap-4 border-b border-slate-200 bg-white px-6"> 
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 lg:hidden"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <h1 className="text-lg font-semibold text-slate-800">
            {([...navItems, profileNavItem].find((i) => i.to === location.pathname)?.label ?? 'Construct CMS')}
          </h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
