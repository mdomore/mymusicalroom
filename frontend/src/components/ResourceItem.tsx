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
}

export function ResourceItem({ resource, pageId, onUpdated, onDeleted }: ResourceItemProps) {
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
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-md"
            />
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
          <video controls className="w-full rounded-md" src={fileUrl}>
            Your browser does not support the video tag.
          </video>
        )
      } else if (resource.resource_type === 'photo') {
        return <img src={fileUrl} alt={resource.title} className="w-full rounded-md" />
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
      <Card ref={setNodeRef} style={style} className="relative">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-6 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          >
            <GripVertical className="h-5 w-5" />
          </button>

          <div className="flex-1">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="cursor-pointer" onClick={handleToggleExpand}>
                  {resource.title}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleExpand}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setTitle(resource.title)
                      setDescription(resource.description || '')
                      setEditDialogOpen(true)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {resource.description && (
                <CardDescription>{resource.description}</CardDescription>
              )}
            </CardHeader>

            {isExpanded && (
              <CardContent>
                {renderResourceContent()}
              </CardContent>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
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

