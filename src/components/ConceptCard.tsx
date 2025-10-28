import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ConceptCardProps {
  teaching: {
    tldr: string
    explainAgain: string
    example: string
    exercise: string
    cheatSheet: string
  }
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  onHintUsed?: () => void
}

const ConceptCard: React.FC<ConceptCardProps> = ({ teaching, difficulty, onHintUsed }) => {
  const [activeTab, setActiveTab] = useState<'tldr' | 'explainAgain' | 'example' | 'exercise' | 'cheatSheet'>('tldr')
  const [hintsUsed, setHintsUsed] = useState(0)

  const tabs = [
    { id: 'tldr' as const, label: 'TL;DR', icon: '⚡', color: 'text-yellow-600' },
    { id: 'explainAgain' as const, label: 'Explain Again', icon: '🔄', color: 'text-blue-600' },
    { id: 'example' as const, label: 'Example', icon: '💡', color: 'text-green-600' },
    { id: 'exercise' as const, label: 'Exercise', icon: '🏋️', color: 'text-purple-600' },
    { id: 'cheatSheet' as const, label: 'Cheat Sheet', icon: '📋', color: 'text-red-600' }
  ]

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId)
    
    // Count hint usage for non-TL;DR tabs
    if (tabId !== 'tldr' && hintsUsed === 0) {
      setHintsUsed(1)
      onHintUsed?.()
    }
  }

  const getMaxHints = () => {
    switch (difficulty) {
      case 'beginner': return 5
      case 'intermediate': return 3
      case 'advanced': return 1
      default: return 3
    }
  }

  const canUseHint = hintsUsed < getMaxHints()

  return (
    <div className="concept-card">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-800">💡 Concept Helper</h3>
          <div className="text-sm text-gray-500">
            Hints used: {hintsUsed}/{getMaxHints()}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            disabled={!canUseHint && tab.id !== 'tldr'}
            className={`concept-tab flex-1 ${activeTab === tab.id ? 'active' : ''} ${
              !canUseHint && tab.id !== 'tldr' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            <span className={tab.color}>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="concept-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'tldr' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Quick Summary</h4>
                <p className="text-gray-700 leading-relaxed">{teaching.tldr}</p>
              </div>
            )}

            {activeTab === 'explainAgain' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Simple Explanation</h4>
                <p className="text-gray-700 leading-relaxed">{teaching.explainAgain}</p>
              </div>
            )}

            {activeTab === 'example' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Code Example</h4>
                <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{teaching.example}</pre>
                </div>
              </div>
            )}

            {activeTab === 'exercise' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Try This</h4>
                <p className="text-gray-700 leading-relaxed">{teaching.exercise}</p>
              </div>
            )}

            {activeTab === 'cheatSheet' && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Quick Reference</h4>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-blue-800 font-mono text-sm">{teaching.cheatSheet}</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 border-t">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            {canUseHint ? (
              <span className="text-green-600">💚 More hints available</span>
            ) : (
              <span className="text-red-600">🔴 No more hints</span>
            )}
          </div>
          <div>
            Difficulty: <span className="font-semibold capitalize">{difficulty}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConceptCard
