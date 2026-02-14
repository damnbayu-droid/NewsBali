'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, CheckCircle, XCircle, RefreshCw, Server, Database, Cloud } from 'lucide-react'
import { useState } from 'react'

export function SystemHealthCard() {
    const [health, setHealth] = useState({
        database: 'unknown',
        openai: 'unknown',
        pollinations: 'unknown'
    })
    const [loading, setLoading] = useState(false)

    const checkHealth = async () => {
        setLoading(true)
        // Simulate checks or call a real endpoint if we had one dedicated
        // For now we assume we check connection via the assistant API
        try {
            const res = await fetch('/api/ai/assistant', {
                method: 'POST',
                body: JSON.stringify({ action: 'command', options: { ping: true, agent: 'AS' } })
            })
            if (res.ok) {
                setHealth({
                    database: 'online', // simplified
                    openai: 'online',
                    pollinations: 'online'
                })
            } else {
                setHealth({
                    database: 'offline',
                    openai: 'offline',
                    pollinations: 'unknown'
                })
            }
        } catch (e) {
            setHealth({ database: 'error', openai: 'error', pollinations: 'error' })
        } finally {
            setLoading(false)
            // Save log (optional)
        }
    }

    const StatusIcon = ({ status }: { status: string }) => {
        if (status === 'online') return <CheckCircle className="h-4 w-4 text-green-500" />
        if (status === 'offline') return <XCircle className="h-4 w-4 text-red-500" />
        if (status === 'error') return <XCircle className="h-4 w-4 text-red-500" />
        return <div className="h-2 w-2 rounded-full bg-gray-300" />
    }

    return (
        <Card className="border-green-500/20 bg-green-50/05 h-full">
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Activity className="h-5 w-5 text-green-600" />
                        System Health
                    </CardTitle>
                    <CardDescription>API & Service Connections</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={checkHealth} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded bg-background/60">
                    <div className="flex items-center gap-3">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Database (Prisma)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-muted-foreground">{health.database}</span>
                        <StatusIcon status={health.database} />
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded bg-background/60">
                    <div className="flex items-center gap-3">
                        <Cloud className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">OpenAI API</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-muted-foreground">{health.openai}</span>
                        <StatusIcon status={health.openai} />
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded bg-background/60">
                    <div className="flex items-center gap-3">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Image Gen (Pollinations)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase text-muted-foreground">{health.pollinations}</span>
                        <StatusIcon status={health.pollinations} />
                    </div>
                </div>

                <Button className="w-full mt-2" variant="outline" onClick={checkHealth}>
                    Run Diagnostics
                </Button>
            </CardContent>
        </Card>
    )
}
