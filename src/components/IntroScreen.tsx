import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import missionsData from '../missions.json'

const IntroScreen: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>()
  const navigate = useNavigate()
  
  const mission = missionsData.missions.find(m => m.id === parseInt(missionId || '0'))
  
  if (!mission) {
    navigate('/')
    return null
  }

  const handleStartGame = () => {
    navigate(`/game/${mission.id}`)
  }

  const handleTestNavigation = () => {
    console.log('Test navigation clicked!')
    alert('Test navigation working!')
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="game-container max-w-4xl w-full p-8"
      >
        {/* Mission Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-6xl mb-4"
          >
            {mission.id === 1 && '🧩'}
            {mission.id === 2 && '⚡'}
            {mission.id === 3 && '⚙️'}
            {mission.id === 4 && '🔍'}
            {mission.id === 5 && '🚀'}
            {mission.id === 6 && '💥'}
          </motion.div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Mission {mission.id}: {mission.title}
          </h1>
          <p className="text-xl text-gray-600">
            {mission.description}
          </p>
        </div>

        {/* Learning Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-50 rounded-xl p-6 mb-8"
        >
          <div className="mb-6 bg-white rounded-lg p-4 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-blue-800 mb-2">
              🎯 Purpose
            </h2>
            <p className="text-blue-700">{mission.intro.purpose}</p>
          </div>
          <h2 className="text-2xl font-bold text-blue-800 mb-4 text-center">
            🎯 What You'll Learn
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">What is this?</h3>
              <p className="text-blue-600">{mission.intro.what}</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">Why do we need it?</h3>
              <p className="text-blue-600">{mission.intro.why}</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">Where does it live?</h3>
              <p className="text-blue-600">{mission.intro.where}</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700 mb-2">How do you use it?</h3>
              <p className="text-blue-600">{mission.intro.how}</p>
            </div>
          </div>
        </motion.div>

        {/* Real-World Scenarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-green-50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-green-800 mb-4 text-center">
            🌍 Real-World Scenarios
          </h2>
          <div className="space-y-4">
            {mission.realWorld.scenarios.map((scenario, index) => (
              <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                <div className="font-semibold text-green-700 mb-2">
                  Situation: {scenario.situation}
                </div>
                <div className="text-green-600 mb-2">
                  Solution: {scenario.solution}
                </div>
                <div className="text-sm text-green-500">
                  Daily Use: {scenario.dailyUse}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mission Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            📊 Mission Stats
          </h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {mission.difficulty.beginner.hints}
              </div>
              <div className="text-sm text-gray-600">Hints Available</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {mission.id === 1 && '8-12'}
                {mission.id === 2 && '6-8'}
                {mission.id === 3 && '4-6'}
                {mission.id === 4 && '3-5'}
                {mission.id === 5 && '6-10'}
                {mission.id === 6 && '5-8'}
              </div>
              <div className="text-sm text-gray-600">Minutes Est.</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {mission.id === 1 && 'Drag & Drop'}
                {mission.id === 2 && 'Optimization'}
                {mission.id === 3 && 'Visual Design'}
                {mission.id === 4 && 'Log Analysis'}
                {mission.id === 5 && 'Form Config'}
                {mission.id === 6 && 'Decision Tree'}
              </div>
              <div className="text-sm text-gray-600">Game Type</div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div
          className="flex justify-center gap-4"
          style={{ position: 'relative', zIndex: 20 }}
        >
          <p style={{ color: 'red', fontSize: '12px' }}>DEBUG: Buttons should be visible below</p>
          <button
            onClick={handleTestNavigation}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🧪 Test Navigation
          </button>
          <button
            onClick={handleStartGame}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-bold text-lg"
            style={{ 
              cursor: 'pointer', 
              pointerEvents: 'auto',
              position: 'relative',
              zIndex: 10
            }}
          >
            🎮 Start Mission
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>💡 Tip: Take your time to understand each concept - there's no rush!</p>
        </div>
      </motion.div>
    </div>
  )
}

export default IntroScreen
