import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { PageLayout } from '@/components/layout/PageLayout'
import { HomePage } from '@/pages/HomePage'
import { UploadPage } from '@/pages/UploadPage'
import { DropDetailPage } from '@/pages/DropDetailPage'
import { EditDropPage } from '@/pages/EditDropPage'
import { MyDropsPage } from '@/pages/MyDropsPage'
import { DigestPage } from '@/pages/DigestPage'
import { SynthesizedPage } from '@/pages/SynthesizedPage'
import { SynthesisDetailPage } from '@/pages/SynthesisDetailPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PageLayout>
        <HomePage />
      </PageLayout>
    ),
  },
  {
    path: '/upload',
    element: (
      <PageLayout withSidebar={false}>
        <UploadPage />
      </PageLayout>
    ),
  },
  {
    path: '/drops/:id',
    element: (
      <PageLayout withSidebar={false}>
        <DropDetailPage />
      </PageLayout>
    ),
  },
  {
    path: '/drops/:id/edit',
    element: (
      <PageLayout>
        <EditDropPage />
      </PageLayout>
    ),
  },
  {
    path: '/my-drops',
    element: (
      <PageLayout>
        <MyDropsPage />
      </PageLayout>
    ),
  },
  {
    path: '/digest',
    element: (
      <PageLayout>
        <DigestPage />
      </PageLayout>
    ),
  },
  {
    path: '/synthesized',
    element: (
      <PageLayout>
        <SynthesizedPage />
      </PageLayout>
    ),
  },
  {
    path: '/synthesized/:id',
    element: (
      <PageLayout>
        <SynthesisDetailPage />
      </PageLayout>
    ),
  },
  {
    path: '/settings',
    element: (
      <PageLayout>
        <SettingsPage />
      </PageLayout>
    ),
  },
  {
    path: '/404',
    element: (
      <PageLayout>
        <NotFoundPage />
      </PageLayout>
    ),
  },
  { path: '*', element: <Navigate to="/404" replace /> },
])

export function Routes() {
  return <RouterProvider router={router} />
}
