'use client'

import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  pulse: number
  pulseSpeed: number
}

interface Particle {
  x: number
  y: number
  tx: number
  ty: number
  progress: number
  speed: number
  pathIndex: number
  opacity: number
  size: number
}

export default function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let width = 0
    let height = 0

    const nodes: Node[] = []
    const particles: Particle[] = []
    const maxParticles = 40

    const NAVY = '#0F172A'
    const STEEL = '#1E3A5F'
    const ACCENT = '#38BDF8'

    function resize() {
      const rect = canvas!.getBoundingClientRect()
      width = canvas!.width = rect.width * window.devicePixelRatio
      height = canvas!.height = rect.height * window.devicePixelRatio
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    function initNodes() {
      nodes.length = 0
      const count = Math.min(18, Math.floor(width / 80))
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * (width / window.devicePixelRatio),
          y: Math.random() * (height / window.devicePixelRatio),
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 3 + 2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.02,
        })
      }
    }

    function spawnParticle() {
      if (particles.length >= maxParticles || nodes.length < 2) return
      const fromIdx = Math.floor(Math.random() * nodes.length)
      let toIdx = Math.floor(Math.random() * nodes.length)
      while (toIdx === fromIdx) toIdx = Math.floor(Math.random() * nodes.length)

      const from = nodes[fromIdx]
      const to = nodes[toIdx]
      const dist = Math.hypot(to.x - from.x, to.y - from.y)
      if (dist > 300) return

      particles.push({
        x: from.x,
        y: from.y,
        tx: to.x,
        ty: to.y,
        progress: 0,
        speed: 0.003 + Math.random() * 0.005,
        pathIndex: fromIdx * nodes.length + toIdx,
        opacity: 0,
        size: Math.random() * 2 + 1,
      })
    }

    function draw() {
      const w = width / window.devicePixelRatio
      const h = height / window.devicePixelRatio

      ctx!.clearRect(0, 0, w, h)

      // Update nodes
      nodes.forEach((node) => {
        node.x += node.vx
        node.y += node.vy
        node.pulse += node.pulseSpeed
        if (node.x < 0 || node.x > w) node.vx *= -1
        if (node.y < 0 || node.y > h) node.vy *= -1
      })

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i]
          const b = nodes[j]
          const dist = Math.hypot(b.x - a.x, b.y - a.y)
          const maxDist = 180

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.15
            ctx!.beginPath()
            ctx!.moveTo(a.x, a.y)
            ctx!.lineTo(b.x, b.y)
            ctx!.strokeStyle = `rgba(30, 58, 95, ${alpha})`
            ctx!.lineWidth = 0.8
            ctx!.stroke()
          }
        }
      }

      // Draw nodes
      nodes.forEach((node, i) => {
        const pulse = Math.sin(node.pulse)
        const baseR = node.r
        const r = baseR + pulse * 1.5

        // Outer glow
        const grad = ctx!.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3)
        grad.addColorStop(0, i % 5 === 0 ? `rgba(56, 189, 248, 0.15)` : `rgba(30, 58, 95, 0.1)`)
        grad.addColorStop(1, 'transparent')
        ctx!.beginPath()
        ctx!.arc(node.x, node.y, r * 3, 0, Math.PI * 2)
        ctx!.fillStyle = grad
        ctx!.fill()

        // Node dot
        ctx!.beginPath()
        ctx!.arc(node.x, node.y, r, 0, Math.PI * 2)
        ctx!.fillStyle = i % 5 === 0 ? ACCENT : STEEL
        ctx!.globalAlpha = 0.6 + pulse * 0.2
        ctx!.fill()
        ctx!.globalAlpha = 1
      })

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.progress = Math.min(1, p.progress + p.speed)

        const ease = p.progress < 0.5
          ? 2 * p.progress * p.progress
          : -1 + (4 - 2 * p.progress) * p.progress

        p.x = p.x + (p.tx - p.x) * p.speed * 3
        p.y = p.y + (p.ty - p.y) * p.speed * 3

        p.opacity = p.progress < 0.2
          ? p.progress / 0.2
          : p.progress > 0.8
          ? (1 - p.progress) / 0.2
          : 1

        ctx!.beginPath()
        ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx!.fillStyle = ACCENT
        ctx!.globalAlpha = p.opacity * 0.7
        ctx!.fill()
        ctx!.globalAlpha = 1

        if (p.progress >= 1) {
          particles.splice(i, 1)
        }
      }

      // Draw market chart lines (decorative)
      drawChartLines(w, h)

      // Spawn particles occasionally
      if (Math.random() < 0.05) spawnParticle()

      animId = requestAnimationFrame(draw)
    }

    function drawChartLines(w: number, h: number) {
      const lineData = [
        [0.1, 0.55, 0.15, 0.52, 0.2, 0.58, 0.25, 0.54, 0.3, 0.5, 0.35, 0.53, 0.4, 0.48],
        [0.6, 0.7, 0.65, 0.66, 0.7, 0.69, 0.75, 0.64, 0.8, 0.67, 0.85, 0.62, 0.9, 0.65],
      ]

      lineData.forEach((points, idx) => {
        ctx!.beginPath()
        for (let i = 0; i < points.length; i += 2) {
          const x = points[i] * w
          const y = points[i + 1] * h
          if (i === 0) ctx!.moveTo(x, y)
          else ctx!.lineTo(x, y)
        }
        ctx!.strokeStyle = idx === 0
          ? `rgba(56, 189, 248, 0.12)`
          : `rgba(30, 58, 95, 0.08)`
        ctx!.lineWidth = 1.5
        ctx!.stroke()
      })
    }

    const resizeObs = new ResizeObserver(() => {
      resize()
      initNodes()
    })
    resizeObs.observe(canvas)
    resize()
    initNodes()

    // Stagger initial particle spawning
    for (let i = 0; i < 15; i++) {
      setTimeout(() => spawnParticle(), i * 200)
    }

    draw()

    return () => {
      cancelAnimationFrame(animId)
      resizeObs.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
      style={{ display: 'block' }}
    />
  )
}
