import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MissionGuideProps {
  mission: {
    id: number
    title: string
    description: string
    intro?: {
      what?: string
      why?: string
      where?: string
      how?: string
      purpose?: string
    }
    teaching?: {
      tldr?: string
      explainAgain?: string
      example?: string
      cheatSheet?: string
      how?: string
    }
    realWorld?: {
      scenarios?: Array<{
        situation: string
        solution: string
        dailyUse: string
      }>
    }
  }
}

const MissionGuide: React.FC<MissionGuideProps> = ({ mission }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'howto' | 'examples'>('overview')

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full game-container p-4 hover:bg-blue-50 transition-colors rounded-lg text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Mission Guide</h3>
              <p className="text-sm text-gray-600">
                {isOpen ? 'Click to collapse' : 'Click to expand and learn more about this mission'}
              </p>
            </div>
          </div>
          <span className="text-2xl text-gray-500">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="game-container mt-4 overflow-hidden"
          >
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'overview'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  📖 Overview
                </button>
                <button
                  onClick={() => setActiveTab('howto')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'howto'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  🎯 How To
                </button>
                <button
                  onClick={() => setActiveTab('examples')}
                  className={`px-4 py-2 font-semibold transition-colors ${
                    activeTab === 'examples'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  💡 Examples
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <span>🤔</span> What is this about?
                    </h4>
                    <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg">
                      {mission.intro?.what || mission.description}
                    </p>
                  </div>

                  {mission.intro?.why && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>❓</span> Why does this matter?
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-green-50 p-4 rounded-lg">
                        {mission.intro.why}
                      </p>
                    </div>
                  )}

                  {mission.intro?.where && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>📍</span> Where is this used?
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-yellow-50 p-4 rounded-lg">
                        {mission.intro.where}
                      </p>
                    </div>
                  )}

                  {mission.intro?.purpose && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>🎯</span> What will you learn?
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-purple-50 p-4 rounded-lg">
                        {mission.intro.purpose}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'howto' && (
                <div className="space-y-6">
                  {mission.teaching?.tldr && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>⚡</span> TL;DR (Quick Summary)
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-blue-50 p-4 rounded-lg font-medium">
                        {mission.teaching.tldr}
                      </p>
                    </div>
                  )}

                  {mission.teaching?.explainAgain && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>🔄</span> Explained Simply
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-green-50 p-4 rounded-lg">
                        {mission.teaching.explainAgain}
                      </p>
                    </div>
                  )}

                  {mission.intro?.how && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>⚙️</span> How It Works
                      </h4>
                      <p className="text-gray-700 leading-relaxed bg-yellow-50 p-4 rounded-lg">
                        {mission.intro.how}
                      </p>
                    </div>
                  )}

                  {mission.teaching?.cheatSheet && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>📋</span> Quick Reference
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {mission.teaching.cheatSheet}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'examples' && (
                <div className="space-y-6">
                  {mission.teaching?.example && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>💻</span> Example Code
                      </h4>
                      <div className="bg-gray-900 text-green-400 font-mono text-sm p-4 rounded-lg overflow-x-auto">
                        <pre className="whitespace-pre-wrap">{mission.teaching.example}</pre>
                      </div>
                    </div>
                  )}

                  {mission.realWorld?.scenarios && mission.realWorld.scenarios.length > 0 && (
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                        <span>🌍</span> Real-World Scenarios
                      </h4>
                      <div className="space-y-4">
                        {mission.realWorld.scenarios.map((scenario, index) => (
                          <div
                            key={index}
                            className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200"
                          >
                            <div className="mb-3">
                              <span className="font-semibold text-gray-800 text-sm bg-white px-2 py-1 rounded">
                                Situation:
                              </span>
                              <p className="text-gray-700 mt-2">{scenario.situation}</p>
                            </div>
                            <div className="mb-3">
                              <span className="font-semibold text-gray-800 text-sm bg-white px-2 py-1 rounded">
                                Solution:
                              </span>
                              <p className="text-gray-700 mt-2">{scenario.solution}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-gray-800 text-sm bg-white px-2 py-1 rounded">
                                Daily Use:
                              </span>
                              <p className="text-gray-700 mt-2 italic">{scenario.dailyUse}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MissionGuide
