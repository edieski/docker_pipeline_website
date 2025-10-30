import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Player, getAllPlayersFromSharedStorage, savePlayerToSharedStorage } from '../store/gameStore'

const InstructorDashboard: React.FC = () => {
  const [trackedPlayers, setTrackedPlayers] = useState<Player[]>([])
  const [lastUpdateTimes, setLastUpdateTimes] = useState<Record<string, number>>({})
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [importTokenText, setImportTokenText] = useState('')
  const [isAuthed, setIsAuthed] = useState<boolean>(() => {
    return localStorage.getItem('instructor-auth-ok') === 'true'
  })
  const [passwordInput, setPasswordInput] = useState('')

  const expectedPassword = (import.meta as any)?.env?.VITE_INSTRUCTOR_PASSWORD || 'DevOps!Workshop#2025'

  const loadPlayers = () => {
    const allPlayersData = getAllPlayersFromSharedStorage()
    const players: Player[] = []
    const updateTimes: Record<string, number> = {}
    
    Object.values(allPlayersData).forEach(({ player, lastUpdate }) => {
      players.push(player)
      updateTimes[player.id] = lastUpdate
    })
    
    // Sort by last update time (most recent first)
    players.sort((a, b) => {
      const timeA = updateTimes[a.id] || 0
      const timeB = updateTimes[b.id] || 0
      return timeB - timeA
    })
    
    setTrackedPlayers(players)
    setLastUpdateTimes(updateTimes)
  }

  // Load players on mount
  useEffect(() => {
    loadPlayers()
  }, [])

  // Auto-refresh every 2 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return
    
    const interval = setInterval(() => {
      loadPlayers()
    }, 2000)
    
    return () => clearInterval(interval)
  }, [autoRefresh])

  const handleRemovePlayer = (playerId: string) => {
    const allPlayersData = getAllPlayersFromSharedStorage()
    delete allPlayersData[playerId]
    localStorage.setItem('devops-escape-room-all-players', JSON.stringify(allPlayersData))
    loadPlayers()
  }

  const handleRenamePlayer = (playerId: string, newName: string) => {
    const allPlayersData = getAllPlayersFromSharedStorage()
    if (allPlayersData[playerId]) {
      allPlayersData[playerId].player.name = newName
      localStorage.setItem('devops-escape-room-all-players', JSON.stringify(allPlayersData))
      loadPlayers()
    }
  }

  const exportProgress = () => {
    const csvData = trackedPlayers.map(player => {
      const quizScores = player.progress.filter((p: any) => p.quizScore !== undefined).map((p: any) => p.quizScore)
      const avgQuizScore = quizScores.length > 0 
        ? Math.round(quizScores.reduce((sum: number, score: number) => sum + score, 0) / quizScores.length)
        : null
      const totalScore = player.progress.reduce((sum, p) => sum + (p.score || 0), 0)
      const avgScore = player.progress.length > 0 
        ? Math.round(totalScore / player.progress.length) 
        : 0
      
      // Build mission scores and quiz scores
      const missionScores = [1, 2, 3, 4, 5, 6].map(missionId => {
        const progress = player.progress.find((p: any) => p.missionId === missionId)
        return progress?.score || 0
      })
      const missionQuizScores = [1, 2, 3, 4, 5, 6].map(missionId => {
        const progress = player.progress.find((p: any) => p.missionId === missionId)
        return progress?.quizScore || ''
      })
      
      return {
        name: player.name,
        difficulty: player.difficulty,
        currentMission: player.currentMission,
        completedMissions: player.progress.filter((p: any) => p.completed).length,
        avgScore,
        avgQuizScore: avgQuizScore || '',
        mission1Score: missionScores[0],
        mission1Quiz: missionQuizScores[0],
        mission2Score: missionScores[1],
        mission2Quiz: missionQuizScores[1],
        mission3Score: missionScores[2],
        mission3Quiz: missionQuizScores[2],
        mission4Score: missionScores[3],
        mission4Quiz: missionQuizScores[3],
        mission5Score: missionScores[4],
        mission5Quiz: missionQuizScores[4],
        mission6Score: missionScores[5],
        mission6Quiz: missionQuizScores[5],
        totalTimeSpent: Math.round(player.totalTimeSpent / 60000),
        totalHintsUsed: player.progress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0),
        createdAt: new Date().toISOString()
      }
    })

    const csvContent = [
      'Name,Difficulty,Current Mission,Completed Missions,Avg Score,Avg Quiz %,M1 Score,M1 Quiz %,M2 Score,M2 Quiz %,M3 Score,M3 Quiz %,M4 Score,M4 Quiz %,M5 Score,M5 Quiz %,M6 Score,M6 Quiz %,Time Spent (min),Hints Used,Created At',
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

  const importToken = () => {
    try {
      const raw = atob(importTokenText.trim())
      const data = JSON.parse(raw)

      let player: Player | null = null
      if (data.player) {
        player = {
          id: data.player.id,
          name: data.player.name,
          difficulty: data.player.difficulty,
          currentMission: data.player.currentMission,
          progress: data.player.progress || [],
          totalTimeSpent: data.player.totalTimeSpent || 0
        }
      } else {
        player = {
          id: data.playerId,
          name: data.name || `Player ${String(data.playerId || '').slice(0,5)}`,
          difficulty: data.difficulty || 'beginner',
          currentMission: 1,
          progress: [],
          totalTimeSpent: data.timeSpent || 0
        }
      }

      if (!player?.id) throw new Error('Invalid token: missing player id')

      savePlayerToSharedStorage(player)
      setImportTokenText('')
      loadPlayers()
      alert(`Imported progress for ${player.name}`)
    } catch (e) {
      alert('Invalid token. Please check and try again.')
    }
  }

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="game-container max-w-md w-full p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Instructor Login</h1>
          <p className="text-gray-600 mb-4">Enter the instructor password to view the dashboard.</p>
          <div className="flex gap-2">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Password"
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={() => {
                if (passwordInput === expectedPassword) {
                  localStorage.setItem('instructor-auth-ok', 'true')
                  setIsAuthed(true)
                } else {
                  alert('Incorrect password')
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Enter
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">Tip: set VITE_INSTRUCTOR_PASSWORD in a .env file for production.</p>
        </div>
      </div>
    )
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
            <div className="flex gap-4 items-center">
              <button
                onClick={() => {
                  loadPlayers()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh
              </button>
              <div className="flex items-center gap-2">
                <input
                  value={importTokenText}
                  onChange={(e) => setImportTokenText(e.target.value)}
                  placeholder="Paste progress token"
                  className="w-64 px-2 py-2 border rounded"
                />
                <button
                  onClick={importToken}
                  className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                  Import
                </button>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Auto-refresh (2s)</span>
              </label>
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

        {/* Active Players Summary */}
        {trackedPlayers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-6 mb-6"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              👥 Active Players ({trackedPlayers.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trackedPlayers.map((player) => {
                const lastUpdate = lastUpdateTimes[player.id]
                const timeSinceUpdate = lastUpdate ? Date.now() - lastUpdate : null
                const minutesAgo = timeSinceUpdate ? Math.floor(timeSinceUpdate / 60000) : null
                const completed = player.progress.filter((p: any) => p.completed).length
                
                return (
                  <div key={player.id} className="bg-white border-2 border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800 text-lg">{player.name}</div>
                        <div className="text-sm text-gray-600 capitalize">{player.difficulty}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {minutesAgo !== null && minutesAgo < 5 && (
                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            Active
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${player.name}?`)) {
                              handleRemovePlayer(player.id)
                            }
                          }}
                          className="text-red-500 hover:text-red-700 font-bold text-lg"
                          title="Delete player"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Progress:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${getOverallProgress(player)}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold">{getOverallProgress(player)}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Mission:</span>
                        <span className="font-semibold">{player.currentMission}/6</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Completed:</span>
                        <span className="font-semibold text-green-600">{completed}/6</span>
                      </div>
                      {(() => {
                        const quizScores = player.progress.filter((p: any) => p.quizScore !== undefined).map((p: any) => p.quizScore)
                        const avgQuizScore = quizScores.length > 0 
                          ? Math.round(quizScores.reduce((sum: number, score: number) => sum + score, 0) / quizScores.length)
                          : null
                        return avgQuizScore !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Quiz Avg:</span>
                            <span className="font-semibold text-purple-600">{avgQuizScore}%</span>
                          </div>
                        )
                      })()}
                      {minutesAgo !== null && (
                        <div className="flex justify-between text-xs pt-2 border-t border-gray-200">
                          <span className="text-gray-500">Last update:</span>
                          <span className={minutesAgo < 5 ? 'text-green-600 font-semibold' : 'text-gray-600'}>
                            {minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
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
              {trackedPlayers.map((player) => {
                const lastUpdate = lastUpdateTimes[player.id]
                const minutesAgo = lastUpdate ? Math.floor((Date.now() - lastUpdate) / 60000) : null
                const totalScore = player.progress.reduce((sum, p) => sum + (p.score || 0), 0)
                const avgScore = player.progress.length > 0 
                  ? Math.round(totalScore / player.progress.length) 
                  : 0
                const completed = player.progress.filter((p: any) => p.completed).length
                
                return (
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
                        {minutesAgo !== null && minutesAgo < 5 && (
                          <p className="text-xs text-green-600 font-semibold mt-1">
                            🟢 Active {minutesAgo < 1 ? 'now' : `${minutesAgo}m ago`}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (confirm(`Delete ${player.name}?`)) {
                            handleRemovePlayer(player.id)
                          }
                        }}
                        className="text-red-500 hover:text-red-700 font-bold text-lg"
                        title="Delete player"
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
                        <span className="text-gray-500">Completed:</span>
                        <span className="font-semibold text-green-600">{completed}/6</span>
                      </div>
                      {avgScore > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg Score:</span>
                          <span className="font-semibold text-blue-600">{avgScore}/100</span>
                        </div>
                      )}
                      {(() => {
                        const quizScores = player.progress.filter((p: any) => p.quizScore !== undefined).map((p: any) => p.quizScore)
                        const avgQuizScore = quizScores.length > 0 
                          ? Math.round(quizScores.reduce((sum: number, score: number) => sum + score, 0) / quizScores.length)
                          : null
                        return avgQuizScore !== null && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">Avg Quiz:</span>
                            <span className="font-semibold text-purple-600">{avgQuizScore}%</span>
                          </div>
                        )
                      })()}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time Spent:</span>
                        <span className="font-semibold">{Math.round(player.totalTimeSpent / 60000)}min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Hints Used:</span>
                        <span className="font-semibold">{player.progress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0)}</span>
                      </div>
                      {lastUpdate && (
                        <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                          Last update: {minutesAgo !== null && minutesAgo < 60 
                            ? `${minutesAgo} min ago` 
                            : new Date(lastUpdate).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
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
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Quiz Avg</th>
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
                        const progress = player.progress.find((p: any) => p.missionId === missionId)
                        const quizScore = progress?.quizScore
                        return (
                          <td key={missionId} className="text-center py-3 px-2">
                            <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center text-sm font-bold mb-1 ${
                              status === 'completed' 
                                ? 'bg-green-500 text-white' 
                                : status === 'unlocked'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-300 text-gray-600'
                            }`}>
                              {status === 'completed' ? '✓' : status === 'unlocked' ? '○' : '●'}
                            </div>
                            {quizScore !== undefined && (
                              <div className="text-xs text-purple-600 font-semibold">
                                {quizScore}%
                              </div>
                            )}
                          </td>
                        )
                      })}
                      <td className="text-center py-3 px-4">
                        <div className="font-semibold text-gray-800">
                          {getOverallProgress(player)}%
                        </div>
                        {lastUpdateTimes[player.id] && (
                          <div className="text-xs text-gray-500 mt-1">
                            {(() => {
                              const minutesAgo = Math.floor((Date.now() - lastUpdateTimes[player.id]) / 60000)
                              return minutesAgo < 1 ? 'Just now' : `${minutesAgo} min ago`
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="text-center py-3 px-4">
                        {(() => {
                          const quizScores = player.progress.filter((p: any) => p.quizScore !== undefined).map((p: any) => p.quizScore)
                          const avgQuizScore = quizScores.length > 0 
                            ? Math.round(quizScores.reduce((sum: number, score: number) => sum + score, 0) / quizScores.length)
                            : null
                          return avgQuizScore !== null ? (
                            <div className="font-semibold text-purple-600">
                              {avgQuizScore}%
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">-</div>
                          )
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center gap-4 flex-wrap">
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
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-purple-600 font-semibold">Quiz %</span>
                  <span className="text-xs text-gray-500">shown below mission status</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {trackedPlayers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-12 text-center"
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              No Players Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Players will appear here automatically when they start playing. Their progress updates in real-time!
            </p>
            <button
              onClick={loadPlayers}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default InstructorDashboard
