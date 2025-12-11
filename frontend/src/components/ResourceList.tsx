'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { ResourceItem } from './ResourceItem'
import { type Resource } from '@/lib/api'

interface ResourceListProps {
  resources: Resource[]
  pageId: number
  onResourceUpdated: () => void
  onResourceDeleted: () => void
  onReorder: (orders: Record<number, number>) => void
}

export function ResourceList({
  resources,
  pageId,
  onResourceUpdated,
  onResourceDeleted,
  onReorder,
}: ResourceListProps) {
  const [items, setItems] = useState(resources)

  useEffect(() => {
    setItems(resources)
  }, [resources])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update orders in database
        const orders: Record<number, number> = {}
        newItems.forEach((item, index) => {
          orders[item.id] = index
        })
        onReorder(orders)

        return newItems
      })
    }
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No resources yet. Add one to get started!
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((r) => r.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {items.map((resource) => (
            <ResourceItem
              key={resource.id}
              resource={resource}
              pageId={pageId}
              onUpdated={onResourceUpdated}
              onDeleted={onResourceDeleted}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

