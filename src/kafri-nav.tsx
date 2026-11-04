import * as React from "react"
import { createRoot } from "react-dom/client"
import { LiquidNavbar, type LiquidNavItem } from "@/components/ui/liquid-glass-navbar"

/* Kafri Nadlan header nav: the site's existing anchors, rendered as the liquid pill. */

const icon = (d: React.ReactNode) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
)

// lucide: shield-check, building-2, book-open, users, calendar-check
const ITEMS: LiquidNavItem[] = [
  {
    label: "שקיפות",
    href: "#transparency",
    fx: "pop",
    icon: icon(<><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>),
  },
  {
    label: "הפרויקטים",
    href: "#projects",
    fx: "glow",
    icon: icon(<><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4M10 10h4M10 14h4M10 18h4" /></>),
  },
  {
    label: "מרכז ידע",
    href: "#knowledge",
    fx: "spin",
    icon: icon(<><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>),
  },
  {
    label: "עלינו",
    href: "#about",
    fx: "wave",
    icon: icon(<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>),
  },
  {
    label: "תיאום פגישה",
    href: "#contact",
    fx: "pop",
    icon: icon(<><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></>),
  },
]

const HEADER_OFFSET = 68 + 140 // sticky header + breathing room

type RGB = [number, number, number]

// resolve a CSS variable from the site's :root palette to [r, g, b] in 0..1
const brand = (name: string): RGB => {
  const css = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const ctx = document.createElement("canvas").getContext("2d")!
  ctx.canvas.width = ctx.canvas.height = 1
  ctx.fillStyle = css
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
  return [r / 255, g / 255, b / 255]
}
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]

// the active drop is navy glass with a gold edge and warm cream glints, all from the site's own variables
const brandWater = () => {
  const navy = brand("--navy")
  const gold = brand("--gold")
  const cream = brand("--cream")
  return {
    tint: mix(navy, cream, 0.5),
    rim: gold,
    glint: mix(cream, [1, 1, 1], 0.6),
    strength: 1.25,
  }
}

function KafriNav() {
  const [active, setActive] = React.useState(0)
  const [compact, setCompact] = React.useState(false)
  const lockUntil = React.useRef(0)
  const water = React.useMemo(brandWater, [])

  // icons only on tablet/phone so the pill, logo and CTA fit in the header
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)")
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // highlight the section currently in view
  React.useEffect(() => {
    const ids = ITEMS.map((it) => (it.href ?? "").slice(1))
    let frame = 0
    const update = () => {
      frame = 0
      if (performance.now() < lockUntil.current) return
      // a project page is open (the main page is hidden): keep "הפרויקטים" lit
      if (document.getElementById("home")?.hidden) { setActive(ids.indexOf("projects")); return }
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
      let idx = 0
      ids.forEach((id, i) => {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= HEADER_OFFSET) idx = i
      })
      setActive(atBottom ? ids.length - 1 : idx)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("hashchange", onScroll)
    update()
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("hashchange", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <LiquidNavbar
      className="kafri-nav"
      tone="light"
      water={water}
      items={ITEMS}
      active={active}
      compact={compact}
      onChange={(i) => {
        lockUntil.current = performance.now() + 900 // let the smooth scroll land first
        setActive(i)
      }}
    />
  )
}

const root = document.getElementById("nav-root")
if (root) createRoot(root).render(<KafriNav />)
