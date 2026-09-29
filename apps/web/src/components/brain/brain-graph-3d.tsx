'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ForceGraph3D from 'react-force-graph-3d'
import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import type { BrainGraphNode, BrainGraphLink } from '@/lib/brain-graph'

interface BrainGraph3DProps {
  nodes: BrainGraphNode[]
  links: BrainGraphLink[]
  reducedMotion: boolean
  /** Omit when nodes are not destinations — a mind map's nodes go nowhere. */
  onNodeOpen?: (node: BrainGraphNode) => void
  /**
   * What sits at the centre. 'logo' (default) is the dashboard's brand mark —
   * right when the core IS athora's brain. A mind map's centre is the root
   * topic instead, so it takes 'glow' and lets the label carry the meaning.
   */
  coreSprite?: 'logo' | 'glow'
  /**
   * 'hover' (default) leaves labels to the native tooltip, which is what keeps
   * a 400-node nebula readable.
   * 'card' renders each node as a real HTML card through CSS2DRenderer — for a
   * mind map, where the words ARE the content: text stays crisp at any zoom and
   * long labels wrap instead of being cut, which a canvas sprite cannot do.
   */
  labelMode?: 'hover' | 'card'
}

/**
 * Radial-gradient glow texture, built once and shared by every sprite.
 * This is what makes the graph read as a nebula instead of a pile of balls —
 * veronica gets the same effect in 2D by hand-painting a canvas gradient per
 * node (nodeCanvasObject + "replace"); in WebGL one texture on N sprites is
 * the cheap equivalent.
 */
function makeGlowTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  // Hot white core → coloured mid → transparent edge. The sprite is tinted
  // per node, so keep this greyscale.
  g.addColorStop(0.0, 'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(255,255,255,0.85)')
  g.addColorStop(0.42, 'rgba(180,180,180,0.35)')
  g.addColorStop(1.0, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

/**
 * The brand mark as a sprite texture. logo.png is an opaque 128x128 tile, so
 * the corners are rounded here — a raw sprite would read as a hard square
 * pasted over the nebula. Drawn into a canvas because that is the only way to
 * give a texture an alpha channel it does not ship with.
 */
function makeLogoTexture(): THREE.Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace

  new THREE.ImageLoader().load('/images/logo.png', (img) => {
    const r = size * 0.22
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(0, 0, size, size, r)
    ctx.clip()
    ctx.drawImage(img, 0, 0, size, size)
    ctx.restore()
    // The canvas was drawn after the texture was created, so the GPU copy is
    // stale until we say so.
    tex.needsUpdate = true
  })

  return tex
}

/**
 * A node rendered as a real HTML card, placed in the 3D scene by
 * CSS2DRenderer. A canvas sprite was tried first and is the wrong tool here:
 * it is a fixed-resolution bitmap, so text goes soft as you zoom in, and a
 * long label has to be truncated to keep the sprite from becoming a banner.
 * A DOM card stays crisp at any zoom and wraps its text, which is what makes
 * the map readable as a mind map instead of a constellation of dots.
 *
 * Fixed pixel size is deliberate: cards do not shrink as the camera pulls
 * back, so the content stays legible while the graph's shape still reads from
 * the node positions and links.
 */
function makeCardElement(node: BrainGraphNode, hex: string): HTMLDivElement {
  const el = document.createElement('div')
  const isCore = node.kind === 'core'
  const isBranch = node.kind === 'session'
  const isLeaf = node.kind === 'concept'

  el.textContent = node.label
  el.style.cssText = [
    'box-sizing:border-box',
    // The WebGL layer owns every gesture — rotate, pan, node drag, click. A
    // card that accepted pointer events would swallow them and the graph would
    // go dead wherever a card happens to be.
    'pointer-events:none',
    'user-select:none',
    'font-family:system-ui,-apple-system,"Segoe UI",sans-serif',
    'text-align:left',
    'line-height:1.35',
    'overflow-wrap:anywhere',
    `max-width:${isCore ? 240 : isBranch ? 200 : isLeaf ? 160 : 180}px`,
    `padding:${isCore ? '11px 15px' : isLeaf ? '7px 10px' : '8px 12px'}`,
    `font-size:${isCore ? 15 : isBranch ? 13 : isLeaf ? 11.5 : 12}px`,
    `font-weight:${isCore || isBranch ? 700 : 600}`,
    `border-radius:${isCore ? 12 : 9}px`,
    // Near-white, not a lavender-grey: this text sits on a dark canvas at small
    // sizes, where any tint is contrast thrown away for no visual gain.
    `color:${isCore || isBranch ? '#ffffff' : '#e9e7f5'}`,
    // Depth reads through weight and border, not hue: the root is a filled
    // chip, branches carry a thick hue spine, leaves are quiet outlines.
    //
    // Fully opaque on purpose. DEPTH_ALPHA dims the deeper nodes and the glow
    // honours it, but the card must NOT — fading text to 60% over a dark canvas
    // is what made the first pass unreadable. The glow carries depth; the card
    // carries meaning.
    `background:${isCore ? '#2a1207' : isBranch ? '#141227' : '#12121c'}`,
    `border:1px solid ${hex}${isCore || isBranch ? 'e6' : '80'}`,
    `border-left:${isCore ? 1 : isBranch ? 4 : 2}px solid ${hex}`,
    `box-shadow:0 2px 14px rgba(0,0,0,0.55), 0 0 ${isCore ? 22 : isBranch ? 14 : 8}px ${hex}${isCore ? '4d' : '2e'}`,
  ].join(';')

  return el
}

/**
 * Veronica's `__trunk`: the core↔hub spine. force-graph swaps link endpoints
 * from ids to node objects once the simulation starts, so accept both shapes.
 * A mind map's root is not called 'core', so an explicit `kind` counts too.
 */
function isTrunk(link: object): boolean {
  const l = link as { source?: unknown; target?: unknown; kind?: string }
  if (l.kind === 'trunk') return true
  const idOf = (e: unknown) =>
    e && typeof e === 'object' ? (e as { id?: string }).id : (e as string | undefined)
  return idOf(l.source) === 'core' || idOf(l.target) === 'core'
}

/**
 * Our palette carries alpha as an 8-digit hex suffix (dimmed / in-flight
 * nodes). THREE.Color cannot parse #RRGGBBAA — it would silently misread the
 * colour — so split it and use the alpha as real sprite opacity.
 */
function splitColor(value: string): { hex: string; alpha: number } {
  if (value.length === 9) {
    return { hex: value.slice(0, 7), alpha: parseInt(value.slice(7), 16) / 255 }
  }
  return { hex: value, alpha: 1 }
}

export default function BrainGraph3D({
  nodes,
  links,
  reducedMotion,
  onNodeOpen,
  coreSprite = 'logo',
  labelMode = 'hover',
}: BrainGraph3DProps) {
  const ref = useRef<any>(undefined)
  // Measured before the force effect: the graph mounts only after the first
  // measurement, so the effect needs this value in its dependency list to run
  // a second time and apply its tuning to the live simulation.
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && r.height > 0) {
        setSize({ w: Math.round(r.width), h: Math.round(r.height) })
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const openRef = useRef(onNodeOpen)
  openRef.current = onNodeOpen

  /**
   * 3d-force-graph only builds its layout object inside the update that reacts
   * to `graphData` — `state.layout` stays undefined until then, while
   * `d3ReheatSimulation()` flips `engineRunning` on immediately. Reheating
   * first therefore puts the render loop into `state.layout.tick()` on
   * undefined and the canvas never draws: "Cannot read properties of undefined
   * (reading 'tick')", repeated every frame.
   *
   * A tick is the earliest proof the layout exists. Skipping the reheat until
   * then costs nothing: the first layout already runs at alpha 1, so the force
   * tuning below is picked up on it. Reheating only matters for a graph that
   * has already settled and is being re-tuned.
   */
  const engineStarted = useRef(false)

  // One texture for the whole graph; disposed with the component.
  const glow = useMemo(() => makeGlowTexture(), [])
  useEffect(() => () => glow.dispose(), [glow])

  const logo = useMemo(() => makeLogoTexture(), [])
  useEffect(() => () => logo.dispose(), [logo])

  // Card mode needs a second renderer layered over the WebGL canvas, which
  // draws the DOM cards at each node's projected position. Built once and only
  // when asked for: the dashboard never pays for it.
  const css2d = useMemo(() => {
    if (labelMode !== 'card') return null
    const renderer = new CSS2DRenderer()
    renderer.domElement.style.position = 'absolute'
    renderer.domElement.style.top = '0'
    renderer.domElement.style.left = '0'
    // The layer spans the whole canvas, so without this it would eat every
    // gesture before the WebGL canvas underneath ever saw it.
    renderer.domElement.style.pointerEvents = 'none'
    return renderer
  }, [labelMode])

  const extraRenderers = useMemo(() => (css2d ? [css2d] : []), [css2d])

  const nodeThreeObject = useCallback(
    (raw: object) => {
      const n = raw as BrainGraphNode
      const { hex, alpha } = splitColor(n.color)

      const group = new THREE.Group()

      // Outer halo — additive so overlapping glows pile up into a cloud.
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glow,
          color: new THREE.Color(hex),
          transparent: true,
          opacity: alpha * (n.kind === 'core' ? 0.95 : 0.8),
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      )
      const haloScale = (n.kind === 'core' ? 58 : n.kind === 'session' ? 30 : n.kind === 'document' ? 17 : 10) *
        (1 + Math.min(n.val, 40) / 60)
      halo.scale.set(haloScale, haloScale, 1)
      group.add(halo)

      // The card replaces the label entirely: CSS2DObject anchors DOM at the
      // node's own position, so the card is the node as far as the reader is
      // concerned and the halo behind it becomes its glow.
      //
      // Hung BELOW that anchor by the halo's world radius, which is what keeps
      // the two from fighting: CSS2DObject centres the element on its position,
      // so a card dropped at the origin would cover the very sphere it labels.
      const addCard = (haloRadius: number) => {
        if (labelMode !== 'card') return
        const card = new CSS2DObject(makeCardElement(n, hex))
        card.position.set(0, -(haloRadius * 0.75), 0)
        group.add(card)
      }

      if (n.kind === 'core') {
        if (coreSprite === 'glow') {
          // A mind map's centre is the root topic, not the product — the halo
          // plus its card carry it, with no brand mark in the middle.
          addCard(haloScale)
          return group
        }
        // The brand mark IS the centre. A sprite always billboards, so the logo
        // stays square-on to the camera however the graph is orbited — which is
        // the only way a 2D mark stays readable in a 3D scene.
        const mark = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: logo,
            transparent: true,
            opacity: alpha,
            depthWrite: false,
          }),
        )
        // Same val-based growth as the halo, so core and glow stay in step.
        const markScale = 22 * (1 + Math.min(n.val, 40) / 60)
        mark.scale.set(markScale, markScale, 1)
        // Both sprites sit at the same point; without an explicit order the
        // additive halo can draw last and wash the mark out.
        halo.renderOrder = 0
        mark.renderOrder = 1
        group.add(mark)
        return group
      }

      // Solid centre so a node still has a crisp position inside its glow.
      const r = n.kind === 'session' ? 3.4 : n.kind === 'document' ? 2.1 : 1.3
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(r, 16, 16),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(hex),
          transparent: alpha < 1,
          opacity: alpha,
        }),
      )
      group.add(core)

      // The card carries the text; the sphere behind it is just the anchor
      // point the links converge on.
      addCard(haloScale)

      return group
    },
    [glow, logo, coreSprite, labelMode],
  )

  useEffect(() => {
    const g = ref.current
    if (!g) return
    // Looser charge + a real link distance keeps satellites near their anchor
    // without collapsing the cloud into the centre. Cards occupy far more
    // screen than a dot does, so card mode needs both a harder push apart and
    // longer links — at the dot spacing the cards simply stack on each other.
    const isCards = labelMode === 'card'
    g.d3Force?.('charge')?.strength(isCards ? -420 : -95)
    g.d3Force?.('link')?.distance((l: any) =>
      isCards ? (l.kind === 'doc-concept' ? 75 : 150) : l.kind === 'doc-concept' ? 14 : 34,
    )

    // A collision force and a z-flattening spring were tried here to stop the
    // cards stacking. They are NOT used: `d3-force-3d` only reaches this
    // package as a transitive dependency of 3d-force-graph, so pnpm's strict
    // node_modules makes it unresolvable without adding it to package.json —
    // and the mind-map adapter is moving to a precomputed rank layout that
    // pins every node anyway, which would make both forces dead weight.
    //
    // `size` is in the deps because the graph only mounts once the container
    // is measured: on the first pass `ref.current` is still undefined, this
    // effect bailed out, and nothing else in the list ever changed afterwards
    // — so the tuning above never reached the simulation and d3's defaults
    // (-30 / 30) stayed in force. Reheating makes the new tuning take.
    //
    // Guarded on `engineStarted` — see its declaration. Reheating before the
    // first tick is what blanked the canvas.
    if (engineStarted.current) g.d3ReheatSimulation?.()
  }, [nodes, links, labelMode, size])

  useEffect(() => {
    const g = ref.current
    if (!g) return
    if (reducedMotion) g.pauseAnimation?.()
    else g.resumeAnimation?.()
  }, [reducedMotion])

  // 3d-force-graph always appends its control legend as a `.scene-nav-info`
  // div; `showNavInfo={false}` only sets `display: none` on it, so the text
  // ("Left-click: rotate, …") stays in the DOM and in the hero's textContent
  // for screen readers. Drop the node outright. The graph only mounts once
  // `size` is measured, and the library builds the element in a layout effect
  // (child effects run first), so this effect always sees it.
  useEffect(() => {
    wrapRef.current?.querySelector('.scene-nav-info')?.remove()
  }, [size])

  const isNarrow = typeof window !== 'undefined' && window.innerWidth < 768

  // A pre-placed graph (the mind map) carries its own positions. Everything
  // below is about framing it, because the layout is measured in CSS pixels:
  // the adapter spaces nodes by the real footprint of their cards, so the
  // camera has to map one scene unit to one screen pixel or that spacing —
  // and the readability it buys — is lost to an arbitrary zoom.
  const isPlaced = nodes.length > 0 && nodes.every((n) => Number.isFinite(n.fx) && Number.isFinite(n.fy))

  useEffect(() => {
    const g = ref.current
    if (!g || !size || !isPlaced) return
    const xs = nodes.map((n) => n.x ?? 0)
    const ys = nodes.map((n) => n.y ?? 0)
    const spanX = Math.max(...xs) - Math.min(...xs)
    const spanY = Math.max(...ys) - Math.min(...ys)

    // Camera distance that renders `size.h` scene units across `size.h` px.
    // fov is vertical and is part of the projection matrix, so read it live
    // rather than assuming three.js's default 50.
    const fov = (g.camera?.() as { fov?: number } | undefined)?.fov ?? 50
    const fit = size.h / (2 * Math.tan((fov * Math.PI) / 180 / 2))
    // Wider than the frame? Pull back just enough to keep it all on screen.
    // A narrow (mobile) canvas therefore shows a smaller, complete map rather
    // than a full-size fragment of one.
    const keepInFrame = Math.max(1, spanX / (size.w * 0.92), spanY / (size.h * 0.92))
    const distance = fit * keepInFrame

    // Keep the current viewing DIRECTION, but only if there is one. A camera
    // still sitting at the origin normalizes to the zero vector, and
    // `dir * distance` would then park the camera at (0,0,0) — inside the node
    // cloud, which renders as a blank canvas. Fall back to a head-on view along
    // +Z, which is what the flat (z = 0) mind-map layout is authored for.
    const current = g.camera().position.clone()
    const dir = current.lengthSq() > 1e-6 ? current.normalize() : { x: 0, y: 0, z: 1 }
    g.cameraPosition(
      { x: dir.x * distance, y: dir.y * distance, z: dir.z * distance },
      { x: 0, y: 0, z: 0 },
      600,
    )
  }, [nodes, size, isPlaced])

  return (
    // Absolute-fill: the parent is a centred flex row for the loading/empty
    // branches, and a flex child with height:100% collapses there.
    <div ref={wrapRef} style={{ position: 'absolute', inset: 0 }}>
      {size && (
      <ForceGraph3D
      ref={ref as never}
      graphData={{ nodes, links }}
      backgroundColor="rgba(0,0,0,0)"
      showNavInfo={false}
      nodeThreeObject={nodeThreeObject}
      nodeLabel={(n: object) => (n as BrainGraphNode).label}
      onNodeClick={(n: object) => openRef.current?.(n as BrainGraphNode)}
      // First tick == the layout object exists. Costs nothing and is the only
      // signal the library gives that reheating is safe.
      onEngineTick={() => {
        engineStarted.current = true
      }}
      // Veronica's synapse wiring, ported 1:1 from BrainNebula: trunk links
      // (core↔session) read heavier and curve more; leaf links stay hairline.
      linkColor={() => '#8b93ff'}
      linkOpacity={0.22}
      linkWidth={(l: object) => (isTrunk(l) ? 0.7 : 0.4)}
      linkCurvature={(l: object) => (isTrunk(l) ? 0.28 : 0.12)}
      // "Synapses firing": idle links carry a faint trickle, trunks a steadier
      // stream. Off under reduced motion and on mobile (per-particle cost).
      linkDirectionalParticles={(l: object) =>
        reducedMotion || isNarrow ? 0 : isTrunk(l) ? 2 : 1
      }
      linkDirectionalParticleWidth={1.6}
      linkDirectionalParticleSpeed={0.004}
      linkDirectionalParticleColor={(l: object) => {
        // Particle takes the source node's hue, like veronica's src.__c.
        const src = (l as { source?: unknown }).source
        const hex = src && typeof src === 'object' ? (src as BrainGraphNode).color : undefined
        return hex ? splitColor(hex).hex : '#ffab81'
      }}
      // A pinned graph (the mind map: every node placed by the rank layout)
      // must not be draggable — a card peeled off its slot lands on top of
      // another one, which is the pile the layout exists to prevent. The
      // dashboard's nebula has no placements, so it drags as it always has.
      enableNodeDrag={!reducedMotion && !isPlaced}
      extraRenderers={extraRenderers}
      width={size.w}
      height={size.h}
      // 70px of padding framed the nebula from so far back that the nodes read
      // as dust. 18 fills the card while still clearing the HUD's own overlays
      // (search pill on top, stats strip at the bottom). Card mode needs more
      // room: zoomToFit only knows the node POSITIONS, and each card is a
      // fixed-size box hanging off its position that would otherwise be
      // half-cropped at the edges of the frame.
      // zoomToFit fits the bbox's LARGEST side into the frame on both axes,
      // which undersizes a wide map and would undo the 1:1 camera above, so a
      // placed graph keeps its own framing. The un-placed nebula has no
      // placements to honour and still fits the old way.
      // zoomToFit runs for a placed graph too, as a SAFETY NET rather than as
      // the primary framing.
      //
      // It was switched off for placed graphs above, on the reasoning that it
      // fits the bbox's largest side on both axes and would undo the 1:1
      // camera. That reasoning holds, but turning it off left a placed graph
      // with NO fallback: the 1:1 effect below computes its distance from
      // `camera().position.clone().normalize()`, and if the camera is still at
      // the origin when that runs the normalized direction is the zero vector,
      // so the camera lands exactly where the nodes are and the canvas renders
      // EMPTY — measured on the mind map tab: 22 nodes reported in the header,
      // nothing on screen, plus a page-level runtime issue badge.
      //
      // Framing slightly too small is a cosmetic regression; framing to
      // nothing is a broken feature. So: zoomToFit always runs, and the 1:1
      // effect (which runs after it) is left free to override the framing when
      // it has a sane direction to work from.
      onEngineStop={() => ref.current?.zoomToFit?.(900, labelMode === 'card' ? 90 : 18)}
      />
      )}
    </div>
  )
}
