import { useEffect, useRef, useState } from 'react'
import './GameScreen.css'

const PLAYER_WIDTH = 40
const MOVE_SPEED = 6

function GameScreen() {
  const [playerX, setPlayerX] = useState(0)
  const fieldRef = useRef<HTMLDivElement>(null)
  const pressedKeys = useRef(new Set<string>())

  useEffect(() => {
    const field = fieldRef.current
    if (field) {
      setPlayerX(field.clientWidth / 2 - PLAYER_WIDTH / 2)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        pressedKeys.current.add(event.key)
      }
    }
    const handleKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.key)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    let frameId: number
    const tick = () => {
      const maxX = (fieldRef.current?.clientWidth ?? 0) - PLAYER_WIDTH
      setPlayerX((current) => {
        let next = current
        if (pressedKeys.current.has('ArrowLeft')) next -= MOVE_SPEED
        if (pressedKeys.current.has('ArrowRight')) next += MOVE_SPEED
        return Math.max(0, Math.min(maxX, next))
      })
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
    </div>
  )
}

export default GameScreen
