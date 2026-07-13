import { useEffect, useRef, useState } from 'react'
import './GameScreen.css'

const PLAYER_WIDTH = 40
const MOVE_SPEED = 6
const HARPOON_WIDTH = 4
const HARPOON_HEIGHT = 30
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
  const playerXRef = useRef(playerX)
  const harpoonsRef = useRef<Harpoon[]>([])
  const balloonsRef = useRef<Balloon[]>([])
  const livesRef = useRef(STARTING_LIVES)
  const onGameOverRef = useRef(onGameOver)
  const onClearRef = useRef(onClear)
  const nextHarpoonId = useRef(0)
  const nextBalloonId = useRef(0)

  useEffect(() => {
    playerXRef.current = playerX
  }, [playerX])
  useEffect(() => {
    harpoonsRef.current = harpoons
  }, [harpoons])
  useEffect(() => {
    balloonsRef.current = balloons
  }, [balloons])
  useEffect(() => {
    livesRef.current = lives
  }, [lives])
  useEffect(() => {
    onGameOverRef.current = onGameOver
  }, [onGameOver])
  useEffect(() => {
    onClearRef.current = onClear
  }, [onClear])

  useEffect(() => {
    const field = fieldRef.current
    if (field) {
      setPlayerX(field.clientWidth / 2 - PLAYER_WIDTH / 2)
      setBalloons(
        createInitialBalloons(field.clientWidth, () => nextBalloonId.current++),
      )
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
        setHarpoons((current) => [
          ...current,
          {
            id,
            x: playerXRef.current + PLAYER_WIDTH / 2 - HARPOON_WIDTH / 2,
            top: fieldHeight - 24 - PLAYER_WIDTH,
          },
        ])
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
      setPlayerX((current) => {
        let next = current
        if (pressedKeys.current.has('ArrowLeft')) next -= MOVE_SPEED
        if (pressedKeys.current.has('ArrowRight')) next += MOVE_SPEED
        const maxX = fieldWidth - PLAYER_WIDTH
        updatedPlayerX = Math.max(0, Math.min(maxX, next))
        return updatedPlayerX
      })

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
        setLives(remainingLives)
        setHarpoons([])
        if (remainingLives <= 0) {
          setBalloons([])
          onGameOverRef.current()
        } else {
          setBalloons(
            createInitialBalloons(fieldWidth, () => nextBalloonId.current++),
          )
        }
      } else {
        setHarpoons(
          movedHarpoons.filter((harpoon) => !hitHarpoonIds.has(harpoon.id)),
        )
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
      <div className="game-screen__player" style={{ left: playerX }} />
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
