import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useGameStore, Player } from '../store/gameStore'

const InstructorDashboard: React.FC = () => {
  const { parseProgressToken, generateProgressToken, setDifficulty, difficulty } = useGameStore()
  const [trackedPlayers, setTrackedPlayers] = useState<Player[]>([])
  const [tokenInput, setTokenInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)

  const handleAddPlayer = () => {
    if (!tokenInput.trim()) return

    const tokenData = parseProgressToken(tokenInput.trim())
    if (tokenData) {
      // Map available fields from token
      const completedMissions: number[] = Array.isArray((tokenData as any).completedMissions)
        ? (tokenData as any).completedMissions
        : []
      const difficulty = (tokenData as any).difficulty || 'beginner'
      const timeSpent = typeof (tokenData as any).timeSpent === 'number' ? (tokenData as any).timeSpent : 0

      const progress = completedMissions.map((mid) => ({
        missionId: mid,
        completed: true,
        timeSpent: 0,
        hintsUsed: 0,
        score: 0
      }))

      const nextMission = completedMissions.length > 0
        ? Math.min(Math.max(...completedMissions) + 1, 6)
        : 1

      const player: Player = {
        id: (tokenData as any).playerId,
        name: nameInput.trim() || `Player ${((tokenData as any).playerId || 'xxxxxx').slice(0, 6)}`,
        difficulty,
        currentMission: nextMission,
        progress,
        totalTimeSpent: timeSpent
      }
      
      setTrackedPlayers(prev => {
        // Update existing player or add new one
        const existingIndex = prev.findIndex(p => p.id === player.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = player
          return updated
        } else {
          return [...prev, player]
        }
      })
      setTokenInput('')
      setNameInput('')
      setShowAddForm(false)
    } else {
      alert('Invalid progress token. Please check and try again.')
    }
  }

  const handleGenerateTestToken = () => {
    const token = generateProgressToken()
    setTokenInput(token)
    setShowAddForm(true)
  }

  const handleRemovePlayer = (playerId: string) => {
    setTrackedPlayers(prev => prev.filter(p => p.id !== playerId))
  }

  const handleRenamePlayer = (playerId: string, newName: string) => {
    setTrackedPlayers(prev => prev.map(p => p.id === playerId ? { ...p, name: newName } : p))
  }

  const exportProgress = () => {
    const csvData = trackedPlayers.map(player => ({
      name: player.name,
      difficulty: player.difficulty,
      currentMission: player.currentMission,
      completedMissions: player.progress.filter((p: any) => p.completed).length,
      totalTimeSpent: Math.round(player.totalTimeSpent / 60),
      totalHintsUsed: 0, // Default since not available
      createdAt: new Date().toISOString()
    }))

    const csvContent = [
      'Name,Difficulty,Current Mission,Completed Missions,Time Spent (min),Hints Used,Created At',
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'devops-escape-room-progress.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const getMissionStatus = (player: Player, missionId: number) => {
    const progress = player.progress.find((p: any) => p.missionId === missionId)
    if (progress?.completed) return 'completed'
    if (missionId <= player.currentMission) return 'unlocked'
    return 'locked'
  }

  const getOverallProgress = (player: Player) => {
    const completed = player.progress.filter((p: any) => p.completed).length
    return Math.round((completed / 6) * 100)
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-container p-6 mb-6"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                👨‍🏫 Instructor Dashboard
              </h1>
              <p className="text-gray-600">
                Track student progress in real-time
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showAddForm ? 'Cancel' : '+ Add Player'}
              </button>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Test Difficulty:</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <button
                onClick={handleGenerateTestToken}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                🧪 Generate Sample Token
              </button>
              {trackedPlayers.length > 0 && (
                <button
                  onClick={exportProgress}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  📊 Export CSV
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Add Player Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Add Player Progress</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Player Name (optional)
                </label>
                <input
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter player's name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Progress Token
                </label>
                <textarea
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="Paste the progress token from a player..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleAddPlayer}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Player
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Players Overview */}
        {trackedPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Tracked Players ({trackedPlayers.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trackedPlayers.map((player) => (
                <div key={player.id} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <input
                        value={player.name}
                        onChange={(e) => handleRenamePlayer(player.id, e.target.value)}
                        placeholder="Player name"
                        className="font-bold text-gray-800 bg-transparent border-b border-gray-200 focus:outline-none focus:border-blue-400"
                      />
                      <p className="text-sm text-gray-600 capitalize">{player.difficulty}</p>
                    </div>
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-semibold">{getOverallProgress(player)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Current Mission:</span>
                      <span className="font-semibold">{player.currentMission}/6</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time Spent:</span>
                      <span className="font-semibold">{Math.round(player.totalTimeSpent / 60)}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Hints Used:</span>
                      <span className="font-semibold">{player.progress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Detailed Progress Grid */}
        {trackedPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Mission Progress Grid</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Player</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">M1</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">M2</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">M3</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">M4</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">M5</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700">M6</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {trackedPlayers.map((player) => (
                    <tr key={player.id} className="border-b border-gray-100">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-semibold text-gray-800">{player.name}</div>
                          <div className="text-sm text-gray-500 capitalize">{player.difficulty}</div>
                        </div>
                      </td>
                      {[1, 2, 3, 4, 5, 6].map((missionId) => {
                        const status = getMissionStatus(player, missionId)
                        return (
                          <td key={missionId} className="text-center py-3 px-2">
                            <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${
                              status === 'completed' 
                                ? 'bg-green-500 text-white' 
                                : status === 'unlocked'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {status === 'completed' ? '✓' : status === 'unlocked' ? '○' : '●'}
                            </div>
                          </td>
                        )
                      })}
                      <td className="text-center py-3 px-4">
                        <div className="font-semibold text-gray-800">
                          {getOverallProgress(player)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                  <span>Locked</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {trackedPlayers.length === 0 && !showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-12 text-center"
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Players Tracked Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Add players by pasting their progress tokens to start tracking their DevOps learning journey.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Player
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default InstructorDashboard
