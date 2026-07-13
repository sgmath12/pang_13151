import { useState } from 'react'
import MainScreen from './screens/MainScreen'
import GameScreen from './screens/GameScreen'
import ExitScreen from './screens/ExitScreen'

type Screen = 'main' | 'game' | 'exit'

function App() {
  const [screen, setScreen] = useState<Screen>('main')

  if (screen === 'game') return <GameScreen />
  if (screen === 'exit') return <ExitScreen onBack={() => setScreen('main')} />

  return (
    <MainScreen
      onStart={() => setScreen('game')}
      onExit={() => setScreen('exit')}
    />
  )
}

export default App
