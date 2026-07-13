import { useEffect, useRef, useState } from 'react'
import './GameScreen.css'

const PLAYER_WIDTH = 60
const MOVE_SPEED = 6
const HARPOON_WIDTH = 10
const HARPOON_HEIGHT = 34
const HARPOON_SPEED = 10
const GRAVITY = 0.5
const BALLOON_SIZES = [80, 56, 36, 20]
const BALLOON_BASE_SPEED = 2
const STARTING_LIVES = 3
const SCROLL_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  ' ',
])

type Harpoon = { id: number; x: number; top: number }
type Balloon = {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  sizeIndex: number
}

type GameScreenProps = {
  onGameOver: () => void
  onClear: () => void
}

// Balloons render as circles, while the player/harpoon are rects — an AABB
// check between their bounding boxes flags false hits at the box corners
// where the round balloon sprite isn't actually touching. Treat the balloon
// as a circle and test distance to the closest point on the other rect instead.
function circleOverlapsRect(
  cx: number,
  cy: number,
  radius: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number,
) {
  const closestX = Math.max(rx, Math.min(cx, rx + rw))
  const closestY = Math.max(ry, Math.min(cy, ry + rh))
  const dx = cx - closestX
  const dy = cy - closestY
  return dx * dx + dy * dy < radius * radius
}

function createInitialBalloons(fieldWidth: number, nextId: () => number): Balloon[] {
  return [
    {
      id: nextId(),
      x: fieldWidth * 0.3,
      y: 40,
      vx: BALLOON_BASE_SPEED,
      vy: 0,
      sizeIndex: 0,
    },
    {
      id: nextId(),
      x: fieldWidth * 0.6,
      y: 100,
      vx: -BALLOON_BASE_SPEED,
      vy: 0,
      sizeIndex: 0,
    },
  ]
}

function GameScreen({ onGameOver, onClear }: GameScreenProps) {
  const [playerX, setPlayerX] = useState(0)
  const [harpoons, setHarpoons] = useState<Harpoon[]>([])
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [lives, setLives] = useState(STARTING_LIVES)
  const fieldRef = useRef<HTMLDivElement>(null)
  const pressedKeys = useRef(new Set<string>())
  // These refs are the single source of truth read by the physics loop.
  // They're written directly at every point where the corresponding state
  // is set (instead of only via a `useEffect([state])` sync), because the
  // loop's requestAnimationFrame callback can fire before such a sync
  // effect runs and would otherwise act on stale data (e.g. overwriting
  // freshly-spawned balloons with an empty array on the very first frame).
  const playerXRef = useRef(0)
  const harpoonsRef = useRef<Harpoon[]>([])
  const balloonsRef = useRef<Balloon[]>([])
  const livesRef = useRef(STARTING_LIVES)
  const onGameOverRef = useRef(onGameOver)
  const onClearRef = useRef(onClear)
  const nextHarpoonId = useRef(0)
  const nextBalloonId = useRef(0)

  useEffect(() => {
    onGameOverRef.current = onGameOver
  }, [onGameOver])
  useEffect(() => {
    onClearRef.current = onClear
  }, [onClear])

  useEffect(() => {
    const field = fieldRef.current
    if (field) {
      const initialPlayerX = field.clientWidth / 2 - PLAYER_WIDTH / 2
      const initialBalloons = createInitialBalloons(
        field.clientWidth,
        () => nextBalloonId.current++,
      )
      playerXRef.current = initialPlayerX
      balloonsRef.current = initialBalloons
      setPlayerX(initialPlayerX)
      setBalloons(initialBalloons)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) {
        event.preventDefault()
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        pressedKeys.current.add(event.key)
      } else if (event.key === ' ') {
        const fieldHeight = fieldRef.current?.clientHeight ?? 0
        const id = nextHarpoonId.current++
        const newHarpoon: Harpoon = {
          id,
          x: playerXRef.current + PLAYER_WIDTH / 2 - HARPOON_WIDTH / 2,
          top: fieldHeight - 24 - PLAYER_WIDTH,
        }
        harpoonsRef.current = [...harpoonsRef.current, newHarpoon]
        setHarpoons(harpoonsRef.current)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let frameId: number
    const tick = () => {
      const fieldWidth = fieldRef.current?.clientWidth ?? 0
      const fieldHeight = fieldRef.current?.clientHeight ?? 0

      let updatedPlayerX = playerXRef.current
      if (pressedKeys.current.has('ArrowLeft')) updatedPlayerX -= MOVE_SPEED
      if (pressedKeys.current.has('ArrowRight')) updatedPlayerX += MOVE_SPEED
      const maxX = fieldWidth - PLAYER_WIDTH
      updatedPlayerX = Math.max(0, Math.min(maxX, updatedPlayerX))
      playerXRef.current = updatedPlayerX
      setPlayerX(updatedPlayerX)

      const movedHarpoons = harpoonsRef.current
        .map((harpoon) => ({ ...harpoon, top: harpoon.top - HARPOON_SPEED }))
        .filter((harpoon) => harpoon.top + HARPOON_HEIGHT > 0)

      const movedBalloons = balloonsRef.current.map((balloon) => {
        let { x, y, vx, vy } = balloon
        const diameter = BALLOON_SIZES[balloon.sizeIndex]
        vy += GRAVITY
        x += vx
        y += vy

        if (y < 0) {
          y = 0
          vy = Math.abs(vy)
        } else if (y + diameter > fieldHeight) {
          y = fieldHeight - diameter
          vy = -Math.abs(vy)
        }

        if (x < 0) {
          x = 0
          vx = Math.abs(vx)
        } else if (x + diameter > fieldWidth) {
          x = fieldWidth - diameter
          vx = -Math.abs(vx)
        }

        return { ...balloon, x, y, vx, vy }
      })

      const hitHarpoonIds = new Set<number>()
      const survivingBalloons: Balloon[] = []

      for (const balloon of movedBalloons) {
        const diameter = BALLOON_SIZES[balloon.sizeIndex]
        const radius = diameter / 2
        const cx = balloon.x + radius
        const cy = balloon.y + radius
        const hitHarpoon = movedHarpoons.find(
          (harpoon) =>
            !hitHarpoonIds.has(harpoon.id) &&
            circleOverlapsRect(
              cx,
              cy,
              radius,
              harpoon.x,
              harpoon.top,
              HARPOON_WIDTH,
              HARPOON_HEIGHT,
            ),
        )

        if (!hitHarpoon) {
          survivingBalloons.push(balloon)
          continue
        }

        hitHarpoonIds.add(hitHarpoon.id)

        const childSizeIndex = balloon.sizeIndex + 1
        if (childSizeIndex >= BALLOON_SIZES.length) continue

        const childSpeed = BALLOON_BASE_SPEED * (1 + childSizeIndex * 0.7)
        survivingBalloons.push(
          {
            id: nextBalloonId.current++,
            x: balloon.x,
            y: balloon.y,
            vx: -childSpeed,
            vy: -8,
            sizeIndex: childSizeIndex,
          },
          {
            id: nextBalloonId.current++,
            x: balloon.x,
            y: balloon.y,
            vx: childSpeed,
            vy: -8,
            sizeIndex: childSizeIndex,
          },
        )
      }

      const playerTop = fieldHeight - 24 - PLAYER_WIDTH
      const touchedPlayer = survivingBalloons.some((balloon) => {
        const diameter = BALLOON_SIZES[balloon.sizeIndex]
        const radius = diameter / 2
        return circleOverlapsRect(
          balloon.x + radius,
          balloon.y + radius,
          radius,
          updatedPlayerX,
          playerTop,
          PLAYER_WIDTH,
          PLAYER_WIDTH,
        )
      })

      if (touchedPlayer) {
        const remainingLives = livesRef.current - 1
        livesRef.current = remainingLives
        setLives(remainingLives)
        harpoonsRef.current = []
        setHarpoons([])

        if (remainingLives <= 0) {
          balloonsRef.current = []
          setBalloons([])
          onGameOverRef.current()
        } else {
          const resetBalloons = createInitialBalloons(
            fieldWidth,
            () => nextBalloonId.current++,
          )
          balloonsRef.current = resetBalloons
          setBalloons(resetBalloons)
        }
      } else {
        const remainingHarpoons = movedHarpoons.filter(
          (harpoon) => !hitHarpoonIds.has(harpoon.id),
        )
        harpoonsRef.current = remainingHarpoons
        balloonsRef.current = survivingBalloons
        setHarpoons(remainingHarpoons)
        setBalloons(survivingBalloons)

        if (survivingBalloons.length === 0 && movedBalloons.length > 0) {
          onClearRef.current()
        }
      }

      frameId = requestAnimationFrame(tick)
    }
    frameId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      cancelAnimationFrame(frameId)
    }
  }, [])

  return (
    <div className="game-screen" ref={fieldRef}>
      <p className="game-screen__lives">LIVES: {'♥'.repeat(Math.max(lives, 0))}</p>
      <div className="game-screen__player" style={{ left: playerX }}>
        <div className="game-screen__player-cape" />
        <div className="game-screen__player-head" />
        <div className="game-screen__player-body" />
      </div>
      {harpoons.map((harpoon) => (
        <div
          key={harpoon.id}
          className="game-screen__harpoon"
          style={{ left: harpoon.x, top: harpoon.top }}
        />
      ))}
      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          className="game-screen__balloon"
          style={{
            left: balloon.x,
            top: balloon.y,
            width: BALLOON_SIZES[balloon.sizeIndex],
            height: BALLOON_SIZES[balloon.sizeIndex],
          }}
        />
      ))}
    </div>
  )
}

export default GameScreen
