'use client'

import { useEffect, useState } from 'react'
import { pagesApi, type Page, authApi, loadStoredToken, setAuthToken } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreatePageDialog } from '@/components/CreatePageDialog'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = loadStoredToken()
    if (token) {
      setIsAuthenticated(true)
    }
    loadPages()
  }, [])

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

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (e) {
      console.error(e)
    } finally {
      setAuthToken(undefined)
      setIsAuthenticated(false)
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
              <Link key={page.id} href={`/pages/${page.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                      <CardTitle>{page.name}</CardTitle>
                      <CardDescription>
                        {page.resources?.length || 0} resources
                      </CardDescription>
                    </div>
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
                  </CardHeader>
                </Card>
              </Link>
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
              <Link key={page.id} href={`/pages/${page.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{page.name}</CardTitle>
                    <CardDescription>
                      {page.resources?.length || 0} resources
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
            {technical.length === 0 && (
              <p className="text-muted-foreground">No technical pages yet. Create one to get started!</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

