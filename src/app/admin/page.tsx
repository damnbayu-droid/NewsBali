'use client'
// Force Rebuild
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Loader2,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Users,
  MessageCircle,
  Shield,
  BarChart3,
  Settings,
  Search,
  Send,
  Save,
  Link as LinkIcon,
  Image as ImageIcon,
  LogOut,
  LayoutDashboard,
  Sparkles,
  Brain,
  Zap,
  Activity
} from 'lucide-react'
import Image from 'next/image'
import { AiControls } from '@/components/admin/ai-controls'
import { AdminChatWidget } from '@/components/admin/chat-widget'
import { AgentStatusCard } from '@/components/admin/agent-status-card'
import { SystemHealthCard } from '@/components/admin/system-health-card'
import { ScheduleCard } from '@/components/admin/schedule-card'

const categories = [
  { value: 'TOURISM', label: 'Pariwisata' },
  { value: 'GOVERNMENT', label: 'Pemerintah' },
  { value: 'INVESTMENT', label: 'Investasi' },
  { value: 'INCIDENTS', label: 'Insiden' },
  { value: 'LOCAL', label: 'Lokal' },
  { value: 'JOBS', label: 'Pekerjaan' },
  { value: 'OPINION', label: 'Opini' },
]

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'outline',
  REVIEW: 'secondary',
  PUBLISHED: 'default',
  REJECTED: 'destructive',
  PENDING: 'secondary',
  APPROVED: 'default',
  FLAGGED: 'destructive',
}

const roleColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  ADMIN: 'default',
  EDITOR: 'secondary',
  USER: 'outline',
}

const riskColors: Record<string, string> = {
  LOW: 'bg-green-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  featuredImageUrl: string | null
  featuredImageAlt: string | null
  imageSource: string | null
  aiAssisted: boolean
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  riskScore: number
  containsAccusation: boolean
  verificationLevel: string
  evidenceCount: number
  status: 'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'REJECTED'
  viewCount: number
  createdAt: string
  publishedAt: string | null
  author: { name: string | null, email: string }
}

interface Report {
  id: string
  title: string
  category: string
  content: string
  sourceContact: string | null
  evidenceLinks: string | null
  status: string
  createdAt: string
}



interface Comment {
  id: string
  content: string
  status: string
  toxicityScore: number | null
  createdAt: string
  user: { name: string | null; email: string }
  article: { title: string }
}

interface User {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  _count?: { articles: number; comments: number }
}

export default function MasterAdminDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  // Data states
  const [articles, setArticles] = useState<Article[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    totalUsers: 0,
    totalComments: 0,
    pendingComments: 0,
    highRiskArticles: 0,
  })

  // UI states
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Article form state
  const [articleForm, setArticleForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    featuredImageUrl: '',
    featuredImageAlt: '',
    imageSource: '',
    status: 'DRAFT',
  })
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [showArticleDialog, setShowArticleDialog] = useState(false)
  const [analyzingRisk, setAnalyzingRisk] = useState(false)
  const [riskAnalysis, setRiskAnalysis] = useState<{
    riskScore: number
    riskLevel: string
    containsAccusation: boolean
    recommendations: string[]
  } | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [authChecked, setAuthChecked] = useState(false)

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()

        if (!res.ok || !data.user || (data.user.role !== 'ADMIN' && data.user.role !== 'EDITOR')) {
          router.push('/login')
          return
        }

        setAuthChecked(true)
      } catch (err) {
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // Fetch all data on mount
  useEffect(() => {
    if (authChecked) {
      fetchAllData()
    }
  }, [authChecked])

  async function fetchAllData() {
    setLoading(true)
    try {
      const [articlesRes, commentsRes, usersRes, reportsRes] = await Promise.all([
        fetch('/api/admin/articles'),
        fetch('/api/admin/comments'),
        fetch('/api/admin/users'),
        fetch('/api/admin/reports'),
      ])

      const articlesData = articlesRes.ok ? await articlesRes.json() : { articles: [] }
      const commentsData = commentsRes.ok ? await commentsRes.json() : { comments: [] }
      const usersData = usersRes.ok ? await usersRes.json() : { users: [] }
      const reportsData = reportsRes.ok ? await reportsRes.json() : []

      if (Array.isArray(articlesData.articles)) setArticles(articlesData.articles)
      if (Array.isArray(commentsData.comments)) setComments(commentsData.comments)
      if (Array.isArray(usersData.users)) setUsers(usersData.users)
      if (Array.isArray(reportsData)) setReports(reportsData)

      // Calculate stats
      setStats({
        totalArticles: articlesData.articles?.length || 0,
        publishedArticles: articlesData.articles?.filter((a: Article) => a.status === 'PUBLISHED').length || 0,
        totalUsers: usersData.users?.length || 0,
        totalComments: commentsData.comments?.length || 0,
        pendingComments: commentsData.comments?.filter((c: Comment) => c.status === 'PENDING').length || 0,
        highRiskArticles: articlesData.articles?.filter((a: Article) => ['HIGH', 'CRITICAL'].includes(a.riskLevel)).length || 0,
      })
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  function resetArticleForm() {
    setArticleForm({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      featuredImageUrl: '',
      featuredImageAlt: '',
      imageSource: '',
      status: 'DRAFT',
    })
    setRiskAnalysis(null)
    setAnalyzingRisk(false)
  }

  async function handleCreateArticle(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...articleForm,
          status: articleForm.status || 'DRAFT',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create article')
      }

      setSuccess('Article created successfully!')
      setShowArticleDialog(false)
      resetArticleForm()
      fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpdateArticle(e: React.FormEvent) {
    e.preventDefault()
    if (!editingArticle) return

    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/articles/${editingArticle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleForm),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update article')
      }

      setSuccess('Article updated successfully!')
      setShowArticleDialog(false)
      setEditingArticle(null)
      resetArticleForm()
      fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeleteArticle(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const res = await fetch(`/api/articles/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSuccess('Article deleted!')
      fetchAllData()
    } catch (err) {
      setError('Failed to delete article')
    }
  }

  async function handlePublishArticle(id: string) {
    try {
      const res = await fetch(`/api/articles/${id}/publish`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to publish')
      setSuccess(data.published ? 'Article published!' : 'Article unpublished')
      fetchAllData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish article')
    }
  }

  async function handleCommentAction(id: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch(`/api/admin/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action === 'approve' ? 'APPROVED' : 'REJECTED' }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setSuccess(`Comment ${action}d!`)
      fetchAllData()
    } catch (err) {
      setError('Failed to update comment')
    }
  }

  async function handleUserRoleChange(userId: string, newRole: string) {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setSuccess('User role updated!')
      fetchAllData()
    } catch (err) {
      setError('Failed to update user role')
    }
  }

  async function analyzeRisk() {
    if (!articleForm.content || !articleForm.title) return

    setAnalyzingRisk(true)
    try {
      const res = await fetch('/api/articles/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: articleForm.content, title: articleForm.title }),
      })
      const data = await res.json()
      if (res.ok) {
        setRiskAnalysis(data)
      }
    } catch (err) {
      console.error('Risk analysis failed:', err)
    } finally {
      setAnalyzingRisk(false)
    }
  }



  function openEditArticle(article: Article) {
    setEditingArticle(article)
    setArticleForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category,
      featuredImageUrl: article.featuredImageUrl || '',
      featuredImageAlt: article.featuredImageAlt || '',
      imageSource: article.imageSource || '',
      status: article.status,
    })
    setShowArticleDialog(true)
  }

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }



  // Enhanced Search Logic
  const filteredArticles = articles.filter(a => {
    const q = searchQuery.toLowerCase()
    return (
      a.title.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q) ||
      a.author?.name?.toLowerCase().includes(q) ||
      a.status.toLowerCase().includes(q)
    )
  })

  const filteredComments = comments.filter(c => {
    const q = searchQuery.toLowerCase()
    return (
      c.content.toLowerCase().includes(q) ||
      c.user.email.toLowerCase().includes(q) ||
      c.user.name?.toLowerCase().includes(q)
    )
  })

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase()
    return (
      u.email.toLowerCase().includes(q) ||
      u.name?.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-50">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Master Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">NewsBali Online</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                <Eye className="h-4 w-4 mr-2" />
                View Site
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-4 py-6">
        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-6 border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Articles</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Comments</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Console
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="h-4 w-4" />
              Reports
              {reports.filter(r => r.status === 'PENDING').length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {reports.filter(r => r.status === 'PENDING').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalArticles}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.publishedArticles} published
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered accounts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Comments</CardTitle>
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.pendingComments}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalComments} total comments
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Public Reports</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reports.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {reports.filter(r => r.status === 'PENDING').length} pending review
                  </p>
                </CardContent>
              </Card>
            </div>


            {/* AI Assistant & Schedule Row */}
            {/* AI Assistant & Schedule Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Agent Status Card (Real-time) */}
              <div className="h-full">
                <AgentStatusCard />
              </div>

              {/* System Health Card */}
              <div className="h-full">
                <SystemHealthCard />
              </div>

              {/* Assistant Admin Card (Actions) */}
              <Card className="border-blue-500/20 bg-blue-50/10 h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-500" />
                    Assistant Actions
                  </CardTitle>
                  <CardDescription>
                    Trigger autonomous workflows.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-md text-xs font-mono h-[140px] overflow-y-auto">
                    <p className="text-muted-foreground italic">System Ready. Check "Global Logs" for details.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={async () => {
                        const res = await fetch('/api/ai/assistant', {
                          method: 'POST',
                          body: JSON.stringify({ action: 'full-run' })
                        })
                        const data = await res.json()
                        if (data.success) {
                          alert(`Loop Started! Check Status Cards.\n${data.logs.join('\n')}`)
                          fetchAllData()
                        } else {
                          alert('Assistant failed to run')
                        }
                      }}
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Run Full Agent Loop
                    </Button>
                  </div>
                </CardContent>
              </Card>


              {/* Editable Smart Schedule Card */}
              <ScheduleCard />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              {/* Information & Notification Panel */}
              <Card className="border-cyan-500/20 bg-cyan-50/05 h-[300px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-cyan-500" />
                    System Notifications
                  </CardTitle>
                  <CardDescription>Real-time system alerts and logs.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-0">
                  <div className="flex flex-col">
                    {[
                      { time: 'Now', msg: 'System online. All agents standby.', type: 'info' },
                      { time: '10m ago', msg: 'Database backup completed.', type: 'success' },
                      { time: '1h ago', msg: 'Scheduled maintenance check passed.', type: 'info' },
                    ].map((log, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 border-b hover:bg-muted/50 text-sm">
                        <Badge variant="outline" className="text-[10px] shrink-0">{log.time}</Badge>
                        <span className={log.type === 'error' ? 'text-red-500' : 'text-foreground'}>{log.msg}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Global Logs */}
              <Card className="border-purple-500/20 bg-purple-50/05 h-[300px] flex flex-col">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-500" />
                    Global Activity Logs
                  </CardTitle>
                  <CardDescription>Comprehensive record of all AI activities.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto bg-slate-950 text-slate-300 font-mono text-xs p-4 rounded-b-lg">
                  <p className="opacity-50 mb-2">// Showing last 50 activities</p>
                  <div className="space-y-1">
                    <div>[19:42:01] <span className="text-blue-400">AUDY</span>: Executed image repair on 17 articles.</div>
                    <div>[19:40:00] <span className="text-green-400">SYSTEM</span>: Government category added to schema.</div>
                    <div>[19:30:00] <span className="text-yellow-400">SCHEDULER</span>: Next run scheduled for 20:00.</div>
                  </div>
                </CardContent>
              </Card>
            </div>


            {/* Recent Articles (Full Width - Mobile Fix) */}
            <div className="w-full">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Articles</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {articles.slice(0, 5).map(article => (
                    <div key={article.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate pr-4">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(article.createdAt).toLocaleDateString('en-GB')}
                        </p>
                      </div>
                      <Badge variant={statusColors[article.status] || 'outline'} className="w-fit">
                        {article.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Submissions Tab */}
          <TabsContent value="submissions">
            <Card>
              <CardHeader>
                <CardTitle>Contact Submissions</CardTitle>
                <CardDescription>Messages from the contact form.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                  <p>No new submissions (Database Connected).</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Articles Tab */}
          <TabsContent value="articles">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Article Management</CardTitle>
                    <CardDescription>Create, edit, and manage all articles</CardDescription>
                  </div>
                  <Dialog open={showArticleDialog} onOpenChange={setShowArticleDialog}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { resetArticleForm(); setEditingArticle(null); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Article
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingArticle ? 'Edit Article' : 'Create New Article'}</DialogTitle>
                        <DialogDescription>
                          Fill in the article details. AI will analyze legal risk automatically.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={editingArticle ? handleUpdateArticle : handleCreateArticle} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="title">Title *</Label>
                              <Input
                                id="title"
                                value={articleForm.title}
                                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                                placeholder="Article title"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="excerpt">Excerpt *</Label>
                              <Textarea
                                id="excerpt"
                                value={articleForm.excerpt}
                                onChange={(e) => setArticleForm({ ...articleForm, excerpt: e.target.value })}
                                placeholder="Brief summary (50-300 chars)"
                                rows={2}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="category">Category *</Label>
                              <Select
                                value={articleForm.category}
                                onValueChange={(value) => setArticleForm({ ...articleForm, category: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  {categories.map((cat) => (
                                    <SelectItem key={cat.value} value={cat.value}>
                                      {cat.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="status">Status</Label>
                              <Select
                                value={articleForm.status}
                                onValueChange={(value) => setArticleForm({ ...articleForm, status: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="DRAFT">Draft</SelectItem>
                                  <SelectItem value="REVIEW">Review</SelectItem>
                                  <SelectItem value="PUBLISHED">Published</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="featuredImageUrl">Image URL *</Label>
                              <div className="relative">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  id="featuredImageUrl"
                                  type="url"
                                  value={articleForm.featuredImageUrl}
                                  onChange={(e) => setArticleForm({ ...articleForm, featuredImageUrl: e.target.value })}
                                  placeholder="https://example.com/image.jpg"
                                  className="pl-10"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="featuredImageAlt">Image Alt Text *</Label>
                              <Input
                                id="featuredImageAlt"
                                value={articleForm.featuredImageAlt}
                                onChange={(e) => setArticleForm({ ...articleForm, featuredImageAlt: e.target.value })}
                                placeholder="Describe the image"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="imageSource">Image Source *</Label>
                              <Input
                                id="imageSource"
                                value={articleForm.imageSource}
                                onChange={(e) => setArticleForm({ ...articleForm, imageSource: e.target.value })}
                                placeholder="Photographer or source"
                              />
                            </div>
                            {articleForm.featuredImageUrl && (
                              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                                <Image
                                  src={articleForm.featuredImageUrl}
                                  alt={articleForm.featuredImageAlt || 'Preview'}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="content">Content *</Label>
                          <Textarea
                            id="content"
                            value={articleForm.content}
                            onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                            placeholder="Write your article content here... (HTML supported)"
                            rows={10}
                            required
                          />
                        </div>

                        {/* Risk Analysis */}
                        <div className="flex items-center gap-4 p-4 rounded-lg border bg-muted/30">
                          <Button type="button" variant="outline" onClick={analyzeRisk} disabled={analyzingRisk}>
                            {analyzingRisk ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Shield className="h-4 w-4 mr-2" />
                            )}
                            Analyze Legal Risk
                          </Button>
                          {riskAnalysis && (
                            <div className="flex items-center gap-4">
                              <Badge variant={riskAnalysis.riskLevel === 'LOW' ? 'default' : riskAnalysis.riskLevel === 'MEDIUM' ? 'secondary' : 'destructive'}>
                                Risk: {riskAnalysis.riskScore}/100 ({riskAnalysis.riskLevel})
                              </Badge>
                              {riskAnalysis.containsAccusation && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                            </div>
                          )}
                        </div>

                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setShowArticleDialog(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={loading}>
                            {loading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            {editingArticle ? 'Update' : 'Create'} Article
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search articles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px] hidden sm:table-cell">Image</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="hidden lg:table-cell">Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden xl:table-cell">Risk</TableHead>
                        <TableHead className="hidden xl:table-cell">Views</TableHead>
                        <TableHead className="hidden lg:table-cell">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredArticles.map((article) => (
                        <TableRow key={article.id}>
                          <TableCell className="hidden sm:table-cell">
                            <div className="relative w-16 h-12 rounded overflow-hidden bg-muted">
                              {article.featuredImageUrl ? (
                                <Image
                                  src={article.featuredImageUrl}
                                  alt={article.featuredImageAlt || ''}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <p className="font-medium line-clamp-1">{article.title}</p>
                            <p className="text-xs text-muted-foreground hidden md:block">{article.author?.name || 'Unknown'}</p>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <Badge variant="outline">{article.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[article.status]}>{article.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${riskColors[article.riskLevel]}`} />
                              <span className="text-sm">{article.riskScore}</span>
                            </div>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">{article.viewCount}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {new Date(article.createdAt).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditArticle(article)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {article.status !== 'PUBLISHED' ? (
                                <Button size="icon" variant="ghost" onClick={() => handlePublishArticle(article.id)}>
                                  <Send className="h-4 w-4 text-green-500" />
                                </Button>
                              ) : (
                                <Button size="icon" variant="ghost" onClick={() => handlePublishArticle(article.id)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteArticle(article.id)}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <Card>
              <CardHeader>
                <CardTitle>Comment Moderation</CardTitle>
                <CardDescription>Review and moderate user comments with AI assistance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search comments..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Content</TableHead>
                        <TableHead className="hidden md:table-cell">User</TableHead>
                        <TableHead className="hidden lg:table-cell">Article</TableHead>
                        <TableHead className="hidden sm:table-cell">Toxicity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden xl:table-cell">Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredComments.map((comment) => (
                        <TableRow key={comment.id}>
                          <TableCell className="max-w-xs">
                            <p className="text-sm line-clamp-2">{comment.content}</p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div>
                              <p className="text-sm font-medium">{comment.user.name || 'Anonymous'}</p>
                              <p className="text-xs text-muted-foreground">{comment.user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[150px] hidden lg:table-cell">
                            <p className="text-sm line-clamp-1">{comment.article.title}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {comment.toxicityScore !== null ? (
                              <Badge variant={comment.toxicityScore > 0.5 ? 'destructive' : 'secondary'}>
                                {(comment.toxicityScore * 100).toFixed(0)}%
                              </Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusColors[comment.status]}>{comment.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {new Date(comment.createdAt).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleCommentAction(comment.id, 'approve')}>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleCommentAction(comment.id, 'reject')}>
                                <XCircle className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="hidden lg:table-cell">Articles</TableHead>
                        <TableHead className="hidden lg:table-cell">Comments</TableHead>
                        <TableHead className="hidden xl:table-cell">Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name || 'No name'}</TableCell>
                          <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value) => handleUserRoleChange(user.id, value)}
                            >
                              <SelectTrigger className="w-28">
                                <Badge variant={roleColors[user.role]}>{user.role}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USER">USER</SelectItem>
                                <SelectItem value="EDITOR">EDITOR</SelectItem>
                                <SelectItem value="ADMIN">ADMIN</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">{user._count?.articles || 0}</TableCell>
                          <TableCell className="hidden lg:table-cell">{user._count?.comments || 0}</TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {new Date(user.createdAt).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab - Placeholder for now */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Public Reports</CardTitle>
                <CardDescription>User submitted reports on articles.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border p-8 text-center text-muted-foreground">
                  <p>Report management module coming soon.</p>
                  <p className="text-sm mt-2">{reports.length} reports in database.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Control Panel Tab */}
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Command Center
                </CardTitle>
                <CardDescription>
                  Live terminal and control panel for autonomous news generation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AiControls
                  onSuccess={(msg) => setSuccess(msg)}
                  onError={(msg) => setError(msg)}
                  onRefresh={fetchAllData}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Configure platform-wide settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Site Name</Label>
                      <Input defaultValue="NewsBali Online" />
                    </div>
                    <div className="space-y-2">
                      <Label>Site URL</Label>
                      <Input defaultValue="https://newsbali.online" />
                    </div>
                    <div className="space-y-2">
                      <Label>Admin Email</Label>
                      <Input defaultValue="admin@newsbali.online" />
                    </div>
                    <div className="space-y-2">
                      <Label>Default Language</Label>
                      <Select defaultValue="id">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">Indonesian</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Publish Lock Rules</CardTitle>
                  <CardDescription>Requirements for article publication</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Featured image required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Image alt text required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Image source required</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>Minimum 1 evidence document</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span>Legal review required for HIGH risk articles</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Level Thresholds</CardTitle>
                  <CardDescription>Legal risk scoring configuration</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span className="font-medium">LOW</span>
                      </div>
                      <p className="text-sm text-muted-foreground">0-30</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span className="font-medium">MEDIUM</span>
                      </div>
                      <p className="text-sm text-muted-foreground">31-60</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="font-medium">HIGH</span>
                      </div>
                      <p className="text-sm text-muted-foreground">61-80</p>
                    </div>
                    <div className="p-4 rounded-lg border">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span className="font-medium">CRITICAL</span>
                      </div>
                      <p className="text-sm text-muted-foreground">81-100</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-red-500">Danger Zone</CardTitle>
                  <CardDescription>Irreversible actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
                    <div>
                      <p className="font-medium">Reset Database</p>
                      <p className="text-sm text-muted-foreground">Delete all articles and reset content</p>
                    </div>
                    <Button variant="destructive">Reset</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <AdminChatWidget onRefresh={fetchAllData} />
    </div>
  )
}
