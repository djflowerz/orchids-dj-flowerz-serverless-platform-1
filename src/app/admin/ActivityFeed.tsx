import { User, ShoppingBag, Calendar, DollarSign, Music, Star, Zap } from 'lucide-react'

interface ActivityItem {
    id: string
    type: 'user' | 'order' | 'booking' | 'transaction' | 'mixtape'
    title: string
    description: string
    time: Date
    user?: string
}

export default function ActivityFeed({ users, orders, bookings, transactions, mixtapes }: any) {
    // Merge and sort data to create feed
    const activities: ActivityItem[] = []

    users.forEach((u: any) => activities.push({
        id: `u-${u.id}`,
        type: 'user',
        title: 'New User Joined',
        description: `${u.name || 'User'} created an account`,
        time: new Date(u.created_at),
        user: u.name
    }))

    orders.forEach((o: any) => activities.push({
        id: `o-${o.id}`,
        type: 'order',
        title: 'New Order Placed',
        description: `${o.userEmail} ordered ${o.items?.length || 0} items (${new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(o.total)})`,
        time: new Date(o.createdAt || o.created_at),
        user: o.userName
    }))

    bookings.forEach((b: any) => activities.push({
        id: `b-${b.id}`,
        type: 'booking',
        title: 'New Booking',
        description: `${b.event_type} on ${new Date(b.event_date).toLocaleDateString()}`,
        time: new Date(b.created_at),
        user: b.customer_name
    }))

    transactions.forEach((t: any) => activities.push({
        id: `t-${t.id}`,
        type: 'transaction',
        title: 'Payment Received',
        description: `Received ${new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(t.amount)} via ${t.payment_method}`,
        time: new Date(t.created_at),
        user: t.user_email
    }))

    mixtapes.forEach((m: any) => activities.push({
        id: `m-${m.id}`,
        type: 'mixtape',
        title: 'Mixtape Added',
        description: `${m.title} (${m.genre})`,
        time: new Date(m.created_at),
        user: 'System'
    }))

    // Sort by time descending
    const feed = activities.sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 20)

    const getIcon = (type: string) => {
        switch (type) {
            case 'user': return <User size={16} className="text-blue-400" />
            case 'order': return <ShoppingBag size={16} className="text-emerald-400" />
            case 'booking': return <Calendar size={16} className="text-violet-400" />
            case 'transaction': return <DollarSign size={16} className="text-amber-400" />
            case 'mixtape': return <Music size={16} className="text-fuchsia-400" />
            default: return <Zap size={16} className="text-white" />
        }
    }

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
        let interval = seconds / 31536000
        if (interval > 1) return Math.floor(interval) + " years ago"
        interval = seconds / 2592000
        if (interval > 1) return Math.floor(interval) + " months ago"
        interval = seconds / 86400
        if (interval > 1) return Math.floor(interval) + " days ago"
        interval = seconds / 3600
        if (interval > 1) return Math.floor(interval) + " hours ago"
        interval = seconds / 60
        if (interval > 1) return Math.floor(interval) + " minutes ago"
        return Math.floor(seconds) + " seconds ago"
    }

    return (
        <div className="bg-white/5 rounded-2xl border border-white/10 p-6 h-full">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <Zap className="text-yellow-400" size={20} />
                Live Activity Feed
            </h3>
            <div className="relative border-l border-white/10 ml-3 space-y-8">
                {feed.map((item) => (
                    <div key={item.id} className="relative pl-8">
                        <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#12121a] border border-white/20 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/50"></span>
                        </span>

                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    {getIcon(item.type)}
                                    <p className="font-semibold text-sm">{item.title}</p>
                                </div>
                                <p className="text-sm text-white/60">{item.description}</p>
                                {item.user && <p className="text-xs text-white/30 mt-1">by {item.user}</p>}
                            </div>
                            <span className="text-xs text-white/30 whitespace-nowrap ml-4">{getTimeAgo(item.time)}</span>
                        </div>
                    </div>
                ))}
                {feed.length === 0 && <p className="text-white/50 text-center py-4 pl-4">No recent activity</p>}
            </div>
        </div>
    )
}
