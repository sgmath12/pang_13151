import { useEffect } from 'react'
import './ExitScreen.css'

type ExitScreenProps = {
  onBack: () => void
}

function ExitScreen({ onBack }: ExitScreenProps) {
  useEffect(() => {
    window.close()
  }, [])

  return (
    <div className="exit-screen">
      <h1>PANG</h1>
      <p>게임을 종료합니다. 이 창을 닫아주세요.</p>
      <button type="button" onClick={onBack}>
        메인으로 돌아가기
      </button>
    </div>
  )
}

export default ExitScreen
