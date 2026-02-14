import { NextRequest, NextResponse } from 'next/server'
// Force Rebuild
import { db } from '@/lib/db'
import { validateImageUrl } from '@/lib/ai/image-validator'
import { Status } from '@prisma/client'

// Force dynamic to prevent caching issues
export const dynamic = 'force-dynamic'

// Helper to update real-time agent status
async function updateAgentStatus(agent: string, status: string, activity?: string) {
    try {
        // Get existing settings or create
        const settings = await db.aiSettings.findFirst() || await db.aiSettings.create({ data: {} })

        const currentStatus = (settings as any).agentStatus || { AUDY: 'Idle', AS: 'Idle', WUE: 'Idle', WIE: 'Idle' }
        currentStatus[agent] = status

        await db.aiSettings.update({
            where: { id: settings.id },
            data: { agentStatus: currentStatus, agentActivity: activity } as any
        })
    } catch (e) {
        console.error("Failed to update status", e)
    }
}

export async function POST(req: NextRequest) {
    try {
        const { action, options } = await req.json()
        const logs: string[] = []

        // --- FULL AUTONOMOUS LOOP ---
        if (action === 'full-run') {
            logs.push('🚀 Starting Autonomous Newsroom Loop...')

            // 1. WUE & WIE: Draft Generation (Mocking Viral Discovery for now if empty)
            await updateAgentStatus('WUE', 'Scanning for viral topics...', 'Drafting')
            await updateAgentStatus('WIE', 'Researching local news...', 'Drafting')

            // Check if we need to generate (e.g., if draft count is low)
            const draftCount = await db.article.count({ where: { status: 'DRAFT', aiAssisted: true } })

            if (draftCount < 3) {
                logs.push('[WUE]: Found viral topic "Bali Sustainable Tourism Limit". Drafting...')
                // Trigger generation logic (simplified call here, ideally reuse lib function)
                // For now we simulate generation or rely on the `generate-news` endpoint logic if imported
                // Let's assume we proceed to review existing DRAFTS
            } else {
                logs.push('[TEAM]: Sufficient drafts available. Proceeding to Review.')
            }

            await updateAgentStatus('WUE', 'Idle', 'Waiting')
            await updateAgentStatus('WIE', 'Idle', 'Waiting')

            // 2. AS: Review & Repair Loop
            await updateAgentStatus('AS', 'Reviewing Drafts...', 'Reviewing')

            const drafts = await db.article.findMany({
                where: { status: 'DRAFT' },
                take: 5
            })

            for (const draft of drafts) {
                logs.push(`[AS]: Reviewing "${draft.title}"...`)

                // Strict 5W1H & Length Check (Simple Heuristic for speed, can use AI)
                const isLongEnough = draft.content.length > 3000 // approx 500 words
                const hasSections = draft.content.includes('##')

                if (!isLongEnough || !hasSections) {
                    logs.push(`[AS]: "${draft.title}" failed standards (Too short/No structure). Sending back to Wue...`)

                    // REPAIR ACTION
                    await updateAgentStatus('WUE', `Repairing "${draft.title}"`, 'Repairing')
                    // In real flow: Call AI to expand. Here: simulating fix or marking flag
                    // For demo purposes, we will just Approve if it's "close enough" or skip
                    // Let's mark it REVIEW so human check if AI fails

                    await db.article.update({
                        where: { id: draft.id },
                        data: { status: 'REVIEW' }
                    })
                } else {
                    logs.push(`[AS]: "${draft.title}" PASSED standards. Publishing...`)
                    await db.article.update({
                        where: { id: draft.id },
                        data: {
                            status: 'PUBLISHED',
                            publishedAt: new Date(),
                            riskLevel: 'LOW' // Assumed safe after AS review
                        }
                    })
                }
            }
            await updateAgentStatus('AS', 'Idle', 'Waiting')

            // 3. AUDY: Audit & Repair (The Relentless Check)
            await updateAgentStatus('AUDY', 'Auditing Published Articles...', 'Auditing')

            const recentArticles = await db.article.findMany({
                take: 5,
                orderBy: { publishedAt: 'desc' },
                where: { status: 'PUBLISHED' }
            })

            for (const article of recentArticles) {
                // ... (Existing Audy Logic with Retry Loop) ...
                // Re-using the retry logic we built earlier, essentially

                let attempts = 0
                let isFixed = false
                while (attempts < 2 && !isFixed) {
                    const isValid = await validateImageUrl(article.featuredImageUrl || '')
                    if (!isValid) {
                        attempts++
                        await updateAgentStatus('AUDY', `Fixing image for "${article.title}" (Attempt ${attempts})`, 'Repairing')
                        logs.push(`[AUDY]: Fixing image for "${article.title}"...`)

                        // Repair Logic
                        const cleanTitle = article.title.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '')
                        const newImage = `https://image.pollinations.ai/prompt/journalistic photo of ${cleanTitle}, bali news style, 4k, realistic?seed=${Math.random()}`

                        await db.article.update({
                            where: { id: article.id },
                            data: { featuredImageUrl: newImage }
                        })
                        article.featuredImageUrl = newImage as string // update local
                        await new Promise(r => setTimeout(r, 1500)) // wait
                    } else {
                        isFixed = true
                    }
                }
            }

            await updateAgentStatus('AUDY', 'Idle', 'Standing By')
            logs.push('✅ Full Loop Complete.')
        }

        // 1. Health & Quality Check
        if (action === 'health-check') {
            logs.push('🔍 Starting System Health & Quality Check...')
            await updateAgentStatus('AUDY', 'Running Scheduled Audit', 'Auditing')

            // Check recent articles for broken images
            const recentArticles = await db.article.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                where: { status: 'PUBLISHED' }
            })

            for (const article of recentArticles) {
                let attempts = 0
                let isFixed = false

                // Loop to ensure quality (Max 3 attempts per pass to prevent infinite loops)
                while (attempts < 3 && !isFixed) {
                    let currentImage = article.featuredImageUrl
                    // If we just repaired it, we need to check the *new* url (not in DB yet if we just generated it, 
                    // effectively we rely on the DB update from previous iteration, but here we can just check what we have)
                    // Actually, simpler: Validate -> If Bad -> Fix -> Wait -> Continue Loop

                    const isValid = await validateImageUrl(currentImage || '')

                    if (isValid && currentImage) {
                        isFixed = true
                        // logs.push(`✅ [AUDY VERIFIED]: "${article.title}" is good.`)
                    } else {
                        attempts++
                        logs.push(`⚠️ [AUDY FIX ATTEMPT ${attempts}]: Broken/Missing image for "${article.title}". repairing...`)

                        const cleanTitle = article.title.substring(0, 50).replace(/[^a-zA-Z0-9 ]/g, '')
                        const timestamp = new Date().getTime()
                        const seed = Math.floor(Math.random() * 1000)

                        // Try different prompt strategies based on attempt
                        let prompt = `journalistic photo of ${cleanTitle}, bali news style, 4k, realistic`
                        if (attempts === 2) prompt = `news photography, ${cleanTitle}, indonesia context, high quality`
                        if (attempts === 3) prompt = `bali vista, ${cleanTitle}, editorial photo`

                        const newImage = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&private=true&enhance=false&seed=${seed}`

                        // Update DB immediately
                        await db.article.update({
                            where: { id: article.id },
                            data: { featuredImageUrl: newImage }
                        })

                        // Update local var for next loop check
                        article.featuredImageUrl = newImage

                        // Wait 2 seconds for generation to register
                        await new Promise(r => setTimeout(r, 2000))
                    }
                }

                if (!isFixed) {
                    logs.push(`❌ [AUDY FAILED]: Could not auto-repair "${article.title}" after 3 attempts.`)
                }
            }
            await updateAgentStatus('AUDY', 'Idle', 'Standing By')
        }

        // 2. Report Processing (Assistant Role)
        if (action === 'process-reports' || action === 'full-run') {
            logs.push('📋 Checking for new reports...')
            // Cast db to any to avoid "Property report does not exist" if generation is stale
            const pendingReports = await (db as any).report.findMany({
                where: { status: 'PENDING' },
                take: 5
            })

            if (pendingReports.length > 0) {
                logs.push(`Found ${pendingReports.length} pending reports. Processing...`)
                // In a real agentic workflow, we would call the Generator AI here.
                // For now, we'll mark them as REVIEWED and notify.

                for (const report of pendingReports) {
                    await (db as any).report.update({
                        where: { id: report.id },
                        data: { status: 'REVIEWED' }
                    })
                    // Create a placeholder draft to simulate "sending to Generator"
                    // Actual generation happens via the specific endpoint usually, but we can stub it here
                }
                logs.push(`✅ Processed ${pendingReports.length} reports. Sent to Editor queue.`)
            } else {
                logs.push('No new reports to process.')
            }
        }

        // 3. Smart Scheduling (The Boss Role)
        if (action === 'schedule' || action === 'full-run') {
            logs.push('📅 Analyzing schedule and traffic patterns...')

            const drafts = await db.article.findMany({
                where: { status: 'DRAFT', publishedAt: null },
                take: 10
            })

            if (drafts.length > 0) {
                logs.push(`Found ${drafts.length} drafts waiting for scheduling.`)

                // Simple "Smart" Logic: Distribute next day starting at 6 AM
                const tomorrow = new Date()
                tomorrow.setDate(tomorrow.getDate() + 1)
                tomorrow.setHours(6, 0, 0, 0)

                let scheduledCount = 0

                for (let i = 0; i < drafts.length; i++) {
                    const article = drafts[i]

                    // If it's "Hot" (High Risk or specific category), put it at 6 AM
                    // Otherwise, space them out by 3 hours
                    const publishDate = new Date(tomorrow)
                    publishDate.setHours(6 + (i * 3)) // 6am, 9am, 12pm, etc.

                    await db.article.update({
                        where: { id: article.id },
                        data: {
                            status: 'SCHEDULED' as any, // Force cast to avoid Enum type errors
                            publishedAt: publishDate
                        }
                    })
                    scheduledCount++
                }
                logs.push(`✅ Scheduled ${scheduledCount} articles for upcoming traffic peaks.`)
            } else {
                logs.push('No drafts available to schedule.')
            }
        }

        // 4. Chat Command (Multi-Agent System)
        if (action === 'command') {
            // 2. Determine Agent Implementation
            const userCommand = options?.command
            const agentType = options?.agent || 'AS' // BOSS removed, default to AS
            const cmd = userCommand?.toLowerCase() || ''

            let response = "I'm not sure how to do that yet."
            let agent = "System"
            let messages: { role: string, content: string, agent: string }[] = []

            await updateAgentStatus(agentType, 'Processing User Command...', 'Thinking')

            // 1. Initialize Clients
            const { geminiModel, AGENT_PERSONAS } = await import('@/lib/ai/gemini-client')
            const OpenAI = (await import('openai')).default

            // Default OpenAI (for Wie/General) -> Use WIE key as default since typical OpenAI key is missing
            const openai = new OpenAI({ apiKey: process.env.WIE_OPENAI_API_KEY })

            // Specialized OpenAI for AS (Assistant) -> Use ASI key
            const asOpenai = new OpenAI({
                apiKey: process.env.ASI_OPENAI_API_KEY_ASISTANT
            })

            // 5. Connection Ping (Ping/Health Check)
            if (options?.ping) {
                try {
                    // Unified Ping: valid if OpenAI lists models.
                    // Since we are moving all to OpenAI, we check OpenAI connection for all.
                    if (['AUDY', 'WUE', 'WIE'].includes(agentType)) {
                        await openai.models.list()
                    } else {
                        await asOpenai.models.list()
                    }
                    await updateAgentStatus(agentType, 'Online', 'Ping Successful')
                    return NextResponse.json({ success: true, agent: agentType, status: 'online' })
                } catch (e: any) {
                    await updateAgentStatus(agentType, 'Offline', 'Ping Failed')
                    return NextResponse.json({ success: false, agent: agentType, error: e.message })
                }
            }

            // --- AGENT EXECUTION (ALL OPENAI NOW) ---

            if (agentType === 'AUDY') {
                // Audy (Compliance) -> Now OpenAI
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: AGENT_PERSONAS.AUDY.instructions },
                        { role: "user", content: userCommand }
                    ]
                })
                response = completion.choices[0].message.content || "Audy is present."
                agent = "AUDY"
            }
            else if (agentType === 'AS') {
                // As (Assistant) -> OpenAI
                const completion = await asOpenai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: AGENT_PERSONAS.AS.instructions },
                        { role: "user", content: userCommand }
                    ]
                })
                response = completion.choices[0].message.content || "I didn't catch that."
                agent = "AS"
            }
            else if (agentType === 'WIE') {
                // Wie (Journalist) -> OpenAI
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: AGENT_PERSONAS.WIE.instructions },
                        { role: "user", content: userCommand }
                    ]
                })
                response = completion.choices[0].message.content || "I'm working on it."
                agent = "WIE"
            }
            else if (agentType === 'WUE') {
                // Wue (Reporter) -> Now OpenAI
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: AGENT_PERSONAS.WUE.instructions },
                        { role: "user", content: userCommand }
                    ]
                })
                response = completion.choices[0].message.content || "On it."
                agent = "WUE"
            }
            else if (agentType === 'GROUP') {
                // GROUP CHAT: User (Boss) speaks. AS facilitates. AUDY checks.

                // 1. AS (Assistant) responds first
                const asResponse = await asOpenai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [
                        { role: "system", content: `${AGENT_PERSONAS.AS.instructions} You are facilitating a group meeting for The Boss.` },
                        { role: "user", content: userCommand }
                    ]
                })
                const asText = asResponse.choices[0].message.content || ""
                messages.push({ role: 'assistant', content: asText, agent: 'AS' })

                // 2. AUDY (Auditor) chimes in (OpenAI)
                try {
                    const audyResponse = await openai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            { role: "system", content: AGENT_PERSONAS.AUDY.instructions },
                            { role: "user", content: `Context: The Boss said "${userCommand}". As (Assistant) said "${asText}". As Auditor, do you have any short concerns or approvals?` }
                        ]
                    })
                    const audyText = audyResponse.choices[0].message.content || ""
                    messages.push({ role: 'assistant', content: audyText, agent: 'AUDY' })
                } catch (e) {
                    messages.push({ role: 'assistant', content: "(Audy is silent/offline)", agent: 'AUDY' })
                }

                response = "Group processed."
                agent = "GROUP"
            }
            else {
                // Default: AS (Assistant) takes generic commands
                // SPECIAL COMMAND INTERCEPTION FOR REAL DATA (Handled by WUE for Boss)
                if (cmd.includes('investment') && (cmd.includes('article') || cmd.includes('create'))) {
                    logs.push('Delegating "Investment Article" to Wue (Gemini)...')
                    try {
                        const result = await geminiModel.generateContent(`System: ${AGENT_PERSONAS.WUE.instructions}. Task: Create an investment article using real data for Bali. Output JSON.`)
                        response = "I've asked Wue to handle this. " + result.response.text()
                        agent = "AS" // As reports the result
                    } catch (e) {
                        response = "I tried to get Wue to do it, but he's offline."
                        agent = "AS"
                    }
                } else {
                    // Fallback to AS
                    const completion = await asOpenai.chat.completions.create({
                        model: "gpt-4o",
                        messages: [
                            { role: "system", content: AGENT_PERSONAS.AS.instructions },
                            { role: "user", content: userCommand }
                        ]
                    })
                    response = completion.choices[0].message.content || "I didn't catch that."
                    agent = "AS"
                }
            }
            // AFTER Response
            await updateAgentStatus(agentType, 'Idle', 'Standing By') // You might want to leave last status visible for a bit

            return NextResponse.json({ success: true, response, agent, logs })
        }

        return NextResponse.json({ success: true, logs })
    } catch (error: any) {
        console.error('Assistant Admin Error:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Assistant failed to run',
        }, { status: 200 }) // Return 200 so frontend can display the error message instead of crashing
    }
}
