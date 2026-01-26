import { X, Copy, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';

interface Transaction {
    id: string
    user_id: string
    user_email: string
    amount: number
    type: string
    status: string
    reference: string
    payment_method: string
    created_at: string
    [key: string]: any // For any extra fields
}

export function TransactionDetailModal({ transaction, onClose, formatCurrency, formatDate }: { transaction: Transaction; onClose: () => void; formatCurrency: (n: number) => string; formatDate: (d: string) => string }) {
    const [copied, setCopied] = useState('');

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        setTimeout(() => setCopied(''), 2000);
    }

    const DataField = ({ label, value, copyable = false }: { label: string; value: any; copyable?: boolean }) => (
        <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <p className="text-white/50 text-xs mb-1 uppercase tracking-wider">{label}</p>
            <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-sm break-all">{value || 'N/A'}</p>
                {copyable && value && (
                    <button
                        onClick={() => handleCopy(String(value), label)}
                        className="text-white/30 hover:text-white transition-colors"
                    >
                        {copied === label ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                )}
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#12121a] rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Transaction Details</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10"><X size={18} /></button>
                </div>

                <div className="p-6 space-y-4">

                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/10 mb-4">
                        <div>
                            <p className="text-white/50 text-sm">Amount</p>
                            <p className="text-2xl font-bold text-white">{formatCurrency(transaction.amount)}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${transaction.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                transaction.status === 'pending' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}>
                            {transaction.status}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        <DataField label="Transaction ID" value={transaction.id} copyable />
                        <DataField label="Reference" value={transaction.reference} copyable />
                        <DataField label="User Email" value={transaction.user_email} copyable />
                        <DataField label="User ID" value={transaction.user_id} copyable />
                        <DataField label="Type" value={transaction.type} />
                        <DataField label="Method" value={transaction.payment_method} />
                        <DataField label="Date" value={formatDate(transaction.created_at)} />
                    </div>

                    {/* Raw Data Toggle or View */}
                    <div className="mt-6 pt-4 border-t border-white/10">
                        <details className="text-xs text-white/50">
                            <summary className="cursor-pointer hover:text-white transition-colors">View Raw JSON</summary>
                            <pre className="mt-2 p-3 bg-black/30 rounded-lg overflow-x-auto">
                                {JSON.stringify(transaction, null, 2)}
                            </pre>
                        </details>
                    </div>

                </div>
            </div>
        </div>
    )
}
