import { useState, useEffect } from 'react'
import { Activity, Server, Database, Globe, AlertCircle, CheckCircle, Clock } from 'lucide-react'

interface WebhookLog {
    id: string
    source: string
    event: string
    status: 'success' | 'failed'
    timestamp: string
    payload: any
}

interface SystemStatus {
    api: 'healthy' | 'degraded' | 'down'
    database: 'healthy' | 'degraded' | 'down'
    paystack: { status: 'operational' | 'degraded' | 'outage', latency: number }
    storage: 'healthy' | 'degraded' | 'down'
}

export default function SystemHealthTab() {
    const [status, setStatus] = useState<SystemStatus>({
        api: 'healthy',
        database: 'healthy',
        paystack: { status: 'operational', latency: 45 },
        storage: 'healthy'
    })
    const [logs, setLogs] = useState<WebhookLog[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchHealth()
        const interval = setInterval(fetchHealth, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchHealth = async () => {
        try {
            const res = await fetch('/api/admin/system')
            if (res.ok) {
                const data = await res.json()
                setStatus(prev => ({
                    ...prev,
                    paystack: data.paystack
                }))
                if (data.logs) setLogs(data.logs)
            }
        } catch (e) { console.error(e) }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
            case 'operational':
                return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            case 'degraded':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
            case 'down':
            case 'outage':
                return 'text-red-400 bg-red-500/10 border-red-500/20'
            default:
                return 'text-white/60 bg-white/5 border-white/10'
        }
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Status Cards */}
                <div className={`p-4 rounded-xl border ${getStatusColor(status.api)}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Server size={18} />
                        <h3 className="font-semibold text-sm uppercase">API Server</h3>
                    </div>
                    <p className="text-xl font-bold capitalize">{status.api}</p>
                </div>

                <div className={`p-4 rounded-xl border ${getStatusColor(status.database)}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Database size={18} />
                        <h3 className="font-semibold text-sm uppercase">Database</h3>
                    </div>
                    <p className="text-xl font-bold capitalize">{status.database}</p>
                </div>

                <div className={`p-4 rounded-xl border ${getStatusColor(status.paystack.status)}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <Globe size={18} />
                        <h3 className="font-semibold text-sm uppercase">Paystack</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-xl font-bold capitalize">{status.paystack.status}</p>
                        <span className="text-xs opacity-60 mb-1">{status.paystack.latency}ms</span>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <Activity className="text-violet-400" />
                    Recent System Logs & Webhooks
                </h3>
                <div className="space-y-4">
                    {logs.length === 0 ? <p className="text-center text-white/50">No recent logs</p> : logs.map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                    }`}>
                                    {log.status === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">{log.source}</span>
                                        <span className="text-white/30">•</span>
                                        <span className="text-sm text-white/70">{log.event}</span>
                                    </div>
                                    <p className="text-xs text-white/30 mt-1 font-mono">{log.id}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-xs text-white/40 mb-1">
                                    <Clock size={12} />
                                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <button className="text-xs text-violet-400 hover:text-violet-300">View Payload</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
