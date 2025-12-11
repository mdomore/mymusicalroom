'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { pagesApi, resourcesApi, type Page, type Resource } from '@/lib/api'
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

  useEffect(() => {
    if (pageId) {
      loadPage()
      loadResources()
    }
  }, [pageId])

  const loadPage = async () => {
    try {
      const response = await pagesApi.getById(pageId)
      setPage(response.data)
    } catch (error) {
      console.error('Failed to load page:', error)
    }
  }

  const loadResources = async () => {
    try {
      const response = await resourcesApi.getAll(pageId)
      setResources(response.data)
    } catch (error) {
      console.error('Failed to load resources:', error)
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
    <div className="container mx-auto p-8">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.push('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-4xl font-bold">{page.name}</h1>
      </div>

      <div className="mb-6">
        <CreateResourceDialog pageId={pageId} onResourceCreated={handleResourceCreated} />
      </div>

      <ResourceList
        resources={resources}
        pageId={pageId}
        onResourceUpdated={handleResourceUpdated}
        onResourceDeleted={handleResourceDeleted}
        onReorder={async (orders) => {
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

