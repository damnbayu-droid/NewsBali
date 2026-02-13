'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Sparkles, Activity, Brain } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface AiControlsProps {
    onSuccess: (message: string) => void
    onError: (message: string) => void
    onRefresh: () => void
}

export function AiControls({ onSuccess, onError, onRefresh }: AiControlsProps) {
    const [loading, setLoading] = useState(false)
    const [articleCount, setArticleCount] = useState('3')
    const [viralCategory, setViralCategory] = useState('random')
    const [rewriteUrl, setRewriteUrl] = useState('')

    const handleGenerate = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/generate-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ count: parseInt(articleCount) })
            })
            const data = await res.json()
            if (res.ok) {
                onSuccess(`✅ Generated ${data.count} articles successfully!`)
                onRefresh()
            } else {
                onError(data.error || 'Failed to generate articles')
            }
        } catch (err) {
            onError('Failed to generate articles')
        } finally {
            setLoading(false)
        }
    }

    const handleDiscoverViral = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/ai/discover-viral', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: viralCategory === 'random' ? null : viralCategory,
                    autoPublish: true
                })
            })
            const data = await res.json()
            if (res.ok) {
                onSuccess(`🔥 Discovered and published: "${data.article.title}"!`)
                onRefresh()
            } else {
                onError(data.error || 'Failed to discover viral news')
            }
        } catch (err) {
            onError('Failed to discover viral news')
        } finally {
            setLoading(false)
        }
    }

    const handleRewrite = async () => {
        if (!rewriteUrl) {
            onError('Please enter a URL')
            return
        }
        setLoading(true)
        try {
            const res = await fetch('/api/ai/rewrite-news', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: rewriteUrl, autoPublish: false })
            })
            const data = await res.json()
            if (res.ok) {
                onSuccess(`✅ Article rewritten successfully! Check drafts.`)
                onRefresh()
                setRewriteUrl('')
            } else {
                onError(data.error || 'Failed to rewrite article')
            }
        } catch (err) {
            onError('Failed to rewrite article')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Manual Generation */}
            <div className="flex gap-4">
                <div className="flex-1">
                    <Label htmlFor="article-count">Number of Articles</Label>
                    <Input
                        id="article-count"
                        type="number"
                        min="1"
                        max="10"
                        value={articleCount}
                        onChange={(e) => setArticleCount(e.target.value)}
                        placeholder="3"
                    />
                </div>
                <div className="flex items-end">
                    <Button
                        onClick={handleGenerate}
                        className="gap-2"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        Generate Now
                    </Button>
                </div>
            </div>

            {/* Viral Discovery */}
            <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    🔥 Discover & Recreate Viral News
                </h4>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <Label htmlFor="viral-category">Category (Optional)</Label>
                        <Select value={viralCategory} onValueChange={setViralCategory}>
                            <SelectTrigger id="viral-category">
                                <SelectValue placeholder="Random Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="random">Random Category</SelectItem>
                                <SelectItem value="TOURISM">Tourism</SelectItem>
                                <SelectItem value="INVESTMENT">Investment</SelectItem>
                                <SelectItem value="INCIDENTS">Incidents</SelectItem>
                                <SelectItem value="LOCAL">Local</SelectItem>
                                <SelectItem value="JOBS">Jobs</SelectItem>
                                <SelectItem value="OPINION">Opinion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-end">
                        <Button
                            onClick={handleDiscoverViral}
                            className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
                            Find & Publish
                        </Button>
                    </div>
                </div>
            </div>

            {/* Rewriter */}
            <div className="border-t pt-4 space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Rewrite External News
                </h4>
                <div className="flex gap-4">
                    <Input
                        placeholder="https://example.com/news-article"
                        value={rewriteUrl}
                        onChange={(e) => setRewriteUrl(e.target.value)}
                        className="flex-1"
                    />
                    <Button
                        onClick={handleRewrite}
                        disabled={loading || !rewriteUrl}
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        Rewrite
                    </Button>
                </div>
            </div>
        </div>
    )
}
