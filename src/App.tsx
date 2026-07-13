import { useState } from 'react'
import MainScreen from './screens/MainScreen'
import GameScreen from './screens/GameScreen'
import ExitScreen from './screens/ExitScreen'
import GameOverScreen from './screens/GameOverScreen'

type Screen = 'main' | 'game' | 'exit' | 'gameover'

function App() {
  const [screen, setScreen] = useState<Screen>('main')

  if (screen === 'game') {
    return <GameScreen onGameOver={() => setScreen('gameover')} />
  }
  if (screen === 'exit') {
    return <ExitScreen onBack={() => setScreen('main')} />
  }
  if (screen === 'gameover') {
    return <GameOverScreen onBack={() => setScreen('main')} />
  }

  return (
    <MainScreen
      onStart={() => setScreen('game')}
      onExit={() => setScreen('exit')}
    />
  )
}

export default App
