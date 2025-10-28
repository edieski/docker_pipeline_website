import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import missionsData from '../../missions.json'

interface DeploymentConfig {
  registry_url: string
  image_tag: string
  environment: string
  database_url: string
  api_key: string
  deployment_strategy: string
  replicas: number
}

interface ConfigStepProps {
  title: string
  description: string
  children: React.ReactNode
  completed: boolean
}

const ConfigStep: React.FC<ConfigStepProps> = ({ title, description, children, completed }) => {
  return (
    <div className={`p-6 rounded-lg border-2 transition-all ${
      completed ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-white'
    }`}>
      <div className="flex items-center mb-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
          completed ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {completed ? '✓' : '1'}
        </div>
        <div>
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

const DeployOrDie: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [config, setConfig] = useState<DeploymentConfig>({
    registry_url: '',
    image_tag: '',
    environment: '',
    database_url: '',
    api_key: '',
    deployment_strategy: '',
    replicas: 1
  })
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'failed'>('idle')
  const [currentStep, setCurrentStep] = useState(1)

  const mission = missionsData.missions.find(m => m.id === 5)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  const validValues = mission.validation?.validValues as Record<string, string[]> || {}

  const handleConfigChange = (field: keyof DeploymentConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateConfig = () => {
    const newErrors: Record<string, string> = {}
    const requiredFields = mission.validation?.requiredFields || []
    
    // Check required fields
    requiredFields.forEach(field => {
      if (!config[field as keyof DeploymentConfig]) {
        newErrors[field] = 'This field is required'
      }
    })
    
    // Validate specific field values
    Object.entries(validValues).forEach(([field, validOptions]) => {
      const value = config[field as keyof DeploymentConfig]
      if (value && Array.isArray(validOptions) && !validOptions.includes(String(value))) {
        newErrors[field] = `Invalid value. Must be one of: ${validOptions.join(', ')}`
      }
    })
    
    // Custom validations
    if (config.registry_url && !config.registry_url.includes('/')) {
      newErrors.registry_url = 'Registry URL must include organization/repository'
    }
    
    if (config.api_key && config.api_key.length < 10) {
      newErrors.api_key = 'API key must be at least 10 characters'
    }
    
    if (Number(config.replicas) < 1 || Number(config.replicas) > 10) {
      newErrors.replicas = 'Replicas must be between 1 and 10'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleDeploy = async () => {
    if (!validateConfig()) {
      return
    }
    
    setDeploymentStatus('deploying')
    
    // Simulate deployment process
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // Check if deployment would succeed based on config
    const wouldSucceed = config.environment === 'production' && 
                        config.deployment_strategy === 'rolling' &&
                        config.registry_url.includes('docker.io') &&
                        config.api_key.length >= 10
    
    setDeploymentStatus(wouldSucceed ? 'success' : 'failed')
    
    if (wouldSucceed) {
      setTimeout(() => {
        const validation = validateDeployment()
        const timeSpent = Date.now() - startTime
        
        updateMissionProgress(5, {
          completed: true,
          timeSpent,
          hintsUsed,
          score: validation.score
        })
        
        setGameCompleted(true)
        unlockNextMission()
      }, 2000)
    }
  }

  const validateDeployment = () => {
    let score = 0
    const requiredFields = mission.validation?.requiredFields || []
    
    // Points for filling required fields
    const filledFields = requiredFields.filter(field => 
      config[field as keyof DeploymentConfig]
    ).length
    
    score += (filledFields / requiredFields.length) * 60
    
    // Points for correct values
    Object.entries(validValues).forEach(([field, validOptions]) => {
      const value = config[field as keyof DeploymentConfig]
      if (Array.isArray(validOptions) && validOptions.includes(String(value))) {
        score += 10
      }
    })
    
    // Bonus points for good practices
    if (config.deployment_strategy === 'rolling') score += 10
    if (config.environment === 'production') score += 10
    if (Number(config.replicas) >= 2) score += 10
    
    return { score: Math.min(score, 100) }
  }

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1)
  }

  const handleNextMission = () => {
    navigate('/')
  }

  const handleRetry = () => {
    setDeploymentStatus('idle')
  }

  const isStepCompleted = (step: number) => {
    switch (step) {
      case 1:
        return config.registry_url && config.image_tag && config.environment
      case 2:
        return config.database_url && config.api_key
      case 3:
        return config.deployment_strategy && config.replicas > 0
      default:
        return false
    }
  }

  if (gameCompleted) {
    const validation = validateDeployment()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">🚀</div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Deployment Successful!
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{mission.validation?.requiredFields?.length || 0}</div>
                <div className="text-sm text-gray-600">Fields Configured</div>
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
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">
              🎯 Excellent! You've successfully configured a production deployment with proper registry settings, secrets, and environment variables.
            </p>
          </div>
          
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
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="game-container p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                🚀 Mission 5: Deploy or Die
              </h1>
              <p className="text-gray-600">
                Configure deployment settings and successfully deploy to production
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Hints Used</div>
              <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Configuration */}
        <div className="space-y-6">
          {/* Step 1: Basic Configuration */}
          <ConfigStep
            title="Basic Configuration"
            description="Set up your container registry and environment"
            completed={isStepCompleted(1)}
          >
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Registry URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.registry_url}
                  onChange={(e) => handleConfigChange('registry_url', e.target.value)}
                  placeholder="docker.io/myorg/myapp"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.registry_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.registry_url && (
                  <p className="text-sm text-red-600 mt-1">{errors.registry_url}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Image Tag <span className="text-red-500">*</span>
                </label>
                <select
                  value={config.image_tag}
                  onChange={(e) => handleConfigChange('image_tag', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.image_tag ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select tag</option>
                  {(validValues.image_tag || []).map((tag) => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                {errors.image_tag && (
                  <p className="text-sm text-red-600 mt-1">{errors.image_tag}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Environment <span className="text-red-500">*</span>
                </label>
                <select
                  value={config.environment}
                  onChange={(e) => handleConfigChange('environment', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.environment ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select environment</option>
                  {(validValues.environment || []).map((env) => (
                    <option key={env} value={env}>{env}</option>
                  ))}
                </select>
                {errors.environment && (
                  <p className="text-sm text-red-600 mt-1">{errors.environment}</p>
                )}
              </div>
            </div>
          </ConfigStep>

          {/* Step 2: Secrets & Database */}
          <ConfigStep
            title="Secrets & Database"
            description="Configure sensitive data and database connection"
            completed={isStepCompleted(2)}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Database URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.database_url}
                  onChange={(e) => handleConfigChange('database_url', e.target.value)}
                  placeholder="postgresql://user:pass@host:5432/db"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.database_url ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.database_url && (
                  <p className="text-sm text-red-600 mt-1">{errors.database_url}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  API Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={config.api_key}
                  onChange={(e) => handleConfigChange('api_key', e.target.value)}
                  placeholder="sk-1234567890abcdef"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.api_key ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.api_key && (
                  <p className="text-sm text-red-600 mt-1">{errors.api_key}</p>
                )}
              </div>
            </div>
          </ConfigStep>

          {/* Step 3: Deployment Strategy */}
          <ConfigStep
            title="Deployment Strategy"
            description="Choose how to deploy and scale your application"
            completed={isStepCompleted(3)}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Deployment Strategy <span className="text-red-500">*</span>
                </label>
                <select
                  value={config.deployment_strategy}
                  onChange={(e) => handleConfigChange('deployment_strategy', e.target.value)}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.deployment_strategy ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select strategy</option>
                  {(validValues.deployment_strategy || []).map((strategy) => (
                    <option key={strategy} value={strategy}>{strategy}</option>
                  ))}
                </select>
                {errors.deployment_strategy && (
                  <p className="text-sm text-red-600 mt-1">{errors.deployment_strategy}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Replicas
                </label>
                <input
                  type="number"
                  value={config.replicas}
                  onChange={(e) => handleConfigChange('replicas', e.target.value)}
                  min="1"
                  max="10"
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.replicas ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.replicas && (
                  <p className="text-sm text-red-600 mt-1">{errors.replicas}</p>
                )}
              </div>
            </div>
          </ConfigStep>
        </div>

        {/* Deployment Status */}
        {deploymentStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-6 mt-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Deployment Status</h3>
            
            {deploymentStatus === 'deploying' && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Deploying to production...</p>
              </div>
            )}
            
            {deploymentStatus === 'success' && (
              <div className="text-center">
                <div className="text-4xl mb-4">✅</div>
                <p className="text-green-600 font-semibold">Deployment Successful!</p>
                <p className="text-gray-600">Your application is now live in production.</p>
              </div>
            )}
            
            {deploymentStatus === 'failed' && (
              <div className="text-center">
                <div className="text-4xl mb-4">❌</div>
                <p className="text-red-600 font-semibold">Deployment Failed</p>
                <p className="text-gray-600 mb-4">Check your configuration and try again.</p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Retry Deployment
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Deploy Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleDeploy}
            disabled={deploymentStatus === 'deploying' || !isStepCompleted(3)}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deploymentStatus === 'deploying' ? 'Deploying...' : 'Deploy to Production'}
          </button>
        </div>

        {/* Concept Card */}
        <div className="mt-8">
          <ConceptCard
            teaching={mission.teaching}
            difficulty={player.difficulty}
            onHintUsed={handleHintUsed}
          />
        </div>

        {/* Deployment Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-container p-6 mt-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">Deployment Checklist</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Required Fields:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {(mission.validation?.requiredFields || []).map((field) => (
                  <li key={field} className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${
                      config[field as keyof DeploymentConfig] ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    {field.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Best Practices:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>• Use rolling deployment for zero downtime</div>
                <div>• Set up health checks for monitoring</div>
                <div>• Use proper registry URLs with organization</div>
                <div>• Configure resource limits for stability</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default DeployOrDie