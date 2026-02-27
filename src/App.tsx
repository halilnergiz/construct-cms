import { BrowserRouter, Routes, Route } from 'react-router'

import { Layout, ProtectedRoute, AuthCallback } from '@/components'
import {
  DashboardPage,
  LoginPage,
  ProfilePage,
  ProjectFormPage,
  ProjectPreviewPage,
  ProjectsPage,
  SetPasswordPage,
} from '@/pages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
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
    </BrowserRouter>
  )
}
