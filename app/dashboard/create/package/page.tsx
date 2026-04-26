'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, CheckCircle2, CircleX, Gauge, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const plans = [
  {
    id: 1,
    name: 'Basic',
    price: '$49',
    period: '/week',
    features: ['7 days listing duration', 'Standard marketplace placement', 'Basic analytics dashboard'],
    disabled: ['Featured badge', 'Priority support'],
  },
  {
    id: 2,
    name: 'Standard',
    price: '$149',
    period: '/week',
    featured: true,
    features: ['14 days listing duration', 'Featured marketplace badge', 'Daily performance emails', 'Priority support ticket access'],
    disabled: ['Custom conversion tracking'],
  },
  {
    id: 3,
    name: 'Premium',
    price: '$399',
    period: '/week',
    features: ['30 days listing duration', 'Top-of-feed placement', 'Custom API integrations', 'Priority 24/7 account manager', 'Featured badge + social shoutout'],
    disabled: [],
  },
]

export default function SelectPackagePage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState(2)

  return (
    <div className="space-y-8">
      <section className="text-center">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#b6bcff]">Pricing Plans</p>
        <h1 className="mt-6 text-balance text-5xl font-extrabold tracking-tight text-white sm:text-6xl">The Luminous Ledger</h1>
        <p className="mx-auto mt-6 max-w-4xl text-xl leading-9 text-slate-300">
          Choose the sponsorship tier that matches your growth velocity. Precision-crafted visibility for the modern digital curator.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {plans.map((plan) => {
          const isSelected = selectedPlan === plan.id
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative cursor-pointer rounded-[30px] border p-8 text-left shadow-[0_20px_60px_rgba(2,7,25,0.28)] transition ${plan.featured || isSelected ? 'border-[#5b4df7] bg-[#272f4b]' : 'border-white/5 bg-[#1a223b] hover:border-white/15'}`}
            >
              {plan.featured && (
                <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#6255ff] to-[#189ced] px-5 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-white">
                  Most Popular
                </span>
              )}
              <h2 className="text-4xl font-extrabold text-white">{plan.name}</h2>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-6xl font-extrabold text-white">{plan.price}</span>
                <span className="pb-2 text-lg text-slate-400">{plan.period}</span>
              </div>

              <div className="mt-10 space-y-5 text-lg text-slate-300">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 flex-none text-[#bfbeff]" />
                    <span>{feature}</span>
                  </div>
                ))}
                {plan.disabled.map((feature) => (
                  <div key={feature} className="flex gap-3 text-slate-500">
                    <CircleX className="mt-1 h-5 w-5 flex-none text-slate-600" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10">
                <Button
                  className={`h-14 w-full rounded-2xl text-xl font-bold ${plan.featured || isSelected ? 'af-gradient text-white' : 'border border-white/15 bg-transparent text-white hover:bg-white/5'}`}
                  variant={plan.featured || isSelected ? 'default' : 'outline'}
                  onClick={(event) => {
                    event.stopPropagation()
                    router.push('/dashboard/create/payment')
                  }}
                >
                  {plan.featured ? 'Get Started' : 'Select Plan'}
                </Button>
              </div>
            </div>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr_0.8fr]">
        <div className="af-panel p-8">
          <h3 className="text-4xl font-extrabold text-white">Enterprise Solutions</h3>
          <p className="mt-4 max-w-2xl text-xl leading-9 text-slate-300">
            Need more than 50 ads per month? Contact our sales team for bespoke marketplace white-labelling and volume discounts.
          </p>
          <button type="button" className="mt-10 inline-flex items-center gap-3 text-2xl font-semibold text-[#d7dbff] transition hover:text-white">
            Talk to Sales <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="af-panel flex flex-col items-center justify-center p-8 text-center">
          <ShieldCheck className="h-12 w-12 text-[#8fd0ff]" />
          <h3 className="mt-8 text-3xl font-extrabold text-white">Secure Ledger</h3>
          <p className="mt-4 text-lg leading-8 text-slate-300">All transactions are encrypted using enterprise-grade protocols.</p>
        </div>

        <div className="af-panel flex flex-col items-center justify-center p-8 text-center">
          <Gauge className="h-12 w-12 text-[#c3c6ff]" />
          <h3 className="mt-8 text-3xl font-extrabold text-white">Instant Live</h3>
          <p className="mt-4 text-lg leading-8 text-slate-300">Your ad goes live within seconds of payment confirmation.</p>
        </div>
      </section>

      <footer className="flex flex-col gap-4 border-t border-white/5 px-1 pt-8 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-2xl font-extrabold uppercase text-white">AdFlow Pro</p>
          <p className="mt-2">© 2024 AdFlow Pro. The Digital Curator.</p>
        </div>
        <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.18em]">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Cookie Policy</span>
        </div>
      </footer>
    </div>
  )
}
