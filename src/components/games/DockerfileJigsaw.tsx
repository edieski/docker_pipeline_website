import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import missionsData from '../../missions.json'

interface DockerBlock {
  id: string
  content: string
  type: 'directive'
}

interface DropSlotProps {
  index: number
  block: DockerBlock | null
  onDrop: (item: DockerBlock, index: number) => void
  onRemove: (index: number) => void
}

const DropSlot: React.FC<DropSlotProps> = ({ index, block, onDrop, onRemove }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'docker-block',
    drop: (item: DockerBlock) => {
      onDrop(item, index)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div
      ref={drop}
      className={`min-h-16 border-2 border-dashed rounded-lg flex items-center justify-center p-3 transition-all duration-200 ${
        isOver 
          ? 'border-blue-500 bg-blue-50 scale-105' 
          : block 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      }`}
    >
      {block ? (
        <div className="flex items-center justify-between w-full">
          <div className="text-sm font-mono text-gray-800 flex-1 text-center">
            {block.content}
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
        <span className="text-gray-400 text-sm">
          Drop instruction {index + 1} here
        </span>
      )}
    </div>
  )
}

interface DraggableBlockProps {
  block: DockerBlock
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'docker-block',
    item: block,
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
      <div className="text-sm font-mono text-gray-800 text-center">
        {block.content}
      </div>
    </div>
  )
}

const DockerfileJigsaw: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [availableBlocks, setAvailableBlocks] = useState<DockerBlock[]>([])
  const [droppedBlocks, setDroppedBlocks] = useState<(DockerBlock | null)[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [showValidation, setShowValidation] = useState(false)

  const mission = missionsData.missions.find(m => m.id === 1)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  useEffect(() => {
    // Initialize game based on difficulty
    const allBlocks = (mission.validation?.blocks || []).map((content, index) => ({
      id: `block-${index}`,
      content,
      type: 'directive' as const
    }))
    
    // Shuffle blocks for the puzzle
    const shuffled = [...allBlocks].sort(() => Math.random() - 0.5)
    setAvailableBlocks(shuffled)
    
    // Initialize empty drop zones
    const requiredOrder = mission.validation?.requiredOrder || []
    setDroppedBlocks(new Array(requiredOrder.length).fill(null))
  }, [mission, player])

  const handleDrop = (item: DockerBlock, index: number) => {
    // Remove from available blocks
    setAvailableBlocks(prev => prev.filter(block => block.id !== item.id))
    
    // Add to dropped blocks
    setDroppedBlocks(prev => {
      const newBlocks = [...prev]
      newBlocks[index] = item
      return newBlocks
    })
  }

  const handleRemove = (index: number) => {
    const blockToRemove = droppedBlocks[index]
    if (!blockToRemove) return
    
    // Add back to available blocks
    setAvailableBlocks(prev => [...prev, blockToRemove])
    
    // Remove from dropped blocks
    setDroppedBlocks(prev => {
      const newBlocks = [...prev]
      newBlocks[index] = null
      return newBlocks
    })
  }

  const validateDockerfile = () => {
    const requiredOrder = mission.validation?.requiredOrder || []
    // Keep positional alignment; do not compress by filtering nulls
    const currentOrder = droppedBlocks.map(block => block ? block.content : null)
    // Map directive keywords to their required position
    const directiveToIndex = new Map<string, number>()
    // Normalization to avoid false negatives (case/extra spaces)
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toUpperCase()
    requiredOrder.forEach((directive, idx) => directiveToIndex.set(normalize(directive), idx))
    
    let score = 0
    let feedback: string[] = []
    let correctCount = 0
    
    // Check each position
    for (let i = 0; i < requiredOrder.length; i++) {
      const required = requiredOrder[i]
      const placed = currentOrder[i]
      if (placed) {
        // Identify which directive this placed line corresponds to
        const placedNorm = normalize(placed)
        const matchedDirective = requiredOrder.find(dir => placedNorm.includes(normalize(dir)))
        if (!matchedDirective) {
          feedback.push(`❌ Step ${i + 1}: Unrecognized instruction "${placed}"`)
        } else {
          const expectedIndex = directiveToIndex.get(normalize(matchedDirective))!
          if (expectedIndex === i) {
            correctCount++
            score += 20
            feedback.push(`✅ Step ${i + 1}: Correct! "${placed}"`)
          } else {
            feedback.push(`❌ Step ${i + 1}: Expected "${required}", got "${placed}"`)
          }
        }
      } else {
        feedback.push(`❌ Step ${i + 1}: Missing "${required}"`)
      }
    }
    
    // Check for extra blocks
    const extraBlocks = droppedBlocks.filter((b) => b !== null).length - requiredOrder.length
    if (extraBlocks > 0) {
      feedback.push(`⚠️ You have ${extraBlocks} extra block(s)`)
    }
    
    // Bonus points for having all blocks
    if (droppedBlocks.every(block => block !== null)) {
      score += 10
      feedback.push(`✅ All slots filled!`)
    }
    
    // Provide hints for common mistakes
    if (correctCount === 0) {
      feedback.push(`💡 Hint: Start with FROM (base image), then COPY (files), then RUN (commands)`)
    } else if (correctCount < requiredOrder.length / 2) {
      feedback.push(`💡 Hint: Remember the order: FROM → COPY → RUN → EXPOSE → CMD`)
    }
    
    return { 
      score: Math.max(0, Math.min(100, score)), 
      correctCount, 
      total: requiredOrder.length,
      feedback,
      success: correctCount === requiredOrder.length && droppedBlocks.every(block => block !== null)
    }
  }

  const handleSubmit = () => {
    const validation = validateDockerfile()
    const timeSpent = Date.now() - startTime
    
    updateMissionProgress(1, {
      completed: validation.success,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.success) {
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
    const validation = validateDockerfile()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">
            {validation.success ? '🎉' : '😅'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.success ? 'Mission Complete!' : 'Good Try!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{validation.correctCount}/{validation.total}</div>
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
          
          {/* Detailed Feedback */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Dockerfile Feedback</h3>
            <div className="space-y-2">
              {validation.feedback.map((item, index) => (
                <div key={index} className="text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          {validation.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Perfect! You've mastered Dockerfile basics. You understand how to structure container builds.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Review the feedback above to improve your Dockerfile. Remember: FROM → COPY → RUN → EXPOSE → CMD
              </p>
            </div>
          )}
          
          <div className="flex space-x-4 justify-center">
            {!validation.success && (
              <button
                onClick={() => setGameCompleted(false)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={handleNextMission}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {validation.success ? 'Continue to Mission Select' : 'Skip to Mission Select'}
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
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  🧩 Mission 1: Dockerfile Jigsaw
                </h1>
                <p className="text-gray-600">
                  Drag and drop the Docker directives to build a valid Dockerfile
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Hints Used</div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Side - Available Commands */}
            <div className="space-y-6">
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Docker Commands</h2>
                <div className="grid grid-cols-1 gap-3">
                  <AnimatePresence>
                    {availableBlocks.map((block) => (
                      <motion.div
                        key={block.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <DraggableBlock block={block} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                
                {availableBlocks.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <div className="text-4xl mb-2">✅</div>
                    <p>All commands have been placed!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Dockerfile Builder */}
            <div className="space-y-6">
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Dockerfile</h2>
                <div className="space-y-3">
                  {droppedBlocks.map((block, index) => (
                    <DropSlot
                      key={index}
                      index={index}
                      block={block}
                      onDrop={handleDrop}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {showValidation ? 'Hide' : 'Show'} Correct Order
                  </button>
                  
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit Dockerfile
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

          {/* Validation Help */}
          {showValidation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="game-container p-6 mt-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Correct Dockerfile Order</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 mb-2">The correct order should be:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  {(mission.validation?.requiredOrder || []).map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DndProvider>
  )
}

export default DockerfileJigsaw