'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { resourcesApi } from '@/lib/api'

interface CreateResourceDialogProps {
  pageId: number
  onResourceCreated: () => void
}

export function CreateResourceDialog({ pageId, onResourceCreated }: CreateResourceDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [resourceType, setResourceType] = useState<'video' | 'photo' | 'document' | 'music_sheet'>('video')
  const [externalUrl, setExternalUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'file' | 'url'>('file')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'file' && file) {
        await resourcesApi.upload(pageId, file, title, description, resourceType)
      } else if (mode === 'url' && externalUrl) {
        await resourcesApi.create({
          page_id: pageId,
          title,
          description,
          resource_type: resourceType,
          external_url: externalUrl,
        })
      }
      setTitle('')
      setDescription('')
      setExternalUrl('')
      setFile(null)
      setMode('file')
      setOpen(false)
      onResourceCreated()
    } catch (error: any) {
      console.error('Failed to create resource:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create resource'
      alert(`Failed to create resource: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Resource</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
            <DialogDescription>
              Add a new resource to this page. You can upload a file or link to an external URL.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="mode">Source</Label>
              <Select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'file' | 'url')}
              >
                <option value="file">Upload File</option>
                <option value="url">External URL</option>
              </Select>
            </div>

            {mode === 'file' ? (
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required={mode === 'file'}
                />
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="url">URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  required={mode === 'url'}
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="resourceType">Resource Type</Label>
              <Select
                id="resourceType"
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value as any)}
              >
                <option value="video">Video</option>
                <option value="photo">Photo</option>
                <option value="document">Document</option>
                <option value="music_sheet">Music Sheet</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

