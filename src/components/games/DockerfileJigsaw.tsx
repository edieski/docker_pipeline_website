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

interface DropZoneProps {
  onDrop: (item: DockerBlock, index: number) => void
  blocks: (DockerBlock | null)[]
}

const DropZone: React.FC<DropZoneProps> = ({ onDrop, blocks }) => {
  const [{ isOver }, drop] = useDrop({
    accept: 'docker-block',
    drop: (item: DockerBlock, monitor) => {
      const clientOffset = monitor.getClientOffset()
      if (!clientOffset) return
      
      // Calculate which slot was dropped on based on mouse position
      const rect = (monitor.getDropResult() as any)?.getBoundingClientRect?.()
      if (!rect) return
      
      const x = clientOffset.x - rect.left
      const slotWidth = rect.width / blocks.length
      const index = Math.floor(x / slotWidth)
      
      onDrop(item, Math.min(index, blocks.length - 1))
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div
      ref={drop}
      className={`drop-zone ${isOver ? 'drag-over' : ''}`}
      style={{ minHeight: '400px' }}
    >
      <div className="grid grid-cols-1 gap-2">
        {blocks.map((block, index) => (
          <div
            key={index}
            className="min-h-12 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center p-2"
          >
            {block ? (
              <div className="docker-block w-full text-center">
                {block.content}
              </div>
            ) : (
              <span className="text-gray-400 text-sm">Drop Docker directive here</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface DraggableBlockProps {
  block: DockerBlock
  onRemove?: () => void
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block, onRemove }) => {
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
      className={`docker-block ${isDragging ? 'opacity-50' : ''} cursor-grab`}
      onClick={onRemove}
    >
      {block.content}
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
    
    // Game started
  }, [mission, player])

  const handleDrop = (item: DockerBlock, index: number) => {
    setDroppedBlocks(prev => {
      const newBlocks = [...prev]
      newBlocks[index] = item
      return newBlocks
    })
    
    setAvailableBlocks(prev => prev.filter(block => block.id !== item.id))
  }


  const validateDockerfile = () => {
    const requiredOrder = mission.validation?.requiredOrder || []
    const currentOrder = droppedBlocks
      .filter(block => block !== null)
      .map(block => block!.content)
    
    // Check if all required directives are present and in correct order
    let score = 0
    let correctCount = 0
    
    for (let i = 0; i < Math.min(requiredOrder.length, currentOrder.length); i++) {
      if (currentOrder[i]?.includes(requiredOrder[i])) {
        correctCount++
        score += 20
      }
    }
    
    // Bonus points for having all blocks
    if (droppedBlocks.every(block => block !== null)) {
      score += 20
    }
    
    return { score, correctCount, total: requiredOrder.length }
  }

  const handleSubmit = () => {
    const validation = validateDockerfile()
    const timeSpent = Date.now() - startTime
    
    updateMissionProgress(1, {
      completed: validation.correctCount === validation.total,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.correctCount === validation.total) {
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
            {validation.correctCount === validation.total ? '🎉' : '😅'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.correctCount === validation.total ? 'Mission Complete!' : 'Good Try!'}
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
          
          {validation.correctCount === validation.total ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Perfect! You've mastered Dockerfile basics. You understand how to structure container builds.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Close! The correct order is: FROM → WORKDIR → COPY requirements.txt → RUN pip install → COPY . → CMD
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

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Game Area */}
            <div className="space-y-6">
              {/* Available Blocks */}
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Directives</h2>
                <div className="grid grid-cols-1 gap-2">
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
              </div>

              {/* Drop Zone */}
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Dockerfile</h2>
                <DropZone onDrop={handleDrop} blocks={droppedBlocks} />
                
                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {showValidation ? 'Hide' : 'Show'} Validation
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

            {/* Concept Card */}
            <div>
              <ConceptCard
                teaching={mission.teaching}
                difficulty={player.difficulty}
                onHintUsed={handleHintUsed}
              />
            </div>
          </div>

          {/* Validation Help */}
          {showValidation && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="game-container p-6 mt-6"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-4">Correct Order Hint</h3>
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
