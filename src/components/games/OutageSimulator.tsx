import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import MissionQuiz from '../MissionQuiz'
import missionsData from '../../missions.json'

interface ServiceMetrics {
  cpu: number
  memory: number
  responseTime: number
  errorRate: number
  requestsPerSecond: number
}

interface RecoveryStrategy {
  name: string
  description: string
  timeToExecute: number
  risk: 'low' | 'medium' | 'high'
  whenToUse: string
  effectiveness: number
  explanation: string
}

interface Incident {
  id: string
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  timestamp: Date
  resolved: boolean
  recommendedStrategy: string
}

const OutageSimulator: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [metrics, setMetrics] = useState<ServiceMetrics>({
    cpu: 25,
    memory: 40,
    responseTime: 150,
    errorRate: 2,
    requestsPerSecond: 100
  })
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [selectedStrategy, setSelectedStrategy] = useState<RecoveryStrategy | null>(null)
  const [strategyExecuting, setStrategyExecuting] = useState(false)
  const [gamePhase, setGamePhase] = useState<'monitoring' | 'incident' | 'response' | 'resolution'>('monitoring')
  const [showInstructions, setShowInstructions] = useState(true)

  const mission = missionsData.missions.find(m => m.id === 6)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  const strategies: RecoveryStrategy[] = [
    {
      name: 'Rollback',
      description: 'Revert to the last known good version',
      timeToExecute: 5,
      risk: 'low',
      whenToUse: 'When you know the current version is broken',
      effectiveness: 90,
      explanation: 'Safest option - reverts to previous working state'
    },
    {
      name: 'Hotfix',
      description: 'Deploy a quick patch without full testing',
      timeToExecute: 2,
      risk: 'high',
      whenToUse: 'When you need immediate fix and understand the issue',
      effectiveness: 70,
      explanation: 'Fastest option but risky - may introduce new issues'
    },
    {
      name: 'Redeploy',
      description: 'Deploy a tested fix through normal pipeline',
      timeToExecute: 8,
      risk: 'medium',
      whenToUse: 'When you have a tested fix ready',
      effectiveness: 85,
      explanation: 'Balanced option - tested fix through normal process'
    },
    {
      name: 'Scale Up',
      description: 'Add more resources to handle increased load',
      timeToExecute: 3,
      risk: 'low',
      whenToUse: 'When the issue is high load, not broken code',
      effectiveness: 60,
      explanation: 'Good for load issues but doesn\'t fix root cause'
    }
  ]

  const healthThresholds = mission.validation?.healthThresholds || { critical: 20, warning: 50, healthy: 80 }

  useEffect(() => {
    // Start the simulation
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          handleGameEnd()
          return 0
        }
        return prev - 1
      })
      
      // Simulate service degradation
      if (gamePhase === 'monitoring' && Math.random() < 0.1) {
        triggerIncident()
      }
      
      // Update metrics based on current state
      updateMetrics()
    }, 1000)

    return () => clearInterval(interval)
  }, [gamePhase])

  const triggerIncident = () => {
    const incidentTypes = [
      {
        title: 'High CPU Usage',
        description: 'CPU usage has spiked to 95%, causing slow response times',
        severity: 'critical' as const,
        recommendedStrategy: 'Scale Up'
      },
      {
        title: 'Memory Leak Detected',
        description: 'Memory usage is increasing rapidly, service may crash soon',
        severity: 'critical' as const,
        recommendedStrategy: 'Rollback'
      },
      {
        title: 'Database Connection Pool Exhausted',
        description: 'All database connections are in use, new requests are failing',
        severity: 'critical' as const,
        recommendedStrategy: 'Scale Up'
      },
      {
        title: 'High Error Rate',
        description: 'Error rate has increased to 15%, affecting user experience',
        severity: 'warning' as const,
        recommendedStrategy: 'Rollback'
      }
    ]
    
    const incident = incidentTypes[Math.floor(Math.random() * incidentTypes.length)]
    
    setIncidents(prev => [...prev, {
      id: `incident-${Date.now()}`,
      ...incident,
      timestamp: new Date(),
      resolved: false
    }])
    
    setGamePhase('incident')
  }

  const updateMetrics = () => {
    setMetrics(prev => {
      const newMetrics = { ...prev }
      
      // Simulate degradation if there are unresolved incidents
      const unresolvedIncidents = incidents.filter(i => !i.resolved)
      
      if (unresolvedIncidents.length > 0) {
        newMetrics.cpu = Math.min(prev.cpu + Math.random() * 10, 100)
        newMetrics.memory = Math.min(prev.memory + Math.random() * 5, 100)
        newMetrics.responseTime = Math.min(prev.responseTime + Math.random() * 50, 2000)
        newMetrics.errorRate = Math.min(prev.errorRate + Math.random() * 2, 50)
        newMetrics.requestsPerSecond = Math.max(prev.requestsPerSecond - Math.random() * 10, 0)
      } else {
        // Gradual recovery
        newMetrics.cpu = Math.max(prev.cpu - Math.random() * 2, 25)
        newMetrics.memory = Math.max(prev.memory - Math.random() * 1, 40)
        newMetrics.responseTime = Math.max(prev.responseTime - Math.random() * 10, 150)
        newMetrics.errorRate = Math.max(prev.errorRate - Math.random() * 0.5, 2)
        newMetrics.requestsPerSecond = Math.min(prev.requestsPerSecond + Math.random() * 2, 100)
      }
      
      return newMetrics
    })
  }

  const handleStrategySelect = (strategy: RecoveryStrategy) => {
    setSelectedStrategy(strategy)
    setGamePhase('response')
  }

  const executeStrategy = async () => {
    if (!selectedStrategy) return
    
    setStrategyExecuting(true)
    
    // Simulate strategy execution time
    await new Promise(resolve => setTimeout(resolve, selectedStrategy.timeToExecute * 1000))
    
    // Check if strategy was effective
    const wasEffective = Math.random() < (selectedStrategy.effectiveness / 100)
    
    if (wasEffective) {
      // Resolve incidents
      setIncidents(prev => prev.map(incident => ({ ...incident, resolved: true })))
      setGamePhase('resolution')
      
      setTimeout(() => {
        const validation = validateResponse()
        const timeSpent = Date.now() - startTime
        
        updateMissionProgress(6, {
          completed: true,
          timeSpent,
          hintsUsed,
          score: validation.score
        })
        
        setGameCompleted(true)
        
        if (mission.quiz && mission.quiz.length > 0) {
          setShowQuiz(true)
        } else {
          unlockNextMission()
        }
      }, 2000)
    } else {
      // Strategy failed, try again
      setStrategyExecuting(false)
      setSelectedStrategy(null)
      setGamePhase('incident')
    }
  }

  const validateResponse = () => {
    let score = 0
    
    // Points for responding quickly
    const responseTime = (300 - timeRemaining) / 60 // minutes
    if (responseTime < 2) score += 30
    else if (responseTime < 4) score += 20
    else score += 10
    
    // Points for choosing appropriate strategy
    if (selectedStrategy) {
      if (selectedStrategy.risk === 'low') score += 25
      else if (selectedStrategy.risk === 'medium') score += 15
      else score += 5
      
      if (selectedStrategy.timeToExecute < 5) score += 20
      else if (selectedStrategy.timeToExecute < 10) score += 15
      else score += 10
    }
    
    // Points for resolving incidents
    const resolvedIncidents = incidents.filter(i => i.resolved).length
    score += (resolvedIncidents / incidents.length) * 25
    
    return { score: Math.min(score, 100) }
  }

  const handleGameEnd = () => {
    const validation = validateResponse()
    const timeSpent = Date.now() - startTime
    
    updateMissionProgress(6, {
      completed: validation.score >= 70,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.score >= 70 && mission.quiz && mission.quiz.length > 0) {
      setShowQuiz(true)
    } else if (validation.score >= 70) {
      unlockNextMission()
    }
  }

  const handleQuizComplete = (_correctAnswers: number, quizScore: number) => {
    updateMissionProgress(6, {
      quizScore
    })
    setShowQuiz(false)
    unlockNextMission()
  }

  const handleQuizSkip = () => {
    setShowQuiz(false)
  }

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1)
  }

  const handleNextMission = () => {
    navigate('/')
  }


  const handleGoHome = () => {
    navigate('/')
  }

  const getHealthStatus = () => {
    const avgHealth = (metrics.cpu + metrics.memory + (100 - metrics.errorRate)) / 3
    if (avgHealth < healthThresholds.critical) return { status: 'critical', color: 'red', icon: '🚨' }
    if (avgHealth < healthThresholds.warning) return { status: 'warning', color: 'yellow', icon: '⚠️' }
    return { status: 'healthy', color: 'green', icon: '✅' }
  }

  if (showQuiz && mission.quiz && mission.quiz.length > 0) {
    return (
      <MissionQuiz
        questions={mission.quiz as any}
        missionTitle={mission.title}
        onComplete={handleQuizComplete}
        onSkip={handleQuizSkip}
      />
    )
  }

  if (gameCompleted) {
    const validation = validateResponse()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">
            {validation.score >= 70 ? '🎯' : '⏰'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.score >= 70 ? 'Incident Resolved!' : 'Time Up!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{incidents.filter(i => i.resolved).length}</div>
                <div className="text-sm text-gray-600">Incidents Resolved</div>
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
          
          {validation.score >= 70 ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Excellent! You've successfully managed a production incident with quick response time and appropriate strategy selection.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Remember: choose low-risk strategies for critical incidents, respond quickly, and monitor service health continuously.
              </p>
            </div>
          )}

          <div className="flex space-x-4 justify-center flex-wrap gap-2">
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🏠 Home
            </button>
            <button
              onClick={handleNextMission}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue to Mission Select
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const healthStatus = getHealthStatus()

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="game-container p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoHome}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Go to Home"
              >
                🏠 Home
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  🚨 Mission 6: Outage Simulator
                </h1>
                <p className="text-gray-600">
                  Respond to a production incident by choosing the right recovery strategy
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Time Remaining</div>
              <div className={`text-2xl font-bold ${timeRemaining < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
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
                <h2 className="text-xl font-bold text-gray-800 mb-4">Incident Response Process</h2>
                <div className="grid md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">1. Monitor</h3>
                    <p className="text-blue-700">Watch service metrics for anomalies</p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2">2. Detect</h3>
                    <p className="text-red-700">Identify incidents and their severity</p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-800 mb-2">3. Respond</h3>
                    <p className="text-yellow-700">Choose appropriate recovery strategy</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2">4. Resolve</h3>
                    <p className="text-green-700">Execute strategy and verify fix</p>
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
          {/* Left Side - Monitoring Dashboard */}
          <div className="space-y-6">
            {/* Service Health */}
            <div className="game-container p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Service Health</h2>
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">{healthStatus.icon}</div>
                <div className={`text-xl font-bold text-${healthStatus.color}-600`}>
                  {healthStatus.status.toUpperCase()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${metrics.cpu > 80 ? 'text-red-600' : metrics.cpu > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {metrics.cpu.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">CPU Usage</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${metrics.memory > 80 ? 'text-red-600' : metrics.memory > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {metrics.memory.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Memory Usage</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${metrics.responseTime > 1000 ? 'text-red-600' : metrics.responseTime > 500 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {metrics.responseTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">Response Time</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${metrics.errorRate > 10 ? 'text-red-600' : metrics.errorRate > 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {metrics.errorRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Error Rate</div>
                </div>
              </div>
            </div>

            {/* Incidents */}
            <div className="game-container p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Active Incidents</h2>
              {incidents.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">✅</div>
                  <p>No active incidents</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incidents.map((incident) => (
                    <div
                      key={incident.id}
                      className={`p-4 rounded-lg border-2 ${
                        incident.resolved
                          ? 'border-green-500 bg-green-50'
                          : incident.severity === 'critical'
                          ? 'border-red-500 bg-red-50'
                          : 'border-yellow-500 bg-yellow-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold text-gray-800">{incident.title}</div>
                          <div className="text-sm text-gray-600">{incident.description}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {incident.timestamp.toLocaleTimeString()}
                          </div>
                          {!incident.resolved && (
                            <div className="text-xs text-blue-600 mt-1">
                              Recommended: {incident.recommendedStrategy}
                            </div>
                          )}
                        </div>
                        <div className="text-2xl">
                          {incident.resolved ? '✅' : incident.severity === 'critical' ? '🚨' : '⚠️'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Response Actions */}
          <div className="space-y-6">
            {/* Recovery Strategies */}
            {gamePhase === 'incident' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="game-container p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Recovery Strategies</h2>
                <div className="space-y-3">
                  {strategies.map((strategy, index) => (
                    <button
                      key={index}
                      onClick={() => handleStrategySelect(strategy)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                        strategy.risk === 'low'
                          ? 'border-green-300 bg-green-50 hover:bg-green-100'
                          : strategy.risk === 'medium'
                          ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
                          : 'border-red-300 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <div className="font-semibold text-gray-800">{strategy.name}</div>
                      <div className="text-sm text-gray-600 mb-2">{strategy.description}</div>
                      <div className="text-xs text-gray-500">
                        Time: {strategy.timeToExecute}min | Risk: {strategy.risk} | Effectiveness: {strategy.effectiveness}%
                      </div>
                      <div className="text-xs text-gray-600 mt-1">{strategy.explanation}</div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Strategy Execution */}
            {gamePhase === 'response' && selectedStrategy && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="game-container p-6"
              >
                <h2 className="text-xl font-bold text-gray-800 mb-4">Executing Strategy</h2>
                <div className="text-center">
                  <div className="text-4xl mb-4">⚡</div>
                  <div className="font-semibold text-gray-800 mb-2">{selectedStrategy.name}</div>
                  <div className="text-sm text-gray-600 mb-4">{selectedStrategy.description}</div>
                  <div className="text-xs text-gray-500 mb-4">
                    Estimated time: {selectedStrategy.timeToExecute} minutes
                  </div>
                  <button
                    onClick={executeStrategy}
                    disabled={strategyExecuting}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {strategyExecuting ? 'Executing...' : 'Execute Strategy'}
                  </button>
                </div>
              </motion.div>
            )}
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

        {/* Response Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-container p-6 mt-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Incident Response Guidelines</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Response Priority:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>1. Assess severity and impact</div>
                <div>2. Choose appropriate strategy</div>
                <div>3. Execute quickly but safely</div>
                <div>4. Monitor and verify fix</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Strategy Selection:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Rollback: Safe, reverts to last known good</div>
                <div>• Hotfix: Fast but risky, immediate patch</div>
                <div>• Redeploy: Medium risk, tested solution</div>
                <div>• Scale: Add resources to handle load</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default OutageSimulator