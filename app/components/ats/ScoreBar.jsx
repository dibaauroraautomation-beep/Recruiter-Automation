import './ScoreBar.css'

export default function ScoreBar({ score = 68 }) {
  return (
    <div className="score">
      <div className="score__row">
        <span className="score__label">ATS Match Score</span>
        <span className="score__value">{score}%</span>
      </div>
      <div className="score__bar">
        <div className="score__bar-fill" style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
