import Link from 'next/link'
import { Check, X, Crown, Zap, Star, Send, Headphones, Download, Music } from 'lucide-react'

const plans = [
  {
    name: '1 Week',
    price: 200,
    period: 'week',
    description: 'Perfect for trying out',
    features: [
      { text: 'Access to Music Pool', included: true },
      { text: 'Unlimited downloads', included: true },
      { text: 'Telegram group access', included: true },
      { text: 'New releases weekly', included: true },
      { text: 'Pro tier tracks', included: false },
      { text: 'Early access drops', included: false },
    ],
    payLink: 'https://paystack.shop/pay/7u8-7dn081',
    popular: false,
    color: 'from-zinc-500 to-zinc-600',
  },
  {
    name: '1 Month',
    price: 700,
    period: 'month',
    description: 'Most popular choice',
    features: [
      { text: 'Access to Music Pool', included: true },
      { text: 'Unlimited downloads', included: true },
      { text: 'Telegram group access', included: true },
      { text: 'New releases weekly', included: true },
      { text: 'Pro tier tracks', included: true },
      { text: 'Early access drops', included: false },
    ],
    payLink: 'https://paystack.shop/pay/u0qw529xyk',
    popular: true,
    color: 'from-fuchsia-500 to-cyan-500',
  },
  {
    name: '3 Months',
    price: 1800,
    period: '3 months',
    description: 'Save KSh 300',
    features: [
      { text: 'Access to Music Pool', included: true },
      { text: 'Unlimited downloads', included: true },
      { text: 'Telegram group access', included: true },
      { text: 'New releases weekly', included: true },
      { text: 'Pro tier tracks', included: true },
      { text: 'Early access drops', included: true },
    ],
    payLink: 'https://paystack.shop/pay/ayljjgzxzp',
    popular: false,
    color: 'from-cyan-500 to-blue-500',
  },
  {
    name: '6 Months',
    price: 3500,
    period: '6 months',
    description: 'Save KSh 700',
    features: [
      { text: 'Access to Music Pool', included: true },
      { text: 'Unlimited downloads', included: true },
      { text: 'Telegram group access', included: true },
      { text: 'New releases weekly', included: true },
      { text: 'Pro tier tracks', included: true },
      { text: 'Early access drops', included: true },
    ],
    payLink: 'https://paystack.shop/pay/5p4gjiehpv',
    popular: false,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    name: '12 Months VIP',
    price: 6000,
    period: 'year',
    description: 'Best value - Save KSh 2,400',
    features: [
      { text: 'Access to Music Pool', included: true },
      { text: 'Unlimited downloads', included: true },
      { text: 'Telegram group access', included: true },
      { text: 'New releases weekly', included: true },
      { text: 'Pro tier tracks', included: true },
      { text: 'Early access drops', included: true },
      { text: 'VIP badge', included: true },
      { text: 'Priority support', included: true },
    ],
    payLink: 'https://paystack.shop/pay/po2leez4hy',
    popular: false,
    color: 'from-amber-500 to-yellow-500',
    vip: true,
  },
]

const freeFeatures = [
  'Browse all free mixtapes',
  'Stream unlimited mixes',
  'Download free content',
  'Join community',
  'Newsletter updates',
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-sm font-medium mb-6">
            <Crown size={18} />
            <span>Music Pool Subscriptions</span>
          </div>
          <h1 className="font-display text-5xl sm:text-7xl text-white mb-6">CHOOSE YOUR PLAN</h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Get unlimited access to exclusive DJ edits, remixes, and tools. 
            All plans include Telegram community access.
          </p>
        </div>

        <div className="mb-16 p-8 rounded-3xl bg-gradient-to-br from-white/5 to-white/0 border border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Free Account</h2>
              <p className="text-white/60 mb-4">Always free, no credit card required</p>
              <ul className="space-y-2">
                {freeFeatures.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/70">
                    <Check size={16} className="text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/signup"
              className="px-8 py-4 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
            >
              Create Free Account
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-3xl border transition-all hover:scale-[1.02] ${
                plan.popular
                  ? 'bg-gradient-to-b from-fuchsia-500/20 to-cyan-500/10 border-fuchsia-500/30'
                  : plan.vip
                  ? 'bg-gradient-to-b from-amber-500/20 to-yellow-500/10 border-amber-500/30'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-bold">
                  POPULAR
                </div>
              )}
              {plan.vip && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs font-bold flex items-center gap-1">
                  <Crown size={12} /> VIP
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-white/50 text-sm mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-white/50 text-lg">KSh</span>
                  <span className="text-white text-4xl font-bold">{plan.price.toLocaleString()}</span>
                </div>
                <p className="text-white/40 text-sm">/{plan.period}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {feature.included ? (
                      <Check size={16} className="text-green-400 shrink-0" />
                    ) : (
                      <X size={16} className="text-white/30 shrink-0" />
                    )}
                    <span className={feature.included ? 'text-white/80' : 'text-white/40'}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.payLink}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full py-3 rounded-full font-semibold text-center transition-all ${
                  plan.popular
                    ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white hover:opacity-90'
                    : plan.vip
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black hover:opacity-90'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                Subscribe
              </a>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-fuchsia-500/20 flex items-center justify-center">
              <Download size={28} className="text-fuchsia-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Unlimited Downloads</h3>
            <p className="text-white/50 text-sm">
              Download as many tracks as you want with no limits or restrictions.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-cyan-500/20 flex items-center justify-center">
              <Send size={28} className="text-cyan-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Telegram Access</h3>
            <p className="text-white/50 text-sm">
              Join our exclusive Telegram channels for new releases and DJ community.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-500/20 flex items-center justify-center">
              <Music size={28} className="text-amber-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Weekly Updates</h3>
            <p className="text-white/50 text-sm">
              Fresh tracks added every week with the latest hits and exclusive edits.
            </p>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-gradient-to-r from-fuchsia-500/10 to-cyan-500/10 border border-fuchsia-500/20 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help Choosing?</h2>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            Not sure which plan is right for you? Start with the 1-week trial or contact us for personalized recommendations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://paystack.shop/pay/7u8-7dn081"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-all"
            >
              Try 1 Week - KSh 200
            </a>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-full bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
