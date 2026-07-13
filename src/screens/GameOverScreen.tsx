import './GameOverScreen.css'

type GameOverScreenProps = {
  onBack: () => void
}

function GameOverScreen({ onBack }: GameOverScreenProps) {
  return (
    <div className="game-over-screen">
      <h1>GAME OVER</h1>
      <button type="button" onClick={onBack}>
        메인으로 돌아가기
      </button>
    </div>
  )
}

export default GameOverScreen
