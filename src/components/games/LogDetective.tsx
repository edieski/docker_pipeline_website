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
  fix: string
  selected: boolean
}

interface ErrorFixModalProps {
  error: LogError | null
  onClose: () => void
  onFix: (error: LogError, fix: string) => void
}

const ErrorFixModal: React.FC<ErrorFixModalProps> = ({ error, onClose, onFix }) => {
  const [selectedFix, setSelectedFix] = useState('')

  useEffect(() => {
    if (error) {
      setSelectedFix(error.fix)
    }
  }, [error])

  const handleFix = () => {
    if (error && selectedFix) {
      onFix(error, selectedFix)
    }
    onClose()
  }

  if (!error) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Fix Error on Line {error.line}
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Error Content:
          </label>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 font-mono text-sm">
            {error.content}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Suggested Fix:
          </label>
          <textarea
            value={selectedFix}
            onChange={(e) => setSelectedFix(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="Enter your fix..."
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleFix}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Apply Fix
          </button>
        </div>
      </div>
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
  const [fixingError, setFixingError] = useState<LogError | null>(null)
  const [foundErrors, setFoundErrors] = useState<Set<string>>(new Set())

  const mission = missionsData.missions.find(m => m.id === 4)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  useEffect(() => {
    // Initialize log lines and errors
    const logLinesData = mission.validation?.logLines || []
    const errorsData = mission.validation?.errors || []
    
    setLogLines(logLinesData)
    
    // Create error objects from log lines
    const errorObjects: LogError[] = []
    logLinesData.forEach((line, index) => {
      errorsData.forEach((errorText) => {
        if (line.includes(errorText)) {
          errorObjects.push({
            id: `error-${index}`,
            line: index + 1,
            content: line,
            type: line.includes('ERROR') ? 'error' : 'warning',
            fix: getFixForError(errorText),
            selected: false
          })
        }
      })
    })
    
    setErrors(errorObjects)
  }, [mission, player])

  const getFixForError = (errorText: string): string => {
    if (errorText.includes('ModuleNotFoundError')) {
      return 'Add missing dependency to requirements.txt:\nrequests==2.31.0'
    }
    if (errorText.includes('Could not find a version')) {
      return 'Update requirements.txt with correct version:\nfastapi==0.104.1'
    }
    if (errorText.includes('FileNotFoundError')) {
      return 'Create missing file or check file path:\nrequirements.txt'
    }
    return 'Check the error and provide appropriate fix'
  }

  const handleErrorClick = (error: LogError) => {
    setFixingError(error)
  }

  const handleErrorFix = (error: LogError, fix: string) => {
    setErrors(prev => prev.map(e => 
      e.id === error.id ? { ...e, fix, selected: true } : e
    ))
    setFoundErrors(prev => new Set([...prev, error.id]))
  }

  const validateDetection = () => {
    const totalErrors = errors.length
    const detectedErrors = foundErrors.size
    
    // Calculate score based on errors found and fixed
    let score = 0
    
    // Points for finding errors
    score += (detectedErrors / totalErrors) * 60
    
    // Points for correct fixes
    const correctFixes = errors.filter(error => 
      foundErrors.has(error.id) && 
      error.fix.includes('requirements.txt') || 
      error.fix.includes('fastapi') ||
      error.fix.includes('requests')
    ).length
    
    score += (correctFixes / totalErrors) * 40
    
    return {
      score: Math.round(score),
      detectedErrors,
      totalErrors,
      allErrorsFound: detectedErrors === totalErrors,
      correctFixes
    }
  }

  const handleSubmit = () => {
    const validation = validateDetection()
    const timeSpent = Date.now() - startTime
    
    updateMissionProgress(4, {
      completed: validation.allErrorsFound && validation.correctFixes >= validation.totalErrors * 0.8,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.allErrorsFound && validation.correctFixes >= validation.totalErrors * 0.8) {
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
            {validation.allErrorsFound ? '🔍' : '🕵️'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.allErrorsFound ? 'Investigation Complete!' : 'Good Detective Work!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{validation.detectedErrors}/{validation.totalErrors}</div>
                <div className="text-sm text-gray-600">Errors Found</div>
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
          
          {validation.allErrorsFound ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Excellent! You've identified all CI pipeline errors and provided correct fixes. You're ready for production debugging!
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
      <div className="max-w-6xl mx-auto">
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Log Viewer */}
          <div className="space-y-6">
            <div className="game-container p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">CI Pipeline Logs</h2>
              <div className="bg-gray-900 text-green-400 font-mono text-sm rounded-lg p-4 max-h-96 overflow-y-auto">
                {logLines.map((line, index) => {
                  const error = errors.find(e => e.line === index + 1)
                  const isError = error && foundErrors.has(error.id)
                  
                  return (
                    <div
                      key={index}
                      className={`${isError ? 'bg-red-900 text-red-300' : ''} cursor-pointer hover:bg-gray-800 p-1 rounded`}
                      onClick={() => error && handleErrorClick(error)}
                    >
                      <span className="text-gray-500 mr-2">{String(index + 1).padStart(3, ' ')}</span>
                      {line}
                    </div>
                  )
                })}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Click on error lines to fix them
                </div>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Submit Investigation
                </button>
              </div>
            </div>

            {/* Error Summary */}
            <div className="game-container p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Error Summary</h3>
              <div className="space-y-2">
                {errors.map((error) => (
                  <div
                    key={error.id}
                    className={`p-3 rounded-lg border-2 ${
                      foundErrors.has(error.id)
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-gray-800">
                          Line {error.line}: {error.type.toUpperCase()}
                        </div>
                        <div className="text-sm text-gray-600 truncate">
                          {error.content}
                        </div>
                      </div>
                      <div className="text-2xl">
                        {foundErrors.has(error.id) ? '✅' : '❌'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Concept Card */}
          <div>
            <ConceptCard
              teaching={mission.teaching}
              difficulty={player.difficulty}
              onHintUsed={handleHintUsed}
            />
          </div>
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

      {/* Error Fix Modal */}
      <ErrorFixModal
        error={fixingError}
        onClose={() => setFixingError(null)}
        onFix={handleErrorFix}
      />
    </div>
  )
}

export default LogDetective
