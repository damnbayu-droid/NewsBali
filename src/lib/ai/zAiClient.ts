import ZAI from 'z-ai-web-dev-sdk'

let zaiInstance: ZAI | null = null

export async function getZaiClient(): Promise<ZAI> {
    if (!zaiInstance) {
        zaiInstance = await ZAI.create()
    }
    return zaiInstance
}
