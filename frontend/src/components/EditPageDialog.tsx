'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { Select } from '@/components/ui/select'
import { pagesApi, type Page } from '@/lib/api'

interface EditPageDialogProps {
  page: Page | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPageUpdated: () => void
}

export function EditPageDialog({ page, open, onOpenChange, onPageUpdated }: EditPageDialogProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'song' | 'technical'>('song')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (page) {
      setName(page.name)
      setType(page.type)
    }
  }, [page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!page) return
    
    setLoading(true)
    try {
      await pagesApi.update(page.id, { name, type })
      onOpenChange(false)
      onPageUpdated()
    } catch (error) {
      console.error('Failed to update page:', error)
      alert('Failed to update page')
    } finally {
      setLoading(false)
    }
  }

  if (!page) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Update the page name and type.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select
                id="edit-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'song' | 'technical')}
              >
                <option value="song">Song</option>
                <option value="technical">Technical</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
