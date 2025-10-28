import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import missionsData from '../../missions.json'

interface LogError {
  id: string
  line: number
  content: string
  type: 'error' | 'warning' | 'info'
  explanation: string
  suggestedFix: string
  fixed: boolean
}

interface ErrorCardProps {
  error: LogError
  onFix: (error: LogError) => void
}

const ErrorCard: React.FC<ErrorCardProps> = ({ error, onFix }) => {
  return (
    <div className={`p-4 rounded-lg border-2 transition-all ${
      error.fixed 
        ? 'border-green-500 bg-green-50' 
        : 'border-red-500 bg-red-50 hover:bg-red-100'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-semibold text-gray-800">
            Line {error.line}: {error.type.toUpperCase()}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {error.explanation}
          </div>
        </div>
        <div className="text-2xl">
          {error.fixed ? '✅' : '❌'}
        </div>
      </div>
      
      <div className="bg-gray-900 text-red-300 font-mono text-sm rounded p-3 mb-3">
        {error.content}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
        <div className="text-sm font-semibold text-blue-800 mb-1">Suggested Fix:</div>
        <div className="text-sm text-blue-700">{error.suggestedFix}</div>
      </div>
      
      {!error.fixed && (
        <button
          onClick={() => onFix(error)}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Mark as Fixed
        </button>
      )}
    </div>
  )
}

const LogDetective: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [logLines, setLogLines] = useState<string[]>([])
  const [errors, setErrors] = useState<LogError[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [showInstructions, setShowInstructions] = useState(true)
  const [selectedError, setSelectedError] = useState<LogError | null>(null)

  const mission = missionsData.missions.find(m => m.id === 4)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  useEffect(() => {
    // Initialize log lines and errors with better explanations
    const logLinesData = mission.validation?.logLines || []
    const errorsData = mission.validation?.errors || []
    
    setLogLines(logLinesData)
    
    // Create error objects with better explanations
    const errorObjects: LogError[] = []
    logLinesData.forEach((line, index) => {
      errorsData.forEach((errorText) => {
        if (line.includes(errorText)) {
          let explanation = ''
          let suggestedFix = ''
          
          if (errorText.includes('ModuleNotFoundError')) {
            explanation = 'Python can\'t find a required package'
            suggestedFix = 'Add the missing package to requirements.txt'
          } else if (errorText.includes('Could not find a version')) {
            explanation = 'The specified package version doesn\'t exist'
            suggestedFix = 'Update to a valid version number'
          } else if (errorText.includes('FileNotFoundError')) {
            explanation = 'A required file is missing'
            suggestedFix = 'Create the missing file or check the file path'
          }
          
          errorObjects.push({
            id: `error-${index}`,
            line: index + 1,
            content: line,
            type: line.includes('ERROR') ? 'error' : 'warning',
            explanation,
            suggestedFix,
            fixed: false
          })
        }
      })
    })
    
    setErrors(errorObjects)
  }, [mission, player])

  const handleFixError = (error: LogError) => {
    setErrors(prev => prev.map(e => 
      e.id === error.id ? { ...e, fixed: true } : e
    ))
  }

  const validateDetection = () => {
    const totalErrors = errors.length
    const fixedErrors = errors.filter(e => e.fixed).length
    
    // Calculate score based on errors found and fixed
    let score = 0
    
    // Points for finding errors (all errors are visible)
    score += 40
    
    // Points for fixing errors
    score += (fixedErrors / totalErrors) * 60
    
    return {
      score: Math.round(score),
      fixedErrors,
      totalErrors,
      allErrorsFixed: fixedErrors === totalErrors
    }
  }

  const handleSubmit = () => {
    const validation = validateDetection()
    const timeSpent = Date.now() - startTime
    
    updateMissionProgress(4, {
      completed: validation.allErrorsFixed,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.allErrorsFixed) {
      unlockNextMission()
    }
  }

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1)
  }

  const handleNextMission = () => {
    navigate('/')
  }

  if (gameCompleted) {
    const validation = validateDetection()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">
            {validation.allErrorsFixed ? '🔍' : '🕵️'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.allErrorsFixed ? 'Investigation Complete!' : 'Good Detective Work!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{validation.fixedErrors}/{validation.totalErrors}</div>
                <div className="text-sm text-gray-600">Errors Fixed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{Math.round((Date.now() - startTime) / 60000)}min</div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
                <div className="text-sm text-gray-600">Hints Used</div>
              </div>
            </div>
          </div>
          
          {validation.allErrorsFixed ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Excellent! You've identified and fixed all CI pipeline errors. You're ready for production debugging!
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Good work! Look for ModuleNotFoundError, version conflicts, and missing files in CI logs. These are the most common issues.
              </p>
            </div>
          )}
          
          <button
            onClick={handleNextMission}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue to Mission Select
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="game-container p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🔍 Mission 4: Log Detective
              </h1>
              <p className="text-gray-600">
                Debug a failing CI pipeline by analyzing logs and identifying errors
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Hints Used</div>
              <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-6 mb-6"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">How to Debug CI Logs</h2>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">1. Identify Errors</h3>
                    <p className="text-red-700">Look for ERROR, FAILED, or exception messages in the logs</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">2. Understand the Problem</h3>
                    <p className="text-yellow-700">Read the error message to understand what went wrong</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">3. Apply the Fix</h3>
                    <p className="text-green-700">Use the suggested solution to resolve the issue</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-gray-500 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Side - Log Viewer */}
          <div className="space-y-6">
            <div className="game-container p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">CI Pipeline Logs</h2>
              <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg p-4 max-h-96 overflow-y-auto">
                {logLines.map((line, index) => {
                  const error = errors.find(e => e.line === index + 1)
                  const isError = error && !error.fixed
                  
                  return (
                    <div
                      key={index}
                      className={`${isError ? 'bg-red-900 text-red-300' : ''} p-1 rounded cursor-pointer hover:bg-gray-800`}
                      onClick={() => error && setSelectedError(error)}
                    >
                      <span className="text-gray-500 mr-2">{String(index + 1).padStart(3, ' ')}</span>
                      {line}
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                Click on error lines (highlighted in red) to see details
              </div>
            </div>
          </div>

          {/* Right Side - Error Analysis */}
          <div className="space-y-6">
            <div className="game-container p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Error Analysis</h2>
              <div className="space-y-4">
                {errors.map((error) => (
                  <ErrorCard
                    key={error.id}
                    error={error}
                    onFix={handleFixError}
                  />
                ))}
              </div>
              
              <div className="mt-6 flex justify-between">
                <div className="text-sm text-gray-600">
                  Fixed: {errors.filter(e => e.fixed).length}/{errors.length} errors
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit Investigation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Concept Card */}
        <div className="mt-8">
          <ConceptCard
            teaching={mission.teaching}
            difficulty={player.difficulty}
            onHintUsed={handleHintUsed}
          />
        </div>

        {/* Common Error Types */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-container p-6 mt-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Common CI Error Types</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">ModuleNotFoundError:</h4>
              <div className="text-sm text-gray-600">
                Missing Python package in requirements.txt
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Version Conflicts:</h4>
              <div className="text-sm text-gray-600">
                Package version doesn't exist or incompatible
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">FileNotFoundError:</h4>
              <div className="text-sm text-gray-600">
                Missing files or wrong file paths
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Syntax Errors:</h4>
              <div className="text-sm text-gray-600">
                Python code syntax issues
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default LogDetective