import { useEffect, useRef, useState } from 'react'
import './GameScreen.css'

const PLAYER_WIDTH = 40
const MOVE_SPEED = 6
const HARPOON_WIDTH = 4
const HARPOON_SPEED = 10
const GRAVITY = 0.5
const BALLOON_DIAMETER = 80
const SCROLL_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  ' ',
])

type Harpoon = { id: number; x: number; y: number }
type Balloon = { id: number; x: number; y: number; vx: number; vy: number }

function GameScreen() {
  const [playerX, setPlayerX] = useState(0)
  const [harpoons, setHarpoons] = useState<Harpoon[]>([])
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const fieldRef = useRef<HTMLDivElement>(null)
  const pressedKeys = useRef(new Set<string>())
  const playerXRef = useRef(playerX)
  const nextHarpoonId = useRef(0)

  useEffect(() => {
    playerXRef.current = playerX
  }, [playerX])

  useEffect(() => {
    const field = fieldRef.current
    if (field) {
      setPlayerX(field.clientWidth / 2 - PLAYER_WIDTH / 2)
      setBalloons([
        { id: 0, x: field.clientWidth * 0.3, y: 40, vx: 2.5, vy: 0 },
        { id: 1, x: field.clientWidth * 0.6, y: 100, vx: -2, vy: 0 },
      ])
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (SCROLL_KEYS.has(event.key)) {
        event.preventDefault()
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        pressedKeys.current.add(event.key)
      } else if (event.key === ' ') {
        const id = nextHarpoonId.current++
        setHarpoons((current) => [
          ...current,
          {
            id,
            x: playerXRef.current + PLAYER_WIDTH / 2 - HARPOON_WIDTH / 2,
            y: 24 + PLAYER_WIDTH,
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

      setPlayerX((current) => {
        let next = current
        if (pressedKeys.current.has('ArrowLeft')) next -= MOVE_SPEED
        if (pressedKeys.current.has('ArrowRight')) next += MOVE_SPEED
        const maxX = fieldWidth - PLAYER_WIDTH
        return Math.max(0, Math.min(maxX, next))
      })

      setHarpoons((current) =>
        current
          .map((harpoon) => ({ ...harpoon, y: harpoon.y + HARPOON_SPEED }))
          .filter((harpoon) => harpoon.y <= fieldHeight),
      )

      setBalloons((current) =>
        current.map((balloon) => {
          let { x, y, vx, vy } = balloon
          vy += GRAVITY
          x += vx
          y += vy

          if (y < 0) {
            y = 0
            vy = Math.abs(vy)
          } else if (y + BALLOON_DIAMETER > fieldHeight) {
            y = fieldHeight - BALLOON_DIAMETER
            vy = -Math.abs(vy)
          }

          if (x < 0) {
            x = 0
            vx = Math.abs(vx)
          } else if (x + BALLOON_DIAMETER > fieldWidth) {
            x = fieldWidth - BALLOON_DIAMETER
            vx = -Math.abs(vx)
          }

          return { ...balloon, x, y, vx, vy }
        }),
      )

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
      <div className="game-screen__player" style={{ left: playerX }} />
      {harpoons.map((harpoon) => (
        <div
          key={harpoon.id}
          className="game-screen__harpoon"
          style={{ left: harpoon.x, bottom: harpoon.y }}
        />
      ))}
      {balloons.map((balloon) => (
        <div
          key={balloon.id}
          className="game-screen__balloon"
          style={{ left: balloon.x, top: balloon.y }}
        />
      ))}
    </div>
  )
}

export default GameScreen
