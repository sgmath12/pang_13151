import './ClearScreen.css'

type ClearScreenProps = {
  onBack: () => void
}

function ClearScreen({ onBack }: ClearScreenProps) {
  return (
    <div className="clear-screen">
      <h1>MISSION 1 CLEAR!</h1>
      <button type="button" onClick={onBack}>
        메인으로 돌아가기
      </button>
    </div>
  )
}

export default ClearScreen
