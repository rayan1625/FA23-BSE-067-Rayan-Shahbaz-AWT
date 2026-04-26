import Image from 'next/image'
import { Bot, Code2, Layers3, Sparkles, Cpu } from 'lucide-react'

const skills = [
  { label: 'Full-Stack Development', icon: Code2 },
  { label: 'System Architecture', icon: Layers3 },
  { label: 'UI / UX Design', icon: Sparkles },
  { label: 'AI & API Integration', icon: Bot },
] as const

export function MeetTheCreator() {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-cyan-400/15 bg-[hsl(222_38%_11%)] shadow-[0_0_80px_-20px_hsl(var(--primary)/0.35)]">
      {/* subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute -left-24 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[100px]" aria-hidden />
      <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-cyan-400/10 blur-[90px]" aria-hidden />

      <div className="relative px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <header className="mb-8 text-center sm:mb-10">
          <h2
            id="meet-creator-heading"
            className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl"
          >
            Meet the Creator
          </h2>
          <p className="mt-2 text-base text-slate-400 sm:text-lg">
            The mind behind <span className="font-semibold text-cyan-300">AdFlow Pro</span>
          </p>
        </header>

        <div className="mx-auto max-w-4xl rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-[hsl(222_42%_14%)]/95 to-[hsl(222_50%_8%)]/90 p-6 shadow-inner shadow-black/20 sm:p-8 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-cyan-200">
            <Cpu className="h-3.5 w-3.5" aria-hidden />
            Full-Stack &amp; AI Engineer
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-start md:gap-10">
            <div className="flex shrink-0 justify-center md:justify-start">
              <div className="relative rounded-full p-[3px] shadow-[0_0_40px_rgba(217,70,239,0.45)] ring-2 ring-fuchsia-500/30">
                <div className="rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600 p-[3px]">
                  <div className="relative h-36 w-36 overflow-hidden rounded-full bg-[#0f1629] sm:h-40 sm:w-40">
                    <Image
                      src="https://raw.githubusercontent.com/Rayan-Shahbaz-Dev/My-projects-picks/refs/heads/main/personalpicks%20(1).png"
                      alt="Rayan Shahbaz — creator of AdFlow Pro"
                      width={160}
                      height={160}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-4 text-center md:text-left">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl md:text-4xl">
                  Rayan Shahbaz
                </h3>
                <p className="mt-1 text-lg font-semibold text-cyan-300 sm:text-xl">
                  Founder &amp; Lead Developer · FA23-BCS-030
                </p>
              </div>

              <div className="space-y-3 text-sm leading-relaxed text-slate-300 sm:text-base">
                <p>
                  Full-stack developer focused on modern web platforms. AdFlow Pro is built with{' '}
                  <strong className="font-semibold text-white">Next.js 14</strong>,{' '}
                  <strong className="font-semibold text-white">TypeScript</strong>, and{' '}
                  <strong className="font-semibold text-white">Supabase</strong> — combining polished UI with secure
                  auth, role-based dashboards, and a scalable data model for sponsored listings.
                </p>
                <p>
                  The product explores <strong className="font-semibold text-white">AI-assisted workflows</strong>{' '}
                  (optional OpenAI routes), automation-friendly APIs, and dashboard experiences that feel fast and
                  intentional — from explore and detail pages to seller, moderator, and admin surfaces.
                </p>
              </div>

              <ul className="flex flex-wrap justify-center gap-2 pt-2 md:justify-start">
                {skills.map(({ label, icon: Icon }) => (
                  <li
                    key={label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-200 backdrop-blur-sm sm:text-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
