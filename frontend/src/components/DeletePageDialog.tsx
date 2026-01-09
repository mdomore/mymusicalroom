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
} from '@/components/ui/dialog'
import { pagesApi, type Page } from '@/lib/api'

interface DeletePageDialogProps {
  page: Page | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPageDeleted: () => void
}

export function DeletePageDialog({ page, open, onOpenChange, onPageDeleted }: DeletePageDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!page) return
    
    setLoading(true)
    try {
      await pagesApi.delete(page.id)
      onOpenChange(false)
      onPageDeleted()
    } catch (error) {
      console.error('Failed to delete page:', error)
      alert('Failed to delete page')
    } finally {
      setLoading(false)
    }
  }

  if (!page) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle>Delete Page</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{page.name}"? This action cannot be undone and will also delete all resources in this page.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
