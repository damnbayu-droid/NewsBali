'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, Send, X, MessageSquare, Loader2, Minimize2, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccessProps {
    onRefresh?: () => void
}

export function AdminChatWidget({ onRefresh }: AccessProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
        { role: 'assistant', content: 'Hello Admin. How can I assist you today?' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userMsg = input
        setInput('')
        setMessages(prev => [...prev, { role: 'user', content: userMsg }])
        setIsLoading(true)

        try {
            const res = await fetch('/api/ai/assistant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'command', command: userMsg })
            })

            const data = await res.json()

            if (data.success) {
                setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Task completed.' }])
                if (onRefresh) onRefresh()
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: 'I encountered an error executing that command.' }])
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Connection error.' }])
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all hover:scale-110"
                onClick={() => setIsOpen(true)}
            >
                <MessageSquare className="h-6 w-6 text-white" />
            </Button>
        )
    }

    return (
        <Card className={cn("fixed bottom-6 right-6 w-80 md:w-96 shadow-2xl z-50 transition-all duration-200 ease-in-out border-blue-500/20", isMinimized ? "h-16 overflow-hidden" : "h-[500px]")}>
            <CardHeader className="p-3 bg-blue-50 dark:bg-blue-950/20 flex flex-row items-center justify-between space-y-0 pb-3 border-b">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-500" />
                    Assistant (The Boss)
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsMinimized(!isMinimized)}>
                        {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            </CardHeader>

            {!isMinimized && (
                <>
                    <CardContent className="p-0 flex flex-col h-[380px]">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                            {messages.map((m, i) => (
                                <div key={i} className={cn("flex w-full", m.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn("max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                        m.role === 'user'
                                            ? "bg-blue-600 text-white"
                                            : "bg-muted text-foreground"
                                    )}>
                                        {m.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex w-full justify-start">
                                    <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm bg-muted text-foreground flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>

                    <CardFooter className="p-3 border-t">
                        <form onSubmit={handleSubmit} className="flex w-full gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type a command..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardFooter>
                </>
            )}
        </Card>
    )
}
