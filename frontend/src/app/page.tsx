'use client'

import { useEffect, useState } from 'react'
import { pagesApi, type Page, authApi } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatePageDialog } from '@/components/CreatePageDialog'
import { EditPageDialog } from '@/components/EditPageDialog'
import { DeletePageDialog } from '@/components/DeletePageDialog'
import Link from 'next/link'
import { Heart, Edit, Trash2, MoreVertical } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Home() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [deletingPage, setDeletingPage] = useState<Page | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadPages()
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
      if (session) {
        loadPages()
      }
    })
    
    return () => subscription.unsubscribe()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setIsAuthenticated(!!session)
  }

  const loadPages = async () => {
    try {
      const response = await pagesApi.getAll()
      setPages(response.data)
      setIsAuthenticated(true)
    } catch (error: any) {
      console.error('Failed to load pages:', error)
      if (error.response?.status === 401) {
        setIsAuthenticated(false)
        // Redirect handled by interceptor
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePageCreated = () => {
    loadPages()
  }

  const handlePageUpdated = () => {
    loadPages()
  }

  const handlePageDeleted = () => {
    loadPages()
  }

  const handleEditClick = (page: Page, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setEditingPage(page)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (page: Page, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDeletingPage(page)
    setDeleteDialogOpen(true)
  }

  const handleLogout = async () => {
    try {
      await authApi.logout()
      setIsAuthenticated(false)
      router.push('/login')
    } catch (e) {
      console.error(e)
    }
  }

  const handleLoginNavigate = () => router.push('/login')
  const handleRegisterNavigate = () => router.push('/register')

  const handleToggleFavorite = async (page: Page) => {
    const nextValue = !page.is_favorite
    setPages((prev) =>
      prev.map((p) => (p.id === page.id ? { ...p, is_favorite: nextValue } : p))
    )
    try {
      await pagesApi.update(page.id, { is_favorite: nextValue })
      loadPages()
    } catch (error) {
      console.error('Failed to update favorite:', error)
      // revert on error
      setPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, is_favorite: page.is_favorite } : p))
      )
      alert('Failed to update favorite')
    }
  }

  const sortPages = (items: Page[]) =>
    [...items].sort((a, b) => {
      if (a.is_favorite !== b.is_favorite) {
        return Number(b.is_favorite) - Number(a.is_favorite)
      }
      return a.name.localeCompare(b.name)
    })

  if (loading) {
    return <div className="container mx-auto p-8">Loading...</div>
  }

  const songs = sortPages(pages.filter(p => p.type === 'song'))
  const technical = [...pages.filter(p => p.type === 'technical')].sort((a, b) =>
    a.name.localeCompare(b.name)
  )

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">My Musical Room</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isAuthenticated ? (
            <>
              <CreatePageDialog onPageCreated={handlePageCreated} />
              <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">Logout</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleLoginNavigate} className="w-full sm:w-auto">Login</Button>
              <Button onClick={handleRegisterNavigate} className="w-full sm:w-auto">Register</Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8">
        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Songs</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {songs.map((page) => (
              <Card key={page.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between">
                  <Link href={`/pages/${page.id}`} className="flex-1 min-w-0">
                    <CardTitle className="truncate">{page.name}</CardTitle>
                    <CardDescription>
                      {page.resources?.length || 0} resources
                    </CardDescription>
                  </Link>
                  <div className="flex items-center gap-1 ml-2">
                    {isAuthenticated && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Page options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleEditClick(page, e)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDeleteClick(page, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleFavorite(page)
                      }}
                      aria-label={page.is_favorite ? 'Remove favorite' : 'Mark as favorite'}
                    >
                      <Heart
                        className="h-5 w-5"
                        fill={page.is_favorite ? 'currentColor' : 'none'}
                      />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
            {songs.length === 0 && (
              <p className="text-muted-foreground">No songs yet. Create one to get started!</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Technical</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {technical.map((page) => (
              <Card key={page.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-start justify-between">
                  <Link href={`/pages/${page.id}`} className="flex-1 min-w-0">
                    <CardTitle className="truncate">{page.name}</CardTitle>
                    <CardDescription>
                      {page.resources?.length || 0} resources
                    </CardDescription>
                  </Link>
                  {isAuthenticated && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="Page options"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => handleEditClick(page, e)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handleDeleteClick(page, e)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </CardHeader>
              </Card>
            ))}
            {technical.length === 0 && (
              <p className="text-muted-foreground">No technical pages yet. Create one to get started!</p>
            )}
          </div>
        </section>
      </div>

      <EditPageDialog
        page={editingPage}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onPageUpdated={handlePageUpdated}
      />

      <DeletePageDialog
        page={deletingPage}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onPageDeleted={handlePageDeleted}
      />
    </div>
  )
}

