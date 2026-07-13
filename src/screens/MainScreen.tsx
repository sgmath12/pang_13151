import { useEffect, useState } from 'react'
import './MainScreen.css'

const MENU_ITEMS = ['시작', '게임 종료']

type MainScreenProps = {
  onStart: () => void
  onExit: () => void
}

function MainScreen({ onStart, onExit }: MainScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const runSelected = (index: number) => {
      if (MENU_ITEMS[index] === '시작') onStart()
      else if (MENU_ITEMS[index] === '게임 종료') onExit()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(
          (current) => (current - 1 + MENU_ITEMS.length) % MENU_ITEMS.length,
        )
      } else if (event.key === 'ArrowDown') {
        setSelectedIndex((current) => (current + 1) % MENU_ITEMS.length)
      } else if (event.key === ' ' || event.key === 'Enter') {
        runSelected(selectedIndex)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, onStart, onExit])

  const handleSelect = (index: number) => {
    setSelectedIndex(index)
    if (MENU_ITEMS[index] === '시작') onStart()
    else if (MENU_ITEMS[index] === '게임 종료') onExit()
  }

  return (
    <div className="main-screen">
      <h1 className="main-screen__title">PANG</h1>

      <ul className="main-screen__menu">
        {MENU_ITEMS.map((item, index) => (
          <li
            key={item}
            className={index === selectedIndex ? 'selected' : ''}
            onClick={() => handleSelect(index)}
          >
            <span className="cursor">{index === selectedIndex ? '▶' : ''}</span>
            {item}
          </li>
        ))}
      </ul>

      <p className="main-screen__hint">↑↓ 이동 · Space/Enter 선택</p>
    </div>
  )
}

export default MainScreen
