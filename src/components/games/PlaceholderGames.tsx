import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const PlaceholderGame: React.FC<{ title: string; description: string; missionId: number }> = ({ 
  title, 
  description, 
  missionId: _missionId 
}) => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="game-container max-w-2xl w-full p-8 text-center"
      >
        <div className="text-6xl mb-6">🚧</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {title}
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          {description}
        </p>
        <p className="text-gray-500 mb-8">
          This game is coming soon! For now, you can explore Mission 1: Dockerfile Jigsaw.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Missions
        </button>
      </motion.div>
    </div>
  )
}

export const CacheCrash: React.FC = () => (
  <PlaceholderGame 
    title="Mission 2: Cache Crash" 
    description="Optimize your Dockerfile for faster builds and smaller images"
    missionId={2}
  />
)

export const PipelineArchitect: React.FC = () => (
  <PlaceholderGame 
    title="Mission 3: Pipeline Architect" 
    description="Design a CI/CD pipeline by connecting job nodes and configuring YAML"
    missionId={3}
  />
)

export const LogDetective: React.FC = () => (
  <PlaceholderGame 
    title="Mission 4: Log Detective" 
    description="Debug a failing CI pipeline by analyzing logs and identifying errors"
    missionId={4}
  />
)

export const DeployOrDie: React.FC = () => (
  <PlaceholderGame 
    title="Mission 5: Deploy or Die" 
    description="Configure deployment settings and successfully deploy to production"
    missionId={5}
  />
)

export const OutageSimulator: React.FC = () => (
  <PlaceholderGame 
    title="Mission 6: Outage Simulator" 
    description="Respond to a production incident by choosing the right recovery strategy"
    missionId={6}
  />
)
