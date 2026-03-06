import { Route, Routes } from 'react-router'

import { AuthCallback, Layout, ProtectedRoute } from '@/components'
import { useProfileFavicon } from '@/hooks'
import {
  AccountSetupPage,
  DashboardPage,
  LoginPage,
  ProfilePage,
  ProjectFormPage,
  ProjectPreviewPage,
  ProjectsPage,
} from '@/pages'

export default function AppRoutes() {
  useProfileFavicon()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/account-setup" element={<AccountSetupPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="projects/new" element={<ProjectFormPage />} />
          <Route path="projects/:id" element={<ProjectPreviewPage />} />
          <Route path="projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}
