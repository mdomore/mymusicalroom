'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, ChevronDown, ChevronUp, Trash2, Edit } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type Resource, resourcesApi } from '@/lib/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'

interface ResourceItemProps {
  resource: Resource
  pageId: number
  onUpdated: () => void
  onDeleted: () => void
  isAuthenticated?: boolean
}

export function ResourceItem({ resource, pageId, onUpdated, onDeleted, isAuthenticated = false }: ResourceItemProps) {
  const [isExpanded, setIsExpanded] = useState(resource.is_expanded)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [title, setTitle] = useState(resource.title)
  const [description, setDescription] = useState(resource.description || '')
  const [loading, setLoading] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: resource.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleToggleExpand = async () => {
    const newExpanded = !isExpanded
    setIsExpanded(newExpanded)
    try {
      await resourcesApi.update(resource.id, { is_expanded: newExpanded })
    } catch (error) {
      console.error('Failed to update resource:', error)
      setIsExpanded(!newExpanded) // Revert on error
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    try {
      await resourcesApi.delete(resource.id)
      onDeleted()
    } catch (error) {
      console.error('Failed to delete resource:', error)
      alert('Failed to delete resource')
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      await resourcesApi.update(resource.id, {
        title,
        description: description || undefined,
      })
      setEditDialogOpen(false)
      onUpdated()
    } catch (error) {
      console.error('Failed to update resource:', error)
      alert('Failed to update resource')
    } finally {
      setLoading(false)
    }
  }

  const renderResourceContent = () => {
    if (resource.external_url) {
      // YouTube or other external video
      if (resource.resource_type === 'video' && resource.external_url.includes('youtube.com')) {
        const videoId = resource.external_url.includes('youtu.be')
          ? resource.external_url.split('/').pop()?.split('?')[0]
          : new URL(resource.external_url).searchParams.get('v')
        
        if (videoId) {
          return (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-md"
              />
            </div>
          )
        }
      }
      return (
        <a
          href={resource.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {resource.external_url}
        </a>
      )
    } else if (resource.file_path) {
      // Local file
      const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/resources/file/${resource.file_path}`
      
      if (resource.resource_type === 'video') {
        return (
          <video controls className="w-full h-auto -ml-4 sm:-ml-6 rounded-r-md sm:rounded-md max-h-[70vh]" src={fileUrl}>
            Your browser does not support the video tag.
          </video>
        )
      } else if (resource.resource_type === 'photo') {
        return <img src={fileUrl} alt={resource.title} className="w-full -ml-4 sm:-ml-6 rounded-r-md sm:rounded-md" />
      } else {
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Download {resource.title}
          </a>
        )
      }
    }
    return null
  }

  return (
    <>
      <Card ref={setNodeRef} style={style} className="relative overflow-hidden">
        <div className="flex items-start gap-2 sm:gap-3">
          {isAuthenticated && (
            <button
              {...attributes}
              {...listeners}
              className="mt-4 sm:mt-6 p-2 sm:p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none flex-shrink-0"
              aria-label="Drag to reorder"
            >
              <GripVertical className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="flex-1 min-w-0 pr-2">
                  <CardTitle 
                    className={`${isAuthenticated ? "cursor-pointer hover:text-primary" : ""} text-base sm:text-lg font-semibold break-words leading-tight`} 
                    onClick={isAuthenticated ? handleToggleExpand : undefined}
                    title={resource.title}
                  >
                    {resource.title}
                  </CardTitle>
                  {resource.description && (
                    <CardDescription className="mt-1.5 line-clamp-2 sm:line-clamp-none text-sm">
                      {resource.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1 sm:gap-1.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleExpand}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                    aria-label={isExpanded ? "Collapse" : "Expand"}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </Button>
                  {isAuthenticated && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setTitle(resource.title)
                          setDescription(resource.description || '')
                          setEditDialogOpen(true)
                        }}
                        className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                        aria-label="Edit resource"
                      >
                        <Edit className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleDelete} 
                        className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
                        aria-label="Delete resource"
                      >
                        <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="p-4 sm:p-6 pt-0">
                {renderResourceContent()}
              </CardContent>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
            <DialogDescription>Update the resource details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleUpdate} disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

