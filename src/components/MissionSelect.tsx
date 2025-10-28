import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import missionsData from '../missions.json'

const MissionSelect: React.FC = () => {
  const navigate = useNavigate()
  const { player, generateProgressToken } = useGameStore()

  if (!player) {
    navigate('/')
    return null
  }

  const missions = missionsData.missions

  const getMissionStatus = (missionId: number) => {
    const progress = player.progress.find((p: any) => p.missionId === missionId)
    if (progress?.completed) return 'completed'
    if (missionId <= player.currentMission) return 'unlocked'
    return 'locked'
  }

  const handleMissionClick = (missionId: number) => {
    const status = getMissionStatus(missionId)
    if (status === 'locked') return
    
    // Navigate to intro screen first
    navigate(`/intro/${missionId}`)
  }

  const handleShareProgress = () => {
    const token = generateProgressToken()
    navigator.clipboard.writeText(token)
    alert('Progress token copied to clipboard! Share this with your instructor.')
  }

  const completedMissions = player.progress.filter((p: any) => p.completed).length
  const totalTimeSpent = Math.round(player.totalTimeSpent / 60) // Convert to minutes

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-container p-6 mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                Welcome back, {player.name}! 👋
              </h1>
              <p className="text-gray-600">
                Difficulty: <span className="font-semibold capitalize">{player.difficulty}</span>
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {completedMissions}/6 missions
              </div>
              <div className="text-sm text-gray-500">
                {totalTimeSpent} minutes played
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="game-container p-6 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">Mission Progress</h2>
          <div className="grid grid-cols-6 gap-4">
            {missions.map((mission) => {
              const status = getMissionStatus(mission.id)
              const progress = player.progress.find((p: any) => p.missionId === mission.id)
              
              return (
                <div
                  key={mission.id}
                  className={`text-center p-3 rounded-lg border-2 ${
                    status === 'completed'
                      ? 'border-green-500 bg-green-50'
                      : status === 'unlocked'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="text-2xl mb-2">
                    {status === 'completed' ? '✅' : status === 'unlocked' ? '🔓' : '🔒'}
                  </div>
                  <div className="text-sm font-semibold text-gray-700">
                    Mission {mission.id}
                  </div>
                  {progress && (
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.round(progress.timeSpent / 60)}min
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Mission Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {missions.map((mission, index) => {
            const status = getMissionStatus(mission.id)
            const progress = player.progress.find((p: any) => p.missionId === mission.id)
            
            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`mission-card p-6 rounded-xl border-2 cursor-pointer ${
                  status === 'completed'
                    ? 'border-green-500 bg-green-50'
                    : status === 'unlocked'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50'
                } ${status === 'locked' ? 'locked' : ''}`}
                onClick={() => handleMissionClick(mission.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">
                    {status === 'completed' ? '✅' : status === 'unlocked' ? '🔓' : '🔒'}
                  </div>
                  <div className="text-sm font-semibold text-gray-600">
                    Mission {mission.id}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {mission.title}
                </h3>
                
                <p className="text-gray-600 mb-4">
                  {mission.description}
                </p>

                {progress && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-semibold">{Math.round(progress.timeSpent / 60)}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hints:</span>
                      <span className="font-semibold">{progress.hintsUsed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Score:</span>
                      <span className="font-semibold">{progress.score}/100</span>
                    </div>
                  </div>
                )}

                {status === 'locked' && (
                  <div className="text-center text-gray-500 text-sm mt-4">
                    Complete previous missions to unlock
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center gap-4 mt-8"
        >
          <button
            onClick={handleShareProgress}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            📤 Share Progress
          </button>
          <button
            onClick={() => navigate('/instructor')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            👨‍🏫 Instructor View
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default MissionSelect
