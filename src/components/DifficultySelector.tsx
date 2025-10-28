import React, { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const DifficultySelector: React.FC = () => {
  const { createPlayer, setDifficulty } = useGameStore()
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner')

  // Inject CSS animations directly
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes gradientShift {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
        50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); }
      }
    `
    document.head.appendChild(style)
    return () => { document.head.removeChild(style) }
  }, [])

  const handleStartGame = () => {
    if (!playerName.trim()) return
    setDifficulty(selectedDifficulty)
    createPlayer(playerName.trim())
    navigate('/')
  }

  const difficulties = [
    {
      level: 'beginner' as const,
      title: 'Beginner',
      description: 'New to Docker & CI/CD',
      features: ['More hints available', 'Simplified challenges', 'Step-by-step guidance'],
      color: 'bg-green-500'
    },
    {
      level: 'intermediate' as const,
      title: 'Intermediate',
      description: 'Some Docker experience',
      features: ['Moderate hints', 'Standard challenges', 'Real-world scenarios'],
      color: 'bg-yellow-500'
    },
    {
      level: 'advanced' as const,
      title: 'Advanced',
      description: 'Experienced with DevOps',
      features: ['Minimal hints', 'Complex challenges', 'Production-level problems'],
      color: 'bg-red-500'
    }
  ]

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'radial-gradient(1200px 600px at 20% 20%, rgba(59,130,246,0.18), transparent), radial-gradient(1000px 500px at 80% 0%, rgba(168,85,247,0.18), transparent), linear-gradient(135deg, #0f172a, #1e293b 30%, #0ea5e9 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 18s ease infinite'
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full"
        style={{ position: 'relative' }}
      >
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'radial-gradient(circle, rgba(59,130,246,0.2), transparent 60%)' }} />
          <div style={{ position: 'absolute', bottom: -40, left: -40, width: 260, height: 260, background: 'radial-gradient(circle, rgba(168,85,247,0.2), transparent 60%)' }} />
        </div>
        <div className="game-container w-full p-10" style={{ background: 'rgba(255,255,255,0.9)', borderRadius: 28 }}>
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="float-animation mb-6"
            style={{
              animation: 'float 3s ease-in-out infinite'
            }}
          >
            <div className="text-8xl mb-4" style={{ fontSize: '6rem' }}>🚀</div>
          </motion.div>
          <motion.h1
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold mb-4"
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '3rem',
              fontWeight: 'bold'
            }}
          >
            Operation Deploy the Python
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-semibold text-gray-700 mb-3"
          >
            DevOps Escape Room Adventure
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed"
          >
            You're a solo DevOps engineer racing to fix and deploy a broken FastAPI app before the product launch.
            Complete all 6 missions to save the day!
          </motion.p>
        </div>

        {/* Player Name Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-10"
        >
          <label htmlFor="playerName" className="block text-xl font-bold text-gray-800 mb-4">
            What's your name, engineer? 👨‍💻
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-xl font-medium transition-all duration-300 bg-white/80 backdrop-blur-sm"
            maxLength={20}
          />
        </motion.div>

        {/* Difficulty Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Choose Your Challenge Level 🎯
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {difficulties.map((difficulty, index) => (
              <motion.div
                key={difficulty.level}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative cursor-pointer rounded-2xl p-8 border-2 transition-all duration-300 ${
                  selectedDifficulty === difficulty.level
                    ? 'border-blue-500'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  background: selectedDifficulty === difficulty.level 
                    ? 'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(139,92,246,0.12))'
                    : 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: selectedDifficulty === difficulty.level
                    ? '0 25px 50px rgba(59,130,246,0.22)'
                    : '0 10px 25px rgba(0,0,0,0.08)'
                }}
                onClick={() => setSelectedDifficulty(difficulty.level)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-6 h-6 rounded-full ${difficulty.color} shadow-lg`}></div>
                </div>
                {selectedDifficulty === difficulty.level && (
                  <div className="absolute top-3 right-3 w-7 h-7 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-white">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  {difficulty.title}
                </h3>
                <p className="text-gray-600 mb-6 text-lg">
                  {difficulty.description}
                </p>
                <ul className="space-y-3">
                  {difficulty.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-gray-600 flex items-center">
                      <span className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="text-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartGame}
            disabled={!playerName.trim()}
            className={`px-12 py-6 rounded-2xl text-2xl font-bold transition-all duration-300 ${
              playerName.trim()
                ? 'text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            style={playerName.trim() ? {
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6, #ec4899)',
              boxShadow: '0 25px 50px rgba(59,130,246,0.25)',
              animation: 'glow 2s ease-in-out infinite'
            } : {}}
          >
            🚀 Launch Mission
          </motion.button>
        </motion.div>
        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-12 text-center text-gray-600"
        >
          <div className="flex justify-center items-center space-x-8 text-sm">
            <div className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              <span>Estimated time: 30-45 min</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              <span>Auto-save enabled</span>
            </div>
            <div className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
              <span>6 missions total</span>
            </div>
          </div>
        </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

export default DifficultySelector
