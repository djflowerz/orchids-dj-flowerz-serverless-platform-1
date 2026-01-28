import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    if (!user) {
        redirect('/login')
    }

    // Strict Server-Side Email Check
    if (user.email !== 'ianmuriithiflowerz@gmail.com') {
        redirect('/dashboard') // Or some unauthorized page
    }

    return (
        <>
            {children}
        </>
    )
}
