import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [page, setPage] = useState('home')

  const [operationIndex, setOperationIndex] = useState(0)
  const operations = ['+', '-', '×', '÷']
  const operation = operations[operationIndex]

  const [courseLevel, setCourseLevel] = useState(1)

  const [progress, setProgress] = useState({
    '+': {level: 1, review: false, recent: []},
    '-': {level: 1, review: false, recent: []},
    '×': {level: 1, review: false, recent: []},
    '÷': {level: 1, review: false, recent: []},
  })

  const [answer, setAnswer] = useState('')
  const [question, setQuestion] = useState( () => generateQuestion(1, '+'))
  const [startTime, setStartTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)

  const isCorrect = answer.trim() !== '' && Number(answer) === question.answer

  const timeLimits = {
    1: 3, 
    2: 6, 
    3: 11, 
    4: 18,
  }

  function nextQuestion(nextOperationIndex, nextProgress) {
    const nextOperation = operations[nextOperationIndex]
    const operationProgress = nextProgress[nextOperation]
    const effctiveLevel = operationProgress.review 
      ? Math.max(1, operationProgress.level - 1) : operationProgress.level

    setQuestion(generateQuestion(effectiveLevel, nextOperation))
    setAnswer('')
    setStartTime(Date.now())
  }

  useEffect(() => {
    if (!isCorrect) return

    const timer = setTimeout(() => {
      const elapsed = (Date.now() - startTime)/1000
      const currentProgress = progress[operation]
      const questionLevel = currentProgress.review
        ? Math.max(1, courseLevel -1)
        : courseLevel

      const fast = elapsed <= timeLimits[questionLevel]
      const updatedProgress = {
        ...progress,
        [operation]: {
          ...currentProgress,
        },
      }

      const current = updatedProgress[operation]
      let advanceOperation = false

      if (current.review) { // during review to see if u answer questions fast enough to go back
        const recent = [...current.recent, fast].slice(-5)
        current.recent = recent
        
        const fastCount = recent.filter(Boolean).length

        if (recent.length === 5 && fastCount >= 4) {
          current.review = false
          current.recent = []
        }
      } else { // regular track to see if u can progress
        const recent = [...current.recent, fast].slice(-5)
        current.recent = recent

        const slowCount = recent.filter((item) => !item).length
        const fastCount = recent.filter(Boolean).length

        if(recent.length === 5 && slowCount >= 3) { //enter review if you were too slow on 4/5 or more
          current.review = true
          current.recent = []
        } else if (recent.length === 5 && fastCount >= 4) { // progress if you were fast enough on > 4/5

          current.recent = []
          advanceOperation = true

          if (operation === '÷') {
            setCourseLevel((previous) => previous + 1)
          }
        }
      }

      const nextCourseLevel = advanceOperation && operation === '÷' ? courseLevel + 1 : courseLevel

      const nextIndex = advanceOperation
        ? (operationIndex + 1) % operations.length : operationIndex

      const nextOperation = operations[nextIndex]
      const nextOperationProgress = updatedProgress[nextOperation]

      const nextLevel = nextOperationProgress.review
        ? Math.max(1, nextCourseLevel -1) : nextCourseLevel
      
      setProgress(updatedProgress)
      setOperationIndex(nextIndex)
      setQuestion(generateQuestion(nextLevel, nextOperation))
      setAnswer('')
      setStartTime(Date.now())
    }, 150)

    return () => clearTimeout(timer)
  } , [isCorrect])


  useEffect(() => {
    setElapsed(0)
    const interval = setInterval(() => {
      setElapsed((Date.now() - startTime) / 1000)
    }, 50)
    return () => clearInterval(interval)
  }, [startTime])

  const displayedLevel = progress[operation].review ? Math.max(1, courseLevel - 1) : courseLevel
  const timeLimit = timeLimits[displayedLevel] ?? 10
  const timePercent = Math.min((elapsed/timeLimit)* 100, 100)

  if (page === 'home') {
    return (
      <main className = "home">
        <h2 className="header-main">isa's mental math trainer</h2>
      
        <section className = "home-main">
          <button className = "button" onClick={() => setPage('training')}>
            <h3>training mode</h3>
            <p>mastery starting from the basics!</p>
          </button>

          <button className = "button" onClick={() => setPage('practice')}>
            <h3>infinite practice mode</h3>
            <p>unlimited questions with adaptive difficulty!</p>
          </button>
        </section>
      </main>

    )
  }

  

  if (page === 'training') {
    return (
      <main>
        <div className="header">
          <button onClick = {() => setPage('home')} className = "back-button"> &lt; back </button>
          <h2>isa's mental math trainer</h2>
        </div>
      </main>
    )
  }

  return (
    <main>
      <div className="header">
        <button onClick = {() => setPage('home')} className = "back-button"> &lt; back </button>
        <h2>isa's mental math trainer</h2>
      </div>
      
      <div className="status-bar">
        <span>
          {operation} level {displayedLevel}
          {progress[operation].review && ' - review'}
        </span>
        <div className = "time">
          <div className="time-fill" style={{ width: `${timePercent}%`}}></div>
        </div>
      </div>

      <div className='practice'>
        <div className="qna-section">
          <section className="question">
            <h1>{question.x} {question.operation} {question.y}</h1>
          </section>
          <form className="answer">
            <h1><input type="text" inputMode="numeric" placeholder="?" aria-label="your answer" value = {answer} 
            onChange = {(event) => setAnswer(event.target.value)}
            className = {isCorrect ? 'correct' : ''}
            /></h1>
          </form>
        </div>
      </div>
    </main>

  )
}


function generateQuestion(level, operation) {
  let x
  let y

  let answer

  if (operation === '×') {
    if (level === 1) {
      x = randomInt(1,9)
      y = randomInt(1,9)
    } else if (level === 2) {
      x = randomInt(2, 20)
      y = [5,10,11,12,25][randomInt(0,4)]
    } else if (level===3) {
      x = randomInt(10,99)
      y = [5,10,11,12,25][randomInt(0,4)]
    } else {
      x = randomInt(10, 99)
      y = randomInt(10, 99)
    }
  } 
  if (operation === '÷') {
    if (level === 1) {
      y = randomInt(1,9)
      answer = randomInt(1,9)
    } else if (level ===2) {
      y = [2,3,4,5,10][randomInt(0,4)]
      answer = randomInt(2,12)
    } else if (level ===3){
      y = randomInt(2,12)
      answer = randomInt(10,25)
    } else {
      y = randomInt(10,25)
      answer = randomInt(10,50)
    }

    x = y * answer
    return {x, y, operation, answer}


  } else {

    if(level === 1) {
      x = randomInt(1,9)
      y = randomInt(1,9)
    } else if (level === 2) {  
      x = randomInt(10, 99)
      y = randomInt(1,9)
    } else if (level === 3) {
      x = randomInt(10, 99)
      y = randomInt(10, 99)
    } else {
      x = randomInt(10, 99)
      y = randomInt(100, 999)
    }
  
  }

  if (Math.random() > 0.5) {
    [x,y] = [y,x]
  }

  if (operation === '+') {
    answer = x + y
  } else if (operation === '-') {
    if (y>x) [x,y] = [y,x]
    answer = x - y
  } else if (operation === '×') {
    answer = x * y
  }

  return {x, y, operation, answer}
  
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max-min+1)) + min
}

export default App
