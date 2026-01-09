'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pagesApi, resourcesApi, type Page, type Resource, getAuthToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceList } from '@/components/ResourceList'
import { CreateResourceDialog } from '@/components/CreateResourceDialog'
import { ArrowLeft } from 'lucide-react'

export default function PageDetail() {
  const params = useParams()
  const router = useRouter()
  const pageId = parseInt(params.id as string)
  const [page, setPage] = useState<Page | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getAuthToken()
      setIsAuthenticated(!!token)
    }
    checkAuth()
    if (pageId) {
      loadPage()
      loadResources()
    }
  }, [pageId])

  const loadPage = async () => {
    try {
      const response = await pagesApi.getById(pageId)
      setPage(response.data)
      setIsAuthenticated(true)
    } catch (error: any) {
      console.error('Failed to load page:', error)
      if (error.response?.status === 401) {
        setIsAuthenticated(false)
      }
    }
  }

  const loadResources = async () => {
    try {
      const response = await resourcesApi.getAll(pageId)
      setResources(response.data)
    } catch (error: any) {
      console.error('Failed to load resources:', error)
      if (error.response?.status === 401) {
        setIsAuthenticated(false)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResourceCreated = () => {
    loadResources()
  }

  const handleResourceUpdated = () => {
    loadResources()
  }

  const handleResourceDeleted = () => {
    loadResources()
  }

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }

  if (!page) {
    return <div className="container mx-auto p-8">Page not found</div>
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-8">
        <Button variant="ghost" onClick={() => router.push('/')} className="flex-shrink-0">
          <ArrowLeft className="mr-1 sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold break-words flex-1 min-w-0" title={page.name}>
          {page.name}
        </h1>
      </div>

      {isAuthenticated && (
        <div className="mb-4 sm:mb-6">
          <CreateResourceDialog pageId={pageId} onResourceCreated={handleResourceCreated} />
        </div>
      )}

      <ResourceList
        resources={resources}
        pageId={pageId}
        onResourceUpdated={handleResourceUpdated}
        onResourceDeleted={handleResourceDeleted}
        isAuthenticated={isAuthenticated}
        onReorder={async (orders) => {
          if (!isAuthenticated) return
          try {
            await resourcesApi.reorder(orders)
            loadResources()
          } catch (error) {
            console.error('Failed to reorder resources:', error)
          }
        }}
      />
    </div>
  )
}

