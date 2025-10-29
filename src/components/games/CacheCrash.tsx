import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import MissionQuiz from '../MissionQuiz'
import missionsData from '../../missions.json'

interface DockerInstruction {
  id: string
  content: string
  type: 'instruction'
  explanation: string
  optimized?: boolean
}

interface DropSlotProps {
  index: number
  instruction: DockerInstruction | null
  onDrop: (item: DockerInstruction, index: number) => void
  onRemove: (index: number) => void
}

const DropSlot: React.FC<DropSlotProps> = ({ index, instruction, onDrop, onRemove }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'docker-instruction',
    drop: (item: DockerInstruction) => {
      onDrop(item, index)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div
      ref={drop}
      className={`min-h-20 border-2 border-dashed rounded-lg flex items-center justify-center p-3 transition-all duration-200 ${
        isOver 
          ? 'border-blue-500 bg-blue-50 scale-105' 
          : instruction 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      {instruction ? (
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <div className="text-sm font-mono text-gray-800 text-center mb-1">
              {instruction.content}
            </div>
            <div className="text-xs text-gray-600 text-center">
              {instruction.explanation}
            </div>
          </div>
          <button
            onClick={() => onRemove(index)}
            className="ml-2 text-red-500 hover:text-red-700 text-lg font-bold"
            title="Remove this instruction"
          >
            ×
          </button>
        </div>
      ) : (
        <span className="text-gray-400 text-sm text-center">
          Step {index + 1}<br />
          <span className="text-xs">Drop instruction here</span>
        </span>
      )}
    </div>
  )
}

interface DraggableInstructionProps {
  instruction: DockerInstruction
}

const DraggableInstruction: React.FC<DraggableInstructionProps> = ({ instruction }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'docker-instruction',
    item: instruction,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  return (
    <div
      ref={drag}
      className={`p-3 bg-white border-2 border-blue-500 rounded-lg cursor-grab hover:shadow-md transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-95' : 'hover:scale-105'
      }`}
    >
      <div className="text-sm font-mono text-gray-800 text-center mb-1">
        {instruction.content}
      </div>
      <div className="text-xs text-gray-600 text-center">
        {instruction.explanation}
      </div>
    </div>
  )
}

const CacheCrash: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [availableInstructions, setAvailableInstructions] = useState<DockerInstruction[]>([])
  const [droppedInstructions, setDroppedInstructions] = useState<(DockerInstruction | null)[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [timeSpentMs, setTimeSpentMs] = useState(0)
  const [lastValidation, setLastValidation] = useState<ReturnType<typeof validateOptimization> | null>(null)
  const [showOptimizations, setShowOptimizations] = useState(false)
  const [appliedOptimizations, setAppliedOptimizations] = useState<string[]>([])
  const [buildTime, setBuildTime] = useState(45)
  const [imageSize, setImageSize] = useState(450)

  const mission = missionsData.missions.find(m => m.id === 2)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  const difficultySettings = mission.difficulty[player.difficulty as keyof typeof mission.difficulty] as { hints: number; targetSize: number; targetTime: number }

  useEffect(() => {
    // Initialize game with better explanations
    const instructionsWithExplanations: DockerInstruction[] = [
      {
        id: 'from',
        content: 'FROM python:3.12-slim',
        type: 'instruction',
        explanation: 'Start with lightweight base image'
      },
      {
        id: 'workdir',
        content: 'WORKDIR /app',
        type: 'instruction',
        explanation: 'Set working directory'
      },
      {
        id: 'copy-reqs',
        content: 'COPY requirements.txt .',
        type: 'instruction',
        explanation: 'Copy dependency list first (for caching)'
      },
      {
        id: 'install',
        content: 'RUN pip install --no-cache-dir -r requirements.txt',
        type: 'instruction',
        explanation: 'Install dependencies (cached if reqs.txt unchanged)'
      },
      {
        id: 'copy-app',
        content: 'COPY . .',
        type: 'instruction',
        explanation: 'Copy application code last'
      },
      {
        id: 'expose',
        content: 'EXPOSE 8000',
        type: 'instruction',
        explanation: 'Document the port'
      },
      {
        id: 'cmd',
        content: 'CMD ["python", "app.py"]',
        type: 'instruction',
        explanation: 'Start the application'
      }
    ]
    
    // Shuffle instructions for the puzzle
    const shuffled = [...instructionsWithExplanations].sort(() => Math.random() - 0.5)
    setAvailableInstructions(shuffled)
    
    // Initialize empty drop zones
    setDroppedInstructions(new Array(instructionsWithExplanations.length).fill(null))
    
    // Set initial build metrics
    setBuildTime(45)
    setImageSize(450)
  }, [mission, player])

  const handleDrop = (item: DockerInstruction, index: number) => {
    // Remove from available instructions
    setAvailableInstructions(prev => prev.filter(instruction => instruction.id !== item.id))
    
    // Add to dropped instructions
    setDroppedInstructions(prev => {
      const newInstructions = [...prev]
      newInstructions[index] = item
      return newInstructions
    })
    
    // Update build metrics based on layer order
    updateBuildMetrics()
  }

  const handleRemove = (index: number) => {
    const instructionToRemove = droppedInstructions[index]
    if (!instructionToRemove) return
    
    // Add back to available instructions
    setAvailableInstructions(prev => [...prev, instructionToRemove])
    
    // Remove from dropped instructions
    setDroppedInstructions(prev => {
      const newInstructions = [...prev]
      newInstructions[index] = null
      return newInstructions
    })
    
    // Update build metrics
    updateBuildMetrics()
  }

  const updateBuildMetrics = () => {
    const instructions = droppedInstructions.filter(inst => inst !== null) as DockerInstruction[]
    
    // Check for proper layer ordering (dependencies before code)
    const hasRequirementsFirst = instructions.some(inst => 
      inst.id === 'copy-reqs' && 
      instructions.indexOf(inst) < instructions.findIndex(i => i.id === 'copy-app')
    )
    
    const hasDependenciesBeforeCode = instructions.some(inst => 
      inst.id === 'install' && 
      instructions.indexOf(inst) < instructions.findIndex(i => i.id === 'copy-app')
    )
    
    // Calculate build time and image size based on optimization
    let newBuildTime = 45
    let newImageSize = 450
    
    if (hasRequirementsFirst && hasDependenciesBeforeCode) {
      newBuildTime = Math.max(newBuildTime - 15, 20)
      newImageSize = Math.max(newImageSize - 50, 200)
    }
    
    // Apply optimization bonuses
    const optimizationBonus = appliedOptimizations.length * 5
    newBuildTime = Math.max(newBuildTime - optimizationBonus, 15)
    newImageSize = Math.max(newImageSize - (optimizationBonus * 2), 150)
    
    setBuildTime(newBuildTime)
    setImageSize(newImageSize)
  }

  const applyOptimization = (optimization: string) => {
    if (appliedOptimizations.includes(optimization)) return
    
    setAppliedOptimizations(prev => [...prev, optimization])
    updateBuildMetrics()
  }

  const validateOptimization = () => {
    const instructions = droppedInstructions.filter(inst => inst !== null) as DockerInstruction[]
    
    let score = 0
    let feedback: string[] = []
    let correctOrder = 0
    
    // Check for proper layer ordering
    const hasRequirementsFirst = instructions.some(inst => 
      inst.id === 'copy-reqs' && 
      instructions.indexOf(inst) < instructions.findIndex(i => i.id === 'copy-app')
    )
    
    const hasDependenciesBeforeCode = instructions.some(inst => 
      inst.id === 'install' && 
      instructions.indexOf(inst) < instructions.findIndex(i => i.id === 'copy-app')
    )
    
    if (hasRequirementsFirst) {
      correctOrder++
      score += 30
      feedback.push("✅ Great! Copying requirements.txt before application code")
    } else {
      feedback.push("❌ Copy requirements.txt BEFORE copying application code for better caching")
    }
    
    if (hasDependenciesBeforeCode) {
      correctOrder++
      score += 30
      feedback.push("✅ Perfect! Installing dependencies before copying application code")
    } else {
      feedback.push("❌ Install dependencies BEFORE copying application code")
    }
    
    // Check optimization flags
    const optimizationScore = appliedOptimizations.length * 10
    score += optimizationScore
    
    if (appliedOptimizations.length > 0) {
      feedback.push(`✅ Applied ${appliedOptimizations.length} optimization(s) (+${optimizationScore} points)`)
    } else {
      feedback.push("💡 Try applying optimization flags like --no-cache or --compress")
    }
    
    // Check if targets are met
    const targetSize = difficultySettings.targetSize || 400
    const targetTime = difficultySettings.targetTime || 30
    
    if (imageSize <= targetSize) {
      score += 20
      feedback.push(`✅ Image size ${imageSize}MB ≤ ${targetSize}MB target`)
    } else {
      feedback.push(`❌ Image size ${imageSize}MB > ${targetSize}MB target`)
    }
    
    if (buildTime <= targetTime) {
      score += 20
      feedback.push(`✅ Build time ${buildTime}s ≤ ${targetTime}s target`)
    } else {
      feedback.push(`❌ Build time ${buildTime}s > ${targetTime}s target`)
    }
    
    // Additional hints
    if (score < 50) {
      feedback.push("💡 Hint: Order matters! Dependencies first, then application code")
    }
    
    return { 
      score: Math.max(0, Math.min(100, score)), 
      correctOrder, 
      total: 2,
      targetsMet: imageSize <= targetSize && buildTime <= targetTime,
      feedback,
      success: imageSize <= targetSize && buildTime <= targetTime && correctOrder === 2
    }
  }

  const handleSubmit = () => {
    const validation = validateOptimization()
    const timeSpent = Date.now() - startTime
    setTimeSpentMs(timeSpent)
    setLastValidation(validation)
    
    updateMissionProgress(2, {
      completed: validation.success,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.success && mission.quiz && mission.quiz.length > 0) {
      setShowQuiz(true)
    } else if (validation.success) {
      unlockNextMission()
    }
  }

  const handleQuizComplete = (_correctAnswers: number, quizScore: number) => {
    updateMissionProgress(2, {
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
    const validation = lastValidation || validateOptimization()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">
            {validation.targetsMet && validation.correctOrder === validation.total ? '🚀' : '⚡'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.targetsMet && validation.correctOrder === validation.total ? 'Optimization Complete!' : 'Good Progress!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{validation.correctOrder}/{validation.total}</div>
                <div className="text-sm text-gray-600">Correct Order</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{Math.max(0, Math.round(timeSpentMs / 60000))}min</div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
                <div className="text-sm text-gray-600">Hints Used</div>
              </div>
            </div>
          </div>
          
          {validation.targetsMet && validation.correctOrder === validation.total ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Excellent! You've mastered Docker optimization. Your builds are now faster and more efficient.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Remember: Copy dependencies first, then your code. This way code changes don't invalidate dependency cache.
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

  return (
    <DndProvider backend={HTML5Backend}>
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
                    ⚡ Mission 2: Cache Crash
                  </h1>
                  <p className="text-gray-600">
                    Optimize your Dockerfile for faster builds and smaller images
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Hints Used</div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
              </div>
            </div>
          </div>

          {/* Why Optimization Matters */}
          <div className="game-container p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Why Docker Layer Optimization Matters</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ Bad Order (Slow)</h3>
                <div className="text-sm text-red-700 space-y-1">
                  <div>1. COPY . . (copies everything)</div>
                  <div>2. RUN pip install (installs deps)</div>
                  <div className="font-semibold">→ Every code change rebuilds dependencies!</div>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ Good Order (Fast)</h3>
                <div className="text-sm text-green-700 space-y-1">
                  <div>1. COPY requirements.txt (copies deps list)</div>
                  <div>2. RUN pip install (installs deps)</div>
                  <div>3. COPY . . (copies code)</div>
                  <div className="font-semibold">→ Code changes don't rebuild dependencies!</div>
                </div>
              </div>
            </div>
          </div>

          {/* Build Metrics */}
          <div className="game-container p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Build Performance</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${buildTime <= (difficultySettings.targetTime || 30) ? 'text-green-600' : 'text-red-600'}`}>
                  {buildTime}s
                </div>
                <div className="text-sm text-gray-600">Build Time</div>
                <div className="text-xs text-gray-500">Target: {difficultySettings.targetTime || 30}s</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${imageSize <= (difficultySettings.targetSize || 400) ? 'text-green-600' : 'text-red-600'}`}>
                  {imageSize}MB
                </div>
                <div className="text-sm text-gray-600">Image Size</div>
                <div className="text-xs text-gray-500">Target: {difficultySettings.targetSize || 400}MB</div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Side - Available Instructions */}
            <div className="space-y-6">
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Instructions</h2>
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence>
                    {availableInstructions.map((instruction) => (
                      <motion.div
                        key={instruction.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <DraggableInstruction instruction={instruction} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {availableInstructions.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p>All instructions have been placed!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Dockerfile Builder */}
            <div className="space-y-6">
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Optimized Dockerfile</h2>
                <div className="space-y-3">
                  {droppedInstructions.map((instruction, index) => (
                    <DropSlot
                      key={index}
                      index={index}
                      instruction={instruction}
                      onDrop={handleDrop}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setShowOptimizations(!showOptimizations)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {showOptimizations ? 'Hide' : 'Show'} Optimizations
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit Optimization
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

          {/* Optimization Panel */}
          {showOptimizations && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="game-container p-6 mt-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Apply Optimizations</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: '--no-cache-dir', desc: 'Reduces image size by not caching pip downloads' },
                  { name: '--no-install-recommends', desc: 'Skips recommended packages to reduce size' },
                  { name: 'multi-stage build', desc: 'Uses multiple stages to reduce final image size' },
                  { name: '.dockerignore', desc: 'Excludes unnecessary files from build context' }
                ].map((optimization) => (
                  <button
                    key={optimization.name}
                    onClick={() => applyOptimization(optimization.name)}
                    disabled={appliedOptimizations.includes(optimization.name)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      appliedOptimizations.includes(optimization.name)
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold">{optimization.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{optimization.desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

export default CacheCrash