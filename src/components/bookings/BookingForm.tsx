"use client"

import { useState } from 'react'
import { toast } from 'sonner'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { Calendar, Clock, MapPin, MessageSquare, Send, Loader2, Phone, Mail, User, DollarSign, Heart, Paperclip, X, Upload } from 'lucide-react'

const EVENT_TYPES = [
  { value: 'birthday', label: 'Birthday' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'club', label: 'Club' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'roadshow', label: 'Roadshow' },
  { value: 'other', label: 'Other' },
]

export function BookingForm() {
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
    event_type: 'birthday',
    event_date: '',
    event_time: '',
    location: '',
    notes: '',
    estimated_budget: '',
    tipjar_amount: '',
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let fileUrls: string[] = []

      // Upload files if any
      if (files.length > 0) {
        toast.info('Uploading attachments...')
        const uploadPromises = files.map(async (file) => {
          const storageRef = ref(storage, `bookings/${Date.now()}_${file.name}`)
          await uploadBytes(storageRef, file)
          return getDownloadURL(storageRef)
        })
        fileUrls = await Promise.all(uploadPromises)
      }

      const response = await fetch('/api/bookings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
          tipjar_amount: formData.tipjar_amount ? parseFloat(formData.tipjar_amount) : 0,
          attachments: fileUrls
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
        event_type: 'birthday',
        event_date: '',
        event_time: '',
        location: '',
        notes: '',
        estimated_budget: '',
        tipjar_amount: '',
      })
      setFiles([])
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

        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium text-white/70 flex items-center gap-2">
            <Paperclip size={14} />
            Attachments (Event plans, etc.)
          </label>
          <div className="flex flex-col gap-3">
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 cursor-pointer transition-all border-dashed"
              >
                <Upload size={16} />
                <span>{files.length > 0 ? 'Add more files' : 'Click to upload files'}</span>
              </label>
            </div>

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-fuchsia-500/10 text-fuchsia-400 text-sm border border-fuchsia-500/20">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="p-0.5 hover:bg-fuchsia-500/20 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
