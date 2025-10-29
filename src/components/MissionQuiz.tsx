import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  wrongAnswerExplanations?: Record<number, string>
}

interface MissionQuizProps {
  questions: QuizQuestion[]
  missionTitle: string
  onComplete: (score: number, quizScore: number) => void
  onSkip?: () => void
}

const MissionQuiz: React.FC<MissionQuizProps> = ({ questions, missionTitle, onComplete, onSkip }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [answeredCorrectly, setAnsweredCorrectly] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [answeredQuestions, setAnsweredQuestions] = useState<boolean[]>(new Array(questions.length).fill(false))

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleAnswerSelect = (answerIndex: number) => {
    if (answeredQuestions[currentQuestionIndex]) return // Already answered
    
    setSelectedAnswer(answerIndex)
    const isCorrect = answerIndex === currentQuestion.correctAnswer
    setAnsweredCorrectly(isCorrect)
    setShowExplanation(true)
    
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1)
    }
    
    setAnsweredQuestions(prev => {
      const newArr = [...prev]
      newArr[currentQuestionIndex] = true
      return newArr
    })
  }

  const handleNext = () => {
    if (isLastQuestion) {
      const quizScore = Math.round((correctAnswers / questions.length) * 100)
      onComplete(correctAnswers, quizScore)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
      setAnsweredCorrectly(false)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="game-container max-w-3xl w-full p-8"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">📝</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Knowledge Check</h1>
          <p className="text-gray-600">Let's make sure you understand {missionTitle}</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {questions.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index < currentQuestionIndex
                      ? 'bg-green-500'
                      : index === currentQuestionIndex
                      ? 'bg-blue-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600 ml-2">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg p-6 mb-6 border-2 border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrect = index === currentQuestion.correctAnswer
              const showResult = showExplanation && answeredQuestions[currentQuestionIndex]
              
              let optionClass = 'bg-gray-50 border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              if (showResult) {
                if (isCorrect) {
                  optionClass = 'bg-green-100 border-2 border-green-500'
                } else if (isSelected && !isCorrect) {
                  optionClass = 'bg-red-100 border-2 border-red-500'
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={answeredQuestions[currentQuestionIndex]}
                  className={`w-full text-left p-4 rounded-lg transition-all ${optionClass} ${
                    answeredQuestions[currentQuestionIndex] ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold ${
                      showResult && isCorrect
                        ? 'bg-green-500 text-white'
                        : showResult && isSelected && !isCorrect
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {showResult && isCorrect ? '✓' : showResult && isSelected && !isCorrect ? '✗' : String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1 text-gray-800">{option}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className={`rounded-lg p-4 mb-6 ${
                answeredCorrectly
                  ? 'bg-green-50 border-2 border-green-200'
                  : 'bg-red-50 border-2 border-red-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{answeredCorrectly ? '✅' : '❌'}</span>
                <div className="flex-1">
                  <h3 className={`font-bold mb-2 ${
                    answeredCorrectly ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {answeredCorrectly ? 'Correct!' : 'Not quite right'}
                  </h3>
                  <p className={`text-sm leading-relaxed ${
                    answeredCorrectly ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {answeredCorrectly 
                      ? currentQuestion.explanation
                      : selectedAnswer !== null && currentQuestion.wrongAnswerExplanations?.[selectedAnswer]
                        ? currentQuestion.wrongAnswerExplanations[selectedAnswer]
                        : currentQuestion.explanation
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex justify-between items-center">
          {onSkip && (
            <button
              onClick={handleSkip}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Skip Quiz
            </button>
          )}
          <div className="flex-1"></div>
          <button
            onClick={handleNext}
            disabled={!answeredQuestions[currentQuestionIndex]}
            className={`px-6 py-3 rounded-lg transition-colors ${
              answeredQuestions[currentQuestionIndex]
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isLastQuestion ? 'Finish Quiz' : 'Next Question'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default MissionQuiz

