import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import missionsData from '../../missions.json'

interface DockerInstruction {
  id: string
  content: string
  type: 'instruction'
  optimized?: boolean
}

interface DropZoneProps {
  onDrop: (item: DockerInstruction, index: number) => void
  instructions: (DockerInstruction | null)[]
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop, instructions }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'docker-instruction',
    drop: (item: DockerInstruction, monitor) => {
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return
      
      const rect = (monitor.getDropResult() as any)?.getBoundingClientRect?.()
      if (!rect) return
      
      const x = clientOffset.x - rect.left
      const slotWidth = rect.width / instructions.length
      const index = Math.floor(x / slotWidth)
      
      onDrop(item, Math.min(index, instructions.length - 1))
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div
      ref={drop}
      className={`drop-zone ${isOver ? 'drag-over' : ''}`}
      style={{ minHeight: '300px' }}
    >
      <div className="grid grid-cols-1 gap-2">
        {instructions.map((instruction, index) => (
          <div
            key={index}
            className="min-h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-2"
          >
            {instruction ? (
              <div className={`docker-instruction w-full text-center ${instruction.optimized ? 'bg-green-100 border-green-300' : ''}`}>
                {instruction.content}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Drop Docker instruction here</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface DraggableInstructionProps {
  instruction: DockerInstruction
  onRemove?: () => void
}

const DraggableInstruction: React.FC<DraggableInstructionProps> = ({ instruction, onRemove }) => {
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
      className={`docker-instruction ${isDragging ? 'opacity-50' : ''} cursor-grab ${instruction.optimized ? 'bg-green-100 border-green-300' : ''}`}
      onClick={onRemove}
    >
      {instruction.content}
    </div>
  )
}

const CacheCrash: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [availableInstructions, setAvailableInstructions] = useState<DockerInstruction[]>([])
  const [droppedInstructions, setDroppedInstructions] = useState<(DockerInstruction | null)[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
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
    // Initialize game based on difficulty
    const allInstructions = (mission.validation?.instructions || []).map((content, index) => ({
      id: `instruction-${index}`,
      content,
      type: 'instruction' as const,
      optimized: false
    }))
    
    // Shuffle instructions for the puzzle
    const shuffled = [...allInstructions].sort(() => Math.random() - 0.5)
    setAvailableInstructions(shuffled)
    
    // Initialize empty drop zones
    setDroppedInstructions(new Array(allInstructions.length).fill(null))
    
    // Set initial build metrics
    setBuildTime(45)
    setImageSize(450)
  }, [mission, player])

  const handleDrop = (item: DockerInstruction, index: number) => {
    setDroppedInstructions(prev => {
      const newInstructions = [...prev]
      newInstructions[index] = item
      return newInstructions
    })
    
    setAvailableInstructions(prev => prev.filter(instruction => instruction.id !== item.id))
  }

  const applyOptimization = (optimization: string) => {
    if (appliedOptimizations.includes(optimization)) return
    
    setAppliedOptimizations(prev => [...prev, optimization])
    
    // Update build metrics based on optimization
    switch (optimization) {
      case '--no-cache-dir':
        setBuildTime(prev => Math.max(prev - 5, 15))
        setImageSize(prev => Math.max(prev - 20, 200))
        break
      case '--no-install-recommends':
        setBuildTime(prev => Math.max(prev - 3, 15))
        setImageSize(prev => Math.max(prev - 15, 200))
        break
      case 'multi-stage build':
        setBuildTime(prev => Math.max(prev - 8, 15))
        setImageSize(prev => Math.max(prev - 50, 200))
        break
      case '.dockerignore':
        setBuildTime(prev => Math.max(prev - 2, 15))
        setImageSize(prev => Math.max(prev - 10, 200))
        break
    }
  }

  const validateOptimization = () => {
    const instructions = droppedInstructions.filter(inst => inst !== null) as DockerInstruction[]
    
    // Check for proper layer ordering (dependencies before code)
    let score = 0
    let correctOrder = 0
    
    const hasRequirementsFirst = instructions.some(inst => 
      inst.content.includes('COPY requirements.txt') && 
      instructions.indexOf(inst) < instructions.findIndex(i => i.content.includes('COPY . .'))
    )
    
    const hasDependenciesBeforeCode = instructions.some(inst => 
      inst.content.includes('RUN pip install') && 
      instructions.indexOf(inst) < instructions.findIndex(i => i.content.includes('COPY . .'))
    )
    
    if (hasRequirementsFirst) {
      correctOrder++
      score += 25
    }
    
    if (hasDependenciesBeforeCode) {
      correctOrder++
      score += 25
    }
    
    // Check optimization flags
    const optimizationScore = appliedOptimizations.length * 10
    score += optimizationScore
    
    // Check if targets are met
    const targetSize = difficultySettings.targetSize
    const targetTime = difficultySettings.targetTime
    
    if (imageSize <= (targetSize || 400)) {
      score += 20
    }
    
    if (buildTime <= (targetTime || 30)) {
      score += 20
    }
    
    return { 
      score: Math.min(score, 100), 
      correctOrder, 
      total: 2,
      targetsMet: imageSize <= targetSize && buildTime <= targetTime
    }
  }

  const handleSubmit = () => {
    const validation = validateOptimization()
    const timeSpent = Date.now() - startTime
    
    updateMissionProgress(2, {
      completed: validation.targetsMet && validation.correctOrder === validation.total,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.targetsMet && validation.correctOrder === validation.total) {
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
    const validation = validateOptimization()
    
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
                <div className="text-2xl font-bold text-purple-600">{Math.round((Date.now() - startTime) / 60000)}min</div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
                <div className="text-sm text-gray-600">Hints Used</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Build Metrics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className={`text-xl font-bold ${buildTime <= (difficultySettings.targetTime || 30) ? 'text-green-600' : 'text-red-600'}`}>
                  {buildTime}s
                </div>
                <div className="text-sm text-gray-600">Build Time (target: {difficultySettings.targetTime || 30}s)</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${imageSize <= (difficultySettings.targetSize || 400) ? 'text-green-600' : 'text-red-600'}`}>
                  {imageSize}MB
                </div>
                <div className="text-sm text-gray-600">Image Size (target: {difficultySettings.targetSize || 400}MB)</div>
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
                💡 Close! Remember: copy dependencies first, then your code. Use optimization flags to reduce build time and image size.
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
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="game-container p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  ⚡ Mission 2: Cache Crash
                </h1>
                <p className="text-gray-600">
                  Optimize your Dockerfile for faster builds and smaller images
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Hints Used</div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
              </div>
            </div>
          </div>

          {/* Build Metrics */}
          <div className="game-container p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Build Metrics</h2>
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

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Game Area */}
            <div className="space-y-6">
              {/* Available Instructions */}
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Instructions</h2>
                <div className="grid grid-cols-1 gap-2">
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
              </div>

              {/* Drop Zone */}
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Optimized Dockerfile</h2>
                <DropZone onDrop={handleDrop} instructions={droppedInstructions} />
                
                <div className="mt-4 flex justify-between">
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

            {/* Concept Card */}
            <div>
              <ConceptCard
                teaching={mission.teaching}
                difficulty={player.difficulty}
                onHintUsed={handleHintUsed}
              />
            </div>
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
                {(mission.validation?.optimizations || []).map((optimization) => (
                  <button
                    key={optimization}
                    onClick={() => applyOptimization(optimization)}
                    disabled={appliedOptimizations.includes(optimization)}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      appliedOptimizations.includes(optimization)
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold">{optimization}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {optimization === '--no-cache-dir' && 'Reduces image size by not caching pip downloads'}
                      {optimization === '--no-install-recommends' && 'Skips recommended packages to reduce size'}
                      {optimization === 'multi-stage build' && 'Uses multiple stages to reduce final image size'}
                      {optimization === '.dockerignore' && 'Excludes unnecessary files from build context'}
                    </div>
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
