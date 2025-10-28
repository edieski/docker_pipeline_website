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
  health_check_url: string
  replicas: number
  memory_limit: string
  cpu_limit: string
}

interface ConfigFieldProps {
  field: keyof DeploymentConfig
  label: string
  type: 'text' | 'select' | 'number'
  value: string
  onChange: (value: string) => void
  options?: string[]
  placeholder?: string
  required?: boolean
  error?: string
}

const ConfigField: React.FC<ConfigFieldProps> = ({
  label,
  type,
  value,
  onChange,
  options = [],
  placeholder,
  required = false,
  error
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === 'number' ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        />
      )}
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
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
    health_check_url: '',
    replicas: 1,
    memory_limit: '',
    cpu_limit: ''
  })
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'deploying' | 'success' | 'failed'>('idle')

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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Configuration Form */}
          <div className="space-y-6">
            <div className="game-container p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Deployment Configuration</h2>
              
              <div className="grid grid-cols-1 gap-6">
                <ConfigField
                  field="registry_url"
                  label="Registry URL"
                  type="text"
                  value={config.registry_url}
                  onChange={(value) => handleConfigChange('registry_url', value)}
                  placeholder="docker.io/myorg/myapp"
                  required
                  error={errors.registry_url}
                />
                
                <ConfigField
                  field="image_tag"
                  label="Image Tag"
                  type="select"
                  value={config.image_tag}
                  onChange={(value) => handleConfigChange('image_tag', value)}
                  options={validValues.image_tag || []}
                  required
                  error={errors.image_tag}
                />
                
                <ConfigField
                  field="environment"
                  label="Environment"
                  type="select"
                  value={config.environment}
                  onChange={(value) => handleConfigChange('environment', value)}
                  options={validValues.environment || []}
                  required
                  error={errors.environment}
                />
                
                <ConfigField
                  field="deployment_strategy"
                  label="Deployment Strategy"
                  type="select"
                  value={config.deployment_strategy}
                  onChange={(value) => handleConfigChange('deployment_strategy', value)}
                  options={validValues.deployment_strategy || []}
                  required
                  error={errors.deployment_strategy}
                />
                
                <ConfigField
                  field="database_url"
                  label="Database URL"
                  type="text"
                  value={config.database_url}
                  onChange={(value) => handleConfigChange('database_url', value)}
                  placeholder="postgresql://user:pass@host:5432/db"
                  required
                  error={errors.database_url}
                />
                
                <ConfigField
                  field="api_key"
                  label="API Key"
                  type="text"
                  value={config.api_key}
                  onChange={(value) => handleConfigChange('api_key', value)}
                  placeholder="sk-1234567890abcdef"
                  required
                  error={errors.api_key}
                />
                
                <ConfigField
                  field="health_check_url"
                  label="Health Check URL"
                  type="text"
                  value={config.health_check_url}
                  onChange={(value) => handleConfigChange('health_check_url', value)}
                  placeholder="/health"
                />
                
                <ConfigField
                  field="replicas"
                  label="Replicas"
                  type="number"
                  value={config.replicas.toString()}
                  onChange={(value) => handleConfigChange('replicas', value)}
                  error={errors.replicas}
                />
                
                <ConfigField
                  field="memory_limit"
                  label="Memory Limit"
                  type="text"
                  value={config.memory_limit}
                  onChange={(value) => handleConfigChange('memory_limit', value)}
                  placeholder="512Mi"
                />
                
                <ConfigField
                  field="cpu_limit"
                  label="CPU Limit"
                  type="text"
                  value={config.cpu_limit}
                  onChange={(value) => handleConfigChange('cpu_limit', value)}
                  placeholder="500m"
                />
              </div>
              
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleDeploy}
                  disabled={deploymentStatus === 'deploying'}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deploymentStatus === 'deploying' ? 'Deploying...' : 'Deploy to Production'}
                </button>
              </div>
            </div>

            {/* Deployment Status */}
            {deploymentStatus !== 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="game-container p-6"
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
          </div>

          {/* Concept Card */}
          <div>
            <ConceptCard
              teaching={mission.teaching}
              difficulty={player.difficulty}
              onHintUsed={handleHintUsed}
            />
          </div>
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
