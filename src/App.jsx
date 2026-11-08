import { useState, useEffect, useRef } from 'react'
import './App.css'

function App() {

  // setup stuff

  const [page, setPage] = useState('home')
  const [darkmode, setdarkmode] = useState(() => {
    return localStorage.getItem('darkmode') === 'true'})

  useEffect(() => {
    localStorage.setItem('darkmode', darkmode)
  }, [darkmode])
  
  const [soundOn, setSoundOn] = useState(() => {
    return localStorage.getItem('soundOn') !== 'false'
  }, [darkmode])

  useEffect(() => {
    localStorage.setItem('soundOn', soundOn)
  }, [soundOn])

  //const hoverSound = useRef(null)
  const clickSound = useRef(null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark-page', darkmode)
  }, [darkmode])

  useEffect(() => {
    //hoverSound.current = new Audio('/sounds/hover.mp3')
    clickSound.current = new Audio('/sounds/hover.mp3')
  }, [])

  function playSound(sound) {
  if (!soundOn || !sound.current) return
  sound.current.currentTime= 0 
  sound.current.play().catch(error => {console.log('sound failed', error)})
  }

  function handleHover(event) {  
    const button = event.target.closest('button')
    if (!button || button.disabled) return
    if (button.contains(event.relatedTarget)) return
    //playSound(hoverSound)
  }

  function handleClick(event) {
    const button = event.target.closest('button')
    if (!button || button.disabled) return
    playSound(clickSound)
  }

  //math stuff
  const operations = ['+', '-', '×', '÷']
  const timeLimits = { 1: 2, 2: 5, 3: 9, 4: 15, 5: 23, 6: 30 }

  //training mode
  const [trainingScreen, setTrainingScreen] = useState('lvls')
  const [trainingOperation, setTrainingOperation] = useState('+')
  const [trainingLevel, setTrainingLevel] = useState(1)

  const [trainingProgress, setTrainingProgress] = useState(() => {
    const savedProgress = localStorage.getItem('mmtrainingProgress')
    if (savedProgress) {
      try {
        return JSON.parse(savedProgress)
      } catch {
        console.error('could not load saved progress')
      }
    }
    return {
      '+': { unlockedLevel: 1, completedLevels: [], records: {}},
      '-': { unlockedLevel: 1, completedLevels: [], records: {}},
      '×': { unlockedLevel: 1, completedLevels: [], records: {}},
      '÷': { unlockedLevel: 1, completedLevels: [], records: {}},
    }
  })

  //saving progress
  useEffect(() => {
    localStorage.setItem('mmtrainingProgress', JSON.stringify(trainingProgress))
  }, [trainingProgress])

  //current round info

  const [trainingQ, setTrainingQ] = useState(() => generateQuestion(1, '+'))
  const [trainingA, setTrainingA]= useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [startTime_training, setStartTime_training] = useState(null)
  const [elapsed_training, setElapsed_training] = useState(0)
  const [trainingResult, setTrainingResult] = useState(null)
  const trainingTargetTime = timeLimits[trainingLevel] * 10

  const isCorrect_training = trainingA.trim() !== '' && Number(trainingA) === trainingQ.answer

  function formatTrainingTime(seconds) {
    if (seconds === null || seconds === undefined) return '--'
    return `${seconds.toFixed(2)}s`
  }


  //practice mode, -- > infinite levels and increases from lvl 1 to 4 for each operations
  const [operationIndex, setOperationIndex] = useState(0)
  const operation = operations[operationIndex]
  const [level, setLevel] = useState(1)

  const [progress, setProgress] = useState({
    '+': {level: 1, review: false, recent: []},
    '-': {level: 1, review: false, recent: []},
    '×': {level: 1, review: false, recent: []},
    '÷': {level: 1, review: false, recent: []},
  })
  const [answer, setAnswer] = useState('')
  const [question, setQuestion] = useState(() => generateQuestion(1, '+'))
  const [startTime, setStartTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)

  const isCorrect = answer.trim() !== '' && Number(answer) === question.answer
  const displayedLevel = progress[operation].review ? Math.max(1, level-1) : level
  const timeLimit = timeLimits[displayedLevel] ?? 18
  const timePercent = Math.min((elapsed/timeLimit) * 100, 100)

  // between mode resets

  useEffect(() => {
    if (page === 'practice') {
      setStartTime(Date.now())
      setAnswer('')
    }
  }, [page])

  //timer for training
  useEffect(() => {
    if (page !== 'training' || trainingScreen !== 'round' || startTime_training === null) return
    const interval = setInterval(() => {
      setElapsed_training(
        (Date.now() - startTime_training) / 1000
      )
    }, 50)
    return () => clearInterval(interval)
  }, [page, trainingScreen, startTime_training])
  
  //starting a round 

  function startTrainingRound(operation, level) {
    setTrainingOperation(operation)
    setTrainingLevel(level)
    setTrainingQ(generateQuestion(level, operation))
    setTrainingA('')
    setQuestionCount(0)
    setCorrectCount(0)
    setStartTime_training(Date.now())
    setElapsed_training(0)
    setTrainingResult(null)
    setTrainingScreen('round')
  }

  //timer for infinite
   useEffect(() => {
    if (page !== 'practice') return
    setElapsed(0)
    const interval = setInterval(() => {
      setElapsed(
        (Date.now() - startTime) / 1000
      )
    }, 50)
    return () => clearInterval(interval)
  }, [page, startTime])


  //training progression

  useEffect(() => {
    if (page !== 'training' || trainingScreen !== 'round' || !isCorrect_training) return
    
    const timer = setTimeout(() => {
      const nextQuestionCount = questionCount + 1
      const totalTime = (Date.now() - startTime_training) / 1000

      setQuestionCount(nextQuestionCount)
      setTrainingA('')
      
      if (nextQuestionCount === 10) {
        const passed = totalTime <= trainingTargetTime
        const result = {
          operation: trainingOperation,
          level: trainingLevel,
          correct: nextQuestionCount,
          totalTime,
          targetTime: trainingTargetTime,
          passed,
        }
        setTrainingResult(result)
        setTrainingScreen('results')

        setTrainingProgress(previous => {
          const current = previous[trainingOperation]
          const oldRecord = current.records[trainingLevel] || {}
          let bestTime = oldRecord.bestTime ?? null
          if (passed) {
            bestTime = bestTime === null ? totalTime : Math.min(bestTime, totalTime)
          }

          return {
            ...previous, [trainingOperation]: {
              ...current,
              records: {
                ...current.records,
                [trainingLevel]: {
                  bestTime,
                  latestTime: totalTime,
                  latestScore: nextQuestionCount,
                  latestPassed: passed,
                },
              },
              completedLevels: passed ? [...new Set([
                ...current.completedLevels,
                trainingLevel,
              ])]
              : current.completedLevels,
              unlockedLevel: passed ? Math.max(current.unlockedLevel, Math.min(6, trainingLevel + 1)) : current.unlockedLevel,
            },
          }
        })
        return
      }
      setTrainingQ(generateQuestion(trainingLevel, trainingOperation))
    }, 150)

    return () => clearTimeout(timer)
  }, [
    page,
    trainingScreen,
    isCorrect_training,
    questionCount,
    startTime_training,
    trainingTargetTime,
    trainingOperation,
    trainingLevel
  ])

  // infinite progression

  useEffect(() => {
    if (page !== 'practice' || !isCorrect) return
    const timer = setTimeout(() => {
      const elapsedTime = (Date.now() - startTime) / 1000
      const fast = elapsedTime <= timeLimit
      const updatedProgress = {
        ...progress,
        [operation]: {
          ...progress[operation],
        },
      }
      const current = updatedProgress[operation]
      const recent = [...current.recent, fast].slice(-5)
      current.recent = recent

      let advanceOperation = false

      if (current.review) {
        const fastCount = recent.filter(Boolean).length
        if (recent.length === 5 && fastCount >= 4) {
          current.review = false
          current.recent = []
        }
      } else {
        const fastCount = recent.filter(Boolean).length
        const slowCount = recent.filter(result => !result).length
        if (recent.length === 5 && slowCount >= 3) {
          current.review = true
          current.recent = []
        
        } else if (recent.length === 5 && fastCount >= 4) {
          current.recent = []
          advanceOperation = true;
        }
      }

      let nextLevel = level
      let nextIndex = operationIndex
      if (advanceOperation) {
        nextIndex = (operationIndex + 1) % operations.length
        if (operation === '÷') {nextLevel += 1}
      }

      const nextOperation = operations[nextIndex]
      const nextOperationProgress = updatedProgress[nextOperation]
      const nextQuestionLevel = nextOperationProgress.review
        ? Math.max(1, nextLevel - 1)
        : nextLevel

      setProgress(updatedProgress)
      setLevel(nextLevel)
      setOperationIndex(nextIndex)
      setQuestion(generateQuestion(nextQuestionLevel, nextOperation))
      setAnswer('')
      setStartTime(Date.now())
    }, 150)

    return () => clearTimeout(timer)
  }, [
    page,
    isCorrect,
    startTime,
    timeLimit,
    progress,
    operation,
    level,
    operationIndex
  ])

  //main page
  return (
    <div className={darkmode ? 'app dark' : 'app'} onMouseOver={handleHover} onClick={handleClick}>
      {page === 'home' && (
        <main className = "home">
        <h2 className="header-main">isa's mental math trainer</h2>
        <div class="controls">
          <button className='darkmodetoggle' onClick={() => setdarkmode(!darkmode)}>
          {darkmode ? 'light' : 'dark'}
          </button>
          <button className="sound-toggle" onClick={() => setSoundOn(!soundOn)}>{soundOn ? 'sound off' : 'sound on'}</button>
        </div>
        
        <section className = "home-main">
          <button className = "button" onClick={() => setPage('training')}>
            <h3>training</h3>
            <p>mastery starting from the basics!</p>
          </button>

          <button className = "button" onClick={() => setPage('practice')}>
            <h3>infinite practice</h3>
            <p>unlimited questions with adaptive difficulty!</p>
          </button>

          <button className = "button" onClick={() => setPage('tipstricks')}>
            <h3>tips + tricks</h3>
            <p>learn strategies to get faster (˶ˆᗜˆ˵)</p>
          </button>

          <button className = "button" onClick={() => setPage('info')}>
            <h3>info</h3>
            <p>about this site ₊˚⊹♡</p>
          </button>
        </section>
      </main> 
      )}

      {page === 'training' && (
        <main className="training">
          <div className="header">
            <button onClick = {() => {
              if (trainingScreen !== 'lvls') {
                setTrainingScreen('lvls')
                setTrainingA('')
                setQuestionCount(0)
                setCorrectCount(0)
                setElapsed_training(0)
                setStartTime_training(null)
                setTrainingResult(null)
              } else {
                setPage("home") 
              }
            }} className="back-button"><p>back</p></button>
            <h2>isa's mental math trainer</h2>
          </div>

          {/* level selections */}
          {trainingScreen === 'lvls' && (
            <section className="training-menu">
              <div className="training-menu-heading">
                <h3>training menu</h3>
                <p>choose an operation + level. work your way up!</p>
              </div>
              
              <div className="training-operations">
              {operations.map(op => {
                const opProgress = trainingProgress[op]
                const operationName = {
                  '+': 'addition',
                  '-': 'subtraction',
                  '×': 'multiplication',
                  '÷': 'division',
                }[op]
                return (
                  <div className="training-operation" key={op}>
                    <h3>{operationName}</h3>
                    <div className="training-levels">
                      {Array.from({length: 6}, (_, index) => index + 1).map(lvl => {
                        const unlocked = lvl <= opProgress.unlockedLevel
                        const completed = opProgress.completedLevels.includes(lvl)
                        const record = opProgress.records[lvl]
                        
                        return (
                          <button
                            key={lvl}
                            className={`training-level ${!unlocked ? 'locked' : ''}`}
                            disabled={!unlocked}
                            onClick={() => startTrainingRound(op, lvl)}
                          >
                            <div className = "level-header">
                              <p className="level-title">level {lvl}</p>
                              <img src = {completed ? (darkmode ? "/src/assets/check-dark.png" : "/src/assets/check.png") 
                                          : !unlocked 
                                            ? (darkmode ? "/src/assets/lock-dark.png" : "/src/assets/lock.png") 
                                          : lvl === opProgress.unlockedLevel 
                                              ? (darkmode ? "/src/assets/current-dark.png": "/src/assets/current.png") : null} className="level-icon" alt=""/>
                            </div>
                            <span className="level-record">
                              best: {formatTrainingTime(record?.bestTime)}
                            </span>

                            <span className="level-record">
                              latest: {formatTrainingTime(record?.latestTime)}
                            </span>
                          </button>
                        )
                  })}
                </div>
                
                </div>
                
                )
              })}
              </div>
              <p className="training-menu-footer">more coming soon!</p>
          </section>
          )}

          {/* round */}
          {trainingScreen === 'round' && (
            <section className = "training-round">
              <div className = "traininground-header">
                <span>{trainingOperation} level {trainingLevel}</span>
                <span>
                  target: {trainingTargetTime}s
                </span>
              </div>
              
              <div className="training-progress">
                <div className="training-progress-bar">
                  <div className="training-progress-fill" style={{ width: `${questionCount*10}%`}}></div>
                </div>
              </div>

              <div className="training-timer">
                <span>{formatTrainingTime(elapsed_training)}</span>

              </div>
              <div className="practice-training">
                <div className="qna-section">
                <section className="question">
                  <h1>{trainingQ.x} {trainingQ.operation} {trainingQ.y}</h1>
                </section>
                <form className="answer">
                  <h1><input type="text" inputMode="numeric" placeholder="?" aria-label="your answer" value = {trainingA} 
                  onChange = {(event) => setTrainingA(event.target.value)}
                  className = {isCorrect_training ? 'correct' : ''}
                  autoFocus
                  /></h1>
              </form>
            </div>


              </div>
              
            </section>
          )}

          {trainingScreen === 'results' && trainingResult && (
            <section className="training-results">
              <h3>{trainingResult.passed ? 'level passed ♡⸜(˶˃ ᵕ ˂˶)⸝♡' : 'not quite (｡•́︿•̀｡)'}</h3>

              <p>{trainingResult.operation} level {trainingResult.level}</p>

              <div className="training-result-stats">
                <p>your time : {formatTrainingTime(trainingResult.totalTime)}</p>
                <p>target time : {trainingResult.targetTime}s</p>
              </div>
              {trainingResult.passed ? (
                <p>{trainingResult.level < 6 ? `you just unlocked level ${trainingResult.level + 1} !` : 'you completed all levels for this operation!! (more will come in later updates ˙ᵕ˙)'}</p>
              ) : (
                <p>you missed the target time •︵• try again!</p>
              )}

              <button className='button' onClick={() => 
                startTrainingRound(trainingResult.operation, trainingResult.level)
              }><h4>retry</h4></button>
              <button className="button" onClick={() => setTrainingScreen('lvls')}><h4>back</h4></button>
              <button className="button" onClick={() => startTrainingRound(trainingResult.operation, trainingResult.level + 1)}><h4>next</h4></button>
            </section>
          )}



        </main>

      )}

      {page === 'practice' && (
        <main>
          <div className="header">
            <button onClick = {() => setPage('home')} className = "back-button"><p>back</p></button>
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
                autoFocus
                /></h1>
              </form>
            </div>
          </div>
        </main>
      )}

      {page === 'tipstricks' && (
        <main>
          <div className="header">
            <button onClick = {() => setPage('home')} className = "back-button"><p>back</p></button>
            <h2>isa's mental math trainer</h2>
          </div>

          <section className="tips-tricks">
            <h3>tips + tricks</h3>

          <div className= "tipstricks-content">
            <div className = 'tip-category'>
              <h3>addition</h3>
              <div className = "tip">
                <h4>adding numbers left to right </h4>
                <p> 
                  add the second number to the first, starting from the highest units and working left to right  <br />
                </p>
                <p className="example-eq">47 + 36 <br />⤷ 47 + 30 = 77 <br />⤷ 77 + 6 = 83</p>
                <p className="example-eq">259 + 586 <br />⤷ 259 + 500 = 759 <br />⤷ 759 + 80 = 839 
                    <br />⤷ 839 + 6 = 845 </p>

                <p> 
                  this technique can be extended to any number of digits! <br />
                </p>
              </div>

              <div className = "tip">
                <h4>addition using subtraction </h4>
                <p>
                  if the second number is close to a multiple of 10, you can add that multiple and then subtract the difference <br />
                </p>
                <p className="example-eq">47 + 36 <br />⤷ 50 + 36 = 86 <br />⤷ 86 - 3 = 83</p>
                <p className="example-eq">643 + 287 <br />⤷ 643 + 300 = 943 <br />⤷ 943 - 13 = 930</p>
                <p> 
                  this technique can also be extended to any number of digits! <br />
                </p>
              </div>

            </div>

            <div className = 'tip-category'>
              <h3>multiplication</h3>
              <div className = "tip">
                <h4>multiplying two 2-digit numbers in your head</h4>
                <p> 
                  this trick is useful when the two numbers you multiply are large or aren't close to any convenient multiples. this comes in three parts: the left most digit, the middle, and the right most. 
                  it's easiest to use worked examples to show this, so lets go!
                </p>
                <p className="example-eq">21 * 32 <br />⤷ left most: 2 * 3 = 6 <br />⤷ middle: multiply the outer and inner -most numbers and add them
                <br /> .. = 2 * 2 + 1 * 3 = 7 <br /> ⤷ right most: 1 * 2 = 2 <br /> together: 672</p>
                <p>but what about bigger numbers where there are carries? similarly: </p>
                <p className="example-eq">76 * 53 <br />⤷ left: 7 * 5 = 35 <br />⤷ middle: 7 * 3 + 6 * 5 = 21 + 30 = 51 
                <br />⤷ since the middle can only be 1 digit, carry over the 5 to the left <br /> .. left: 35 + 5 = 40 <br /> .. middle: 1 
                <br /> ⤷ right most: 6 * 3 = 18 <br /> ⤷ since the right can only be 1 digit as well, carry over the 1 to the middle 
                <br /> .. middle: 1 + 1 = 2 <br /> .. right: 8 <br /> together: 4028
                
                </p>
                <br/>
                <p>more tips/tricks coming later ..</p>
                

              </div>
            </div>

          </div>
          </section>
        </main>
      )}

      {page === 'info' && (
        <main>
          <div className="header">
            <button onClick = {() => setPage('home')} className = "back-button"><p>back</p></button>
            <h2>isa's mental math trainer</h2>
          </div>
          
          <section className="info">
            <h3>info</h3>
            <div className="info-content">
            <p>
              this site was made to help me (isabel !) get better at mental math after years of calculator usage + complacency.. 
              <br /><br />there are two modes : training, where you can choose an operation and work your way up from the basics, and infinite practice, where you can practice all operations with adaptive difficulty.
              <br /><br />there's also a section for tips and tricks with strategies to get faster!
              <br /><br />note that this site is still a work in progress, so some features might be missing / incomplete / bad. please send suggestions or feedback!! reach me at starlitfire427[at]gmail[dot]com!
              <br /><br />hope you have fun practicing / looking around .𖥔 ݁ ˖๋ ࣭ ⭑ and remember-- you can be anything you want to be ♡
            </p>
            </div>
            <img src = {darkmode ? "/src/assets/ecliptic-dark.png" : "/src/assets/ecliptic.png"} className="ecliptic" alt=""/>
          </section>
        </main>
      )}
    </div>

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
      x = randomInt(6, 25)
      y = [5,10,11,12,25][randomInt(0,4)]
    } else if (level===3) {
      x = randomInt(10,50)
      y = [5,10,11,12,25][randomInt(0,4)]
    } else if (level === 4) {
      x = randomInt(20, 50)
      y = randomInt(10, 90)
    } else if (level === 5) {
      x = randomInt(10, 90)
      y = randomInt(10, 90)
    } else if (level === 6) {
      x = randomInt(10, 90)
      y = randomInt(50, 150)
    }
  } 
  else if (operation === '÷') {
    if (level === 1) {
      y = randomInt(1,9)
      answer = randomInt(1,9)
    } else if (level ===2) {
      y = [2,3,4,5,10][randomInt(0,4)]
      answer = randomInt(2,12)
    } else if (level ===3){
      y = randomInt(2,12)
      answer = randomInt(10,90)
    } else if (level === 4){
      y = randomInt(20,50)
      answer = randomInt(10,90)
    } else if (level === 5){
      y = randomInt(10,90)
      answer = randomInt(10,90)
    } else if (level === 6){
      y = randomInt(10,90)
      answer = randomInt(50,150)
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
    } else if (level === 4) {
      x = randomInt(10, 99)
      y = randomInt(100, 500)
    } else if (level === 5) {
      x = randomInt(100, 500)
      y = randomInt(500, 999)
    } else if (level === 6) {
      x = randomInt(100, 999)
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
