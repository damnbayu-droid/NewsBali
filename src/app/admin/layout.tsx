import { AdminChatWidget } from '@/components/admin/chat-widget'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {children}
            <AdminChatWidget />
        </>
    )
}
