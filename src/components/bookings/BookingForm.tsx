"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import { Calendar, Clock, MapPin, MessageSquare, Send, Loader2, Phone, Mail, User, DollarSign, Heart } from 'lucide-react'

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'club', label: 'Club' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'roadshow', label: 'Roadshow' },
  { value: 'other', label: 'Other' },
]

export function BookingForm() {
  const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
      customer_name: '',
      email: '',
      phone: '',
      event_type: 'wedding',
      event_date: '',
      event_time: '',
      location: '',
      notes: '',
      estimated_budget: '',
      tipjar_amount: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setLoading(true)

      try {
        const response = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
            tipjar_amount: formData.tipjar_amount ? parseFloat(formData.tipjar_amount) : 0,
          })
        })

        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Failed to submit booking')
        }

        toast.success('Booking request sent successfully! We will contact you soon.')
        setFormData({
          customer_name: '',
          email: '',
          phone: '',
          event_type: 'wedding',
          event_date: '',
          event_time: '',
          location: '',
          notes: '',
          estimated_budget: '',
          tipjar_amount: '',
        })
    } catch (error) {
      console.error('Booking error:', error)
      toast.error('Failed to send booking request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <User size={14} />
            Full Name *
          </label>
            <input
              required
              type="text"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all"
            />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Mail size={14} />
            Email Address *
          </label>
          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@example.com"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Phone size={14} />
            Phone (WhatsApp Preferred) *
          </label>
          <input
            required
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+254..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">Event Type *</label>
          <select
            required
            value={formData.event_type}
            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all appearance-none"
          >
            {EVENT_TYPES.map(type => (
              <option key={type.value} value={type.value} className="bg-zinc-900">
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Calendar size={14} />
            Event Date *
          </label>
          <input
            required
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Clock size={14} />
            Event Time *
          </label>
          <input
            required
            type="time"
            value={formData.event_time}
            onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <MapPin size={14} />
            Event Location (City, Venue) *
          </label>
          <input
            required
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Nairobi, Villa Rosa Kempinski"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <MessageSquare size={14} />
            Notes / Special Requests
          </label>
          <textarea
            rows={4}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Tell us about your event, music preferences, special requirements..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <DollarSign size={14} />
            Estimated Budget (KES)
          </label>
          <input
            type="number"
            min="0"
            value={formData.estimated_budget}
            onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
            placeholder="Optional"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-fuchsia-500/50 outline-none transition-all"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Heart size={14} className="text-pink-400" />
            TipJar (KES) - Optional
          </label>
          <input
            type="number"
            min="0"
            value={formData.tipjar_amount}
            onChange={(e) => setFormData({ ...formData, tipjar_amount: e.target.value })}
            placeholder="Show some love!"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-pink-500/30 text-white focus:border-pink-500/50 outline-none transition-all"
          />
          <p className="text-white/40 text-xs">Support DJ FLOWERZ with a small tip!</p>
        </div>
      </div>

      <button
        disabled={loading}
        type="submit"
        className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="animate-spin" />
        ) : (
          <>
            <Send size={20} />
            Send Booking Request
          </>
        )}
      </button>
    </form>
  )
}
