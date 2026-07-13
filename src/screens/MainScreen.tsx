import { useEffect, useState } from 'react'
import './MainScreen.css'

const MENU_ITEMS = ['시작', '게임 종료']

function MainScreen() {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(
          (current) => (current - 1 + MENU_ITEMS.length) % MENU_ITEMS.length,
        )
      } else if (event.key === 'ArrowDown') {
        setSelectedIndex((current) => (current + 1) % MENU_ITEMS.length)
      } else if (event.key === ' ' || event.key === 'Enter') {
        console.log(`메뉴 실행: ${MENU_ITEMS[selectedIndex]}`)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex])

  return (
    <div className="main-screen">
      <h1 className="main-screen__title">PANG</h1>

      <ul className="main-screen__menu">
        {MENU_ITEMS.map((item, index) => (
          <li
            key={item}
            className={index === selectedIndex ? 'selected' : ''}
            onClick={() => setSelectedIndex(index)}
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
