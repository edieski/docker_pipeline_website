import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../store/gameStore'
import missionsData from '../missions.json'

const VictoryScreen: React.FC = () => {
  const navigate = useNavigate()
  const { player, resetGame } = useGameStore()

  if (!player) {
    navigate('/')
    return null
  }

  const completedMissions = player.progress.filter(p => p.completed)
  const totalScore = player.progress.reduce((sum, p) => sum + p.score, 0)
  const averageScore = completedMissions.length > 0 ? Math.round(totalScore / completedMissions.length) : 0
  const totalTimeMinutes = Math.round(player.totalTimeSpent / 60000)

  const getPerformanceLevel = () => {
    if (averageScore >= 90) return { level: 'Expert', color: 'text-purple-600', emoji: '🏆' }
    if (averageScore >= 75) return { level: 'Advanced', color: 'text-blue-600', emoji: '🥇' }
    if (averageScore >= 60) return { level: 'Intermediate', color: 'text-green-600', emoji: '🥈' }
    return { level: 'Beginner', color: 'text-yellow-600', emoji: '🥉' }
  }

  const performance = getPerformanceLevel()

  const getSkillAssessment = () => {
    const skills = {
      docker: player.progress.find(p => p.missionId === 1)?.completed || false,
      optimization: player.progress.find(p => p.missionId === 2)?.completed || false,
      cicd: player.progress.find(p => p.missionId === 3)?.completed || false,
      debugging: player.progress.find(p => p.missionId === 4)?.completed || false,
      deployment: player.progress.find(p => p.missionId === 5)?.completed || false,
      incidentResponse: player.progress.find(p => p.missionId === 6)?.completed || false
    }

    return skills
  }

  const skills = getSkillAssessment()

  const handlePlayAgain = () => {
    resetGame()
    navigate('/')
  }


  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="game-container max-w-4xl w-full p-8"
      >
        {/* Victory Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="text-8xl mb-6"
          >
            🎉
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-bold text-gray-800 mb-4"
          >
            Mission Accomplished!
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-gray-600 mb-6"
          >
            Congratulations, {player.name}! You've successfully completed Operation Deploy the Python.
            The FastAPI app is now live and the product launch is saved! 🚀
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${performance.color} bg-gray-50`}
          >
            <span className="mr-3">{performance.emoji}</span>
            {performance.level} DevOps Engineer
          </motion.div>
        </div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="grid md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-blue-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {completedMissions.length}/6
            </div>
            <div className="text-gray-600">Missions Completed</div>
          </div>
          
          <div className="bg-green-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {averageScore}
            </div>
            <div className="text-gray-600">Average Score</div>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {totalTimeMinutes}
            </div>
            <div className="text-gray-600">Minutes Played</div>
          </div>
          
          <div className="bg-orange-50 rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {player.progress.reduce((sum, p) => sum + (p.hintsUsed || 0), 0)}
            </div>
            <div className="text-gray-600">Hints Used</div>
          </div>
        </motion.div>

        {/* Skills Assessment */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-gray-50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            🎯 Skills Assessment
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg border-2 ${skills.docker ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Docker Basics</span>
                <span className="text-2xl">{skills.docker ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Containerization fundamentals</p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${skills.optimization ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Build Optimization</span>
                <span className="text-2xl">{skills.optimization ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Layer caching & image size</p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${skills.cicd ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">CI/CD Pipelines</span>
                <span className="text-2xl">{skills.cicd ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Automated testing & deployment</p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${skills.debugging ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Log Analysis</span>
                <span className="text-2xl">{skills.debugging ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Debugging failed builds</p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${skills.deployment ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Production Deployment</span>
                <span className="text-2xl">{skills.deployment ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Configuring & deploying apps</p>
            </div>
            
            <div className={`p-4 rounded-lg border-2 ${skills.incidentResponse ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">Incident Response</span>
                <span className="text-2xl">{skills.incidentResponse ? '✅' : '❌'}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">Handling production outages</p>
            </div>
          </div>
        </motion.div>

        {/* Mission Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="bg-white rounded-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            📊 Mission Breakdown
          </h2>
          
          <div className="space-y-4">
            {missionsData.missions.map((mission) => {
              const progress = player.progress.find(p => p.missionId === mission.id)
              const isCompleted = progress?.completed || false
              
              return (
                <div key={mission.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? '✓' : '○'}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">
                        Mission {mission.id}: {mission.title}
                      </div>
                      <div className="text-sm text-gray-600">{mission.description}</div>
                    </div>
                  </div>
                  
                  {progress && (
                    <div className="text-right text-sm">
                      <div className="font-semibold text-gray-800">{progress.score}/100</div>
                      <div className="text-gray-600">{Math.round(progress.timeSpent / 60000)}min</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6 }}
          className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
            🚀 What's Next?
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Continue Learning</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Practice with real Docker projects</li>
                <li>• Set up CI/CD for your own repositories</li>
                <li>• Explore Kubernetes for container orchestration</li>
                <li>• Learn monitoring tools like Prometheus & Grafana</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Apply Your Skills</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Containerize your existing applications</li>
                <li>• Automate your deployment pipeline</li>
                <li>• Set up proper logging and monitoring</li>
                <li>• Practice incident response procedures</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.8 }}
          className="flex justify-center gap-4"
        >
          <button
            onClick={handlePlayAgain}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🔄 Play Again
          </button>
          
          <button
            onClick={() => navigate('/instructor')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            👨‍🏫 Instructor View
          </button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0 }}
          className="mt-8 text-center text-gray-500 text-sm"
        >
          <p>Thank you for playing Operation Deploy the Python! 🎮</p>
          <p className="mt-1">Keep building, keep learning, keep deploying! 🚀</p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default VictoryScreen
