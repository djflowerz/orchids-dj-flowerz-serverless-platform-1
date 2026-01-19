"use client"

import { useState } from 'react'
import { Mail, Phone, Send, MessageCircle, MapPin, Clock, FileText, Shield, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ContactPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast.success('Message sent! We\'ll get back to you within 24 hours.')
    setFormData({ name: '', email: '', subject: '', message: '' })
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            <MessageCircle size={18} />
            <span>Get in Touch</span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-6">CONTACT US</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Have questions, need support, or want to collaborate? We're here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Your Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Subject</label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-fuchsia-500/50"
                  >
                    <option value="" className="bg-zinc-900">Select a topic</option>
                    <option value="general" className="bg-zinc-900">General Inquiry</option>
                    <option value="subscription" className="bg-zinc-900">Subscription Support</option>
                    <option value="booking" className="bg-zinc-900">DJ Booking</option>
                    <option value="technical" className="bg-zinc-900">Technical Issue</option>
                    <option value="refund" className="bg-zinc-900">Refund Request</option>
                    <option value="partnership" className="bg-zinc-900">Partnership / Collaboration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-2">Message</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/40 focus:outline-none focus:border-fuchsia-500/50 resize-none"
                    placeholder="Tell us how we can help..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={20} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-fuchsia-500/20 flex items-center justify-center mb-4">
                <Mail size={24} className="text-fuchsia-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Email</h3>
              <p className="text-white/50 text-sm mb-3">For general inquiries and support</p>
              <a href="mailto:djflowerz254@gmail.com" className="text-fuchsia-400 hover:text-fuchsia-300 transition-colors">
                djflowerz254@gmail.com
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <Phone size={24} className="text-green-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">WhatsApp</h3>
              <p className="text-white/50 text-sm mb-3">Quick responses for urgent matters</p>
              <a 
                href="https://wa.me/254789783258" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                +254 789 783 258
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <Send size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Telegram</h3>
              <p className="text-white/50 text-sm mb-3">Join our community channel</p>
              <a 
                href="https://t.me/djflowerz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                @djflowerz
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                <Clock size={24} className="text-amber-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Response Time</h3>
              <p className="text-white/50 text-sm">
                We typically respond within 24 hours on business days.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link href="/terms" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-fuchsia-500/20 transition-colors">
                <FileText size={24} className="text-white/70 group-hover:text-fuchsia-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Terms of Service</h3>
                <p className="text-white/50 text-sm">Read our terms and conditions</p>
              </div>
            </div>
          </Link>

          <Link href="/privacy" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
                <Shield size={24} className="text-white/70 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Privacy Policy</h3>
                <p className="text-white/50 text-sm">How we handle your data</p>
              </div>
            </div>
          </Link>

          <Link href="/refund" className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                <RefreshCw size={24} className="text-white/70 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Refund Policy</h3>
                <p className="text-white/50 text-sm">Our refund guidelines</p>
              </div>
            </div>
          </Link>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 border border-fuchsia-500/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Looking to Book DJ FLOWERZ?</h2>
              <p className="text-white/60">
                For event bookings, collaborations, or press inquiries, visit our dedicated booking page.
              </p>
            </div>
            <Link
              href="/bookings"
              className="px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-all whitespace-nowrap"
            >
              Book Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
