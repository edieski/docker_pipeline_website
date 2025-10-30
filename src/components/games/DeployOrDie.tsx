import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import MissionQuiz from '../MissionQuiz'
import missionsData from '../../missions.json'

interface DeploymentConfig {
  imageTag: string
  port: number
  environment: string
  replicas: number
  resources: {
    cpu: string
    memory: string
  }
  environmentVariables: Array<{
    name: string
    value: string
  }>
  healthCheck: {
    enabled: boolean
    path: string
    interval: number
  }
  secrets: Array<{
    name: string
    key: string
  }>
}

interface DeploymentSetting {
  id: string
  name: string
  description: string
  type: 'text' | 'number' | 'select' | 'boolean' | 'array'
  required: boolean
  options?: string[]
  explanation: string
  category: 'basic' | 'scaling' | 'security' | 'monitoring'
}

const DeployOrDie: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [config, setConfig] = useState<DeploymentConfig>({
    imageTag: '',
    port: 0,
    environment: '',
    replicas: 1,
    resources: {
      cpu: '',
      memory: ''
    },
    environmentVariables: [],
    healthCheck: {
      enabled: false,
      path: '',
      interval: 30
    },
    secrets: []
  })
  const [gameCompleted, setGameCompleted] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [timeSpentMs, setTimeSpentMs] = useState(0)
  const [lastValidation, setLastValidation] = useState<ReturnType<typeof validateDeployment> | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [showExplanation, setShowExplanation] = useState(false)
  const [selectedSetting, setSelectedSetting] = useState<DeploymentSetting | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const mission = missionsData.missions.find(m => m.id === 5)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  const deploymentSettings: DeploymentSetting[] = [
    {
      id: 'imageTag',
      name: 'Image Tag',
      description: 'The Docker image version to deploy',
      type: 'text',
      required: true,
      explanation: 'The image tag specifies which version of your application to deploy. Use semantic versioning like "v1.2.3" or environment-specific tags like "staging" or "production".',
      category: 'basic'
    },
    {
      id: 'port',
      name: 'Port',
      description: 'The port your application listens on',
      type: 'number',
      required: true,
      explanation: 'Ports are like door numbers for network communication. Your app listens on a specific port (e.g., 3000 for React, 8080 for Java). The load balancer routes traffic to this port.',
      category: 'basic'
    },
    {
      id: 'environment',
      name: 'Environment',
      description: 'Deployment environment (dev, staging, production)',
      type: 'select',
      required: true,
      options: ['development', 'staging', 'production'],
      explanation: 'Different environments have different configurations. Development might use debug settings, while production needs optimized performance and security.',
      category: 'basic'
    },
    {
      id: 'replicas',
      name: 'Replicas',
      description: 'Number of application instances to run',
      type: 'number',
      required: true,
      explanation: 'Replicas are copies of your application running simultaneously. More replicas = better availability and performance, but also higher resource usage.',
      category: 'scaling'
    },
    {
      id: 'cpu',
      name: 'CPU Limit',
      description: 'Maximum CPU resources per instance',
      type: 'select',
      required: true,
      options: ['100m', '200m', '500m', '1000m', '2000m'],
      explanation: 'CPU limits prevent one application from consuming all server resources. "100m" = 0.1 CPU cores, "1000m" = 1 full CPU core.',
      category: 'scaling'
    },
    {
      id: 'memory',
      name: 'Memory Limit',
      description: 'Maximum memory per instance',
      type: 'select',
      required: true,
      options: ['128Mi', '256Mi', '512Mi', '1Gi', '2Gi'],
      explanation: 'Memory limits prevent memory leaks from crashing the server. "128Mi" = 128 megabytes, "1Gi" = 1 gigabyte.',
      category: 'scaling'
    },
    {
      id: 'envVars',
      name: 'Environment Variables',
      description: 'Configuration values for your application',
      type: 'array',
      required: false,
      explanation: 'Environment variables store configuration like database URLs, API keys, and feature flags. They keep sensitive data out of your code.',
      category: 'security'
    },
    {
      id: 'healthCheck',
      name: 'Health Check',
      description: 'Monitor application health',
      type: 'boolean',
      required: false,
      explanation: 'Health checks verify your app is working correctly. If the check fails, the load balancer stops sending traffic to that instance.',
      category: 'monitoring'
    },
    {
      id: 'secrets',
      name: 'Secrets',
      description: 'Secure storage for sensitive data',
      type: 'array',
      required: false,
      explanation: 'Secrets store sensitive information like passwords and API keys securely, separate from your application code.',
      category: 'security'
    }
  ]

  const steps = [
    { title: 'Basic Settings', settings: deploymentSettings.filter(s => s.category === 'basic') },
    { title: 'Scaling & Resources', settings: deploymentSettings.filter(s => s.category === 'scaling') },
    { title: 'Security & Monitoring', settings: deploymentSettings.filter(s => s.category === 'security' || s.category === 'monitoring') }
  ]

  useEffect(() => {
    // Auto-validate as user fills out the form
    validateConfig()
  }, [config])

  const validateConfig = () => {
    const errors: Record<string, string> = {}
    
    if (!config.imageTag) {
      errors.imageTag = 'Image tag is required'
    } else if (!/^[a-zA-Z0-9._-]+$/.test(config.imageTag)) {
      errors.imageTag = 'Invalid image tag format'
    }
    
    if (!config.port || config.port < 1 || config.port > 65535) {
      errors.port = 'Port must be between 1 and 65535'
    }
    
    if (!config.environment) {
      errors.environment = 'Environment is required'
    }
    
    if (!config.replicas || config.replicas < 1) {
      errors.replicas = 'At least 1 replica is required'
    }
    
    if (!config.resources.cpu) {
      errors.cpu = 'CPU limit is required'
    }
    
    if (!config.resources.memory) {
      errors.memory = 'Memory limit is required'
    }
    
    setValidationErrors(errors)
  }

  const isCurrentStepValid = () => {
    const settings = steps[currentStep].settings
    return settings.every((s) => {
      if (!s.required) return true
      const id = s.id
      if (id === 'cpu') return Boolean(config.resources.cpu)
      if (id === 'memory') return Boolean(config.resources.memory)
      const value = (config as any)[id]
      if (s.type === 'number') return typeof value === 'number' && value !== 0
      return Boolean(value)
    })
  }

  const handleConfigChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof DeploymentConfig] as any),
          [child]: value
        }
      }))
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  const handleEnvironmentVariableAdd = () => {
    setConfig(prev => ({
      ...prev,
      environmentVariables: [...prev.environmentVariables, { name: '', value: '' }]
    }))
  }

  const handleEnvironmentVariableChange = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      environmentVariables: prev.environmentVariables.map((envVar, i) => 
        i === index ? { ...envVar, [field]: value } : envVar
      )
    }))
  }

  const handleEnvironmentVariableRemove = (index: number) => {
    setConfig(prev => ({
      ...prev,
      environmentVariables: prev.environmentVariables.filter((_, i) => i !== index)
    }))
  }

  const handleSecretAdd = () => {
    setConfig(prev => ({
      ...prev,
      secrets: [...prev.secrets, { name: '', key: '' }]
    }))
  }

  const handleSecretChange = (index: number, field: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      secrets: prev.secrets.map((secret, i) => 
        i === index ? { ...secret, [field]: value } : secret
      )
    }))
  }

  const handleSecretRemove = (index: number) => {
    setConfig(prev => ({
      ...prev,
      secrets: prev.secrets.filter((_, i) => i !== index)
    }))
  }

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleDeploy()
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDeploy = () => {
    const validation = validateDeployment()
    const timeSpent = Date.now() - startTime
    setTimeSpentMs(timeSpent)
    setLastValidation(validation)
    
    updateMissionProgress(5, {
      completed: validation.success,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.success && mission.quiz && mission.quiz.length > 0) {
      setShowQuiz(true)
    } else if (validation.success) {
      unlockNextMission()
    }
  }

  const handleQuizComplete = (_correctAnswers: number, quizScore: number) => {
    updateMissionProgress(5, {
      quizScore
    })
    setShowQuiz(false)
    unlockNextMission()
  }

  const handleQuizSkip = () => {
    setShowQuiz(false)
  }

  const validateDeployment = () => {
    let score = 0
    let feedback: string[] = []
    
    // Base points for required fields
    if (config.imageTag) score += 20
    else feedback.push("❌ Image tag is required")
    
    if (config.port && config.port >= 1 && config.port <= 65535) score += 20
    else feedback.push("❌ Port must be between 1 and 65535")
    
    if (config.environment) score += 20
    else feedback.push("❌ Environment is required")
    
    if (config.replicas && config.replicas >= 1) score += 20
    else feedback.push("❌ At least 1 replica is required")
    
    if (config.resources.cpu) score += 10
    else feedback.push("❌ CPU limit is required")
    
    if (config.resources.memory) score += 10
    else feedback.push("❌ Memory limit is required")
    
    // Bonus points for good practices
    if (config.replicas >= 2) {
      score += 10
      feedback.push("✅ Great! Using 2+ replicas for high availability")
    }
    
    if (config.healthCheck.enabled) {
      score += 10
      feedback.push("✅ Excellent! Health checks enabled for monitoring")
    }
    
    if (config.environmentVariables.length > 0) {
      score += 5
      feedback.push("✅ Good! Using environment variables for configuration")
    }
    
    if (config.secrets.length > 0) {
      score += 5
      feedback.push("✅ Perfect! Using secrets for sensitive data")
    }
    
    // Additional hints for common mistakes
    if (config.port && (config.port < 1024 || config.port > 49151)) {
      feedback.push("💡 Tip: Ports 1024-49151 are recommended for applications")
    }
    
    if (config.resources.cpu && config.resources.cpu === '100m') {
      feedback.push("💡 Tip: Consider using more CPU for production workloads")
    }
    
    if (config.resources.memory && config.resources.memory === '128Mi') {
      feedback.push("💡 Tip: Consider using more memory for production workloads")
    }
    
    return {
      success: score >= 80,
      score: Math.max(0, Math.min(100, score)),
      feedback
    }
  }

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1)
  }

  const handleNextMission = () => {
    navigate('/')
  }


  const handleGoHome = () => {
    navigate('/')
  }

  const handleSettingClick = (setting: DeploymentSetting) => {
    setSelectedSetting(setting)
    setShowExplanation(true)
  }

  if (showQuiz && mission.quiz && mission.quiz.length > 0) {
    return (
      <MissionQuiz
        questions={mission.quiz as any}
        missionTitle={mission.title}
        onComplete={handleQuizComplete}
        onSkip={handleQuizSkip}
      />
    )
  }

  if (gameCompleted) {
    const validation = lastValidation || validateDeployment()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">
            {validation.success ? '🚀' : '⚠️'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.success ? 'Deployment Successful!' : 'Deployment Failed!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Deployment Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{config.replicas}</div>
                <div className="text-sm text-gray-600">Replicas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{config.environment}</div>
                <div className="text-sm text-gray-600">Environment</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{config.port}</div>
                <div className="text-sm text-gray-600">Port</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{Math.max(0, Math.round(timeSpentMs / 60000))}min</div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
            </div>
          </div>
          
          {/* Detailed Feedback */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Deployment Feedback</h3>
            <div className="space-y-2">
              {validation.feedback.map((item, index) => (
                <div key={index} className="text-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          {validation.success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Excellent! Your deployment configuration is production-ready with proper scaling, security, and monitoring settings.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Review the feedback above to improve your deployment configuration. Focus on the required fields first!
              </p>
            </div>
          )}

          <div className="flex space-x-4 justify-center flex-wrap gap-2">
            <button
              onClick={handleGoHome}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🏠 Home
            </button>
            {!validation.success && (
              <button
                onClick={() => setGameCompleted(false)}
                className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Try Again
              </button>
            )}
            <button
              onClick={handleNextMission}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {validation.success ? 'Continue to Mission Select' : 'Skip to Mission Select'}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const currentStepSettings = steps[currentStep].settings

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="game-container p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoHome}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                title="Go to Home"
              >
                🏠 Home
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  🚀 Mission 5: Deploy or Die
                </h1>
                <p className="text-gray-600">
                  Configure deployment settings for a production-ready application
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Step {currentStep + 1} of {steps.length}</div>
              <div className="text-lg font-bold text-blue-600">{steps[currentStep].title}</div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Side - Configuration Form */}
          <div className="lg:col-span-2">
            <div className="game-container p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">{steps[currentStep].title}</h2>
              
              <div className="space-y-6">
                {currentStepSettings.map((setting) => (
                  <div key={setting.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700">
                        {setting.name} {setting.required && <span className="text-red-500">*</span>}
                      </label>
                      <button
                        onClick={() => handleSettingClick(setting)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        What is this?
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-600">{setting.description}</p>
                    
                    {setting.type === 'text' && (
                      <input
                        type="text"
                        value={config[setting.id as keyof DeploymentConfig] as string || ''}
                        onChange={(e) => handleConfigChange(setting.id, e.target.value)}
                        className={`w-full p-3 border rounded-lg ${
                          validationErrors[setting.id] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={`Enter ${setting.name.toLowerCase()}`}
                      />
                    )}
                    
                    {setting.type === 'number' && (
                      <input
                        type="number"
                        value={config[setting.id as keyof DeploymentConfig] as number || ''}
                        onChange={(e) => handleConfigChange(setting.id, parseInt(e.target.value) || 0)}
                        className={`w-full p-3 border rounded-lg ${
                          validationErrors[setting.id] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={`Enter ${setting.name.toLowerCase()}`}
                      />
                    )}
                    
                    {setting.type === 'select' && (
                      <select
                        value={config[setting.id as keyof DeploymentConfig] as string || ''}
                        onChange={(e) => handleConfigChange(setting.id, e.target.value)}
                        className={`w-full p-3 border rounded-lg ${
                          validationErrors[setting.id] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select {setting.name}</option>
                        {setting.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    
                    {setting.type === 'boolean' && (
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={config.healthCheck.enabled}
                          onChange={(e) => handleConfigChange('healthCheck.enabled', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">Enable {setting.name}</span>
                      </div>
                    )}
                    
                    {setting.id === 'envVars' && (
                      <div className="space-y-3">
                        <button
                          onClick={handleEnvironmentVariableAdd}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Environment Variable
                        </button>
                        {config.environmentVariables.map((envVar, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={envVar.name}
                              onChange={(e) => handleEnvironmentVariableChange(index, 'name', e.target.value)}
                              placeholder="Variable name"
                              className="flex-1 p-2 border border-gray-300 rounded"
                            />
                            <input
                              type="text"
                              value={envVar.value}
                              onChange={(e) => handleEnvironmentVariableChange(index, 'value', e.target.value)}
                              placeholder="Value"
                              className="flex-1 p-2 border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => handleEnvironmentVariableRemove(index)}
                              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {setting.id === 'secrets' && (
                      <div className="space-y-3">
                        <button
                          onClick={handleSecretAdd}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Secret
                        </button>
                        {config.secrets.map((secret, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={secret.name}
                              onChange={(e) => handleSecretChange(index, 'name', e.target.value)}
                              placeholder="Secret name"
                              className="flex-1 p-2 border border-gray-300 rounded"
                            />
                            <input
                              type="text"
                              value={secret.key}
                              onChange={(e) => handleSecretChange(index, 'key', e.target.value)}
                              placeholder="Secret key"
                              className="flex-1 p-2 border border-gray-300 rounded"
                            />
                            <button
                              onClick={() => handleSecretRemove(index)}
                              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {validationErrors[setting.id] && (
                      <p className="text-red-500 text-sm">{validationErrors[setting.id]}</p>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Navigation */}
              <div className="flex justify-between mt-8 items-center">
                <button
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextStep}
                  disabled={!isCurrentStepValid()}
                  title={!isCurrentStepValid() ? 'Complete required fields to continue' : ''}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {currentStep === steps.length - 1 ? 'Deploy' : 'Next'}
                </button>
              </div>
              {!isCurrentStepValid() && (
                <div className="text-xs text-red-500 mt-2">Please complete required fields in this section before continuing.</div>
              )}
            </div>
          </div>

          {/* Right Side - Help & Preview */}
          <div className="space-y-6">
            {/* Current Configuration Preview */}
            <div className="game-container p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Configuration Preview</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Image:</span>
                  <span className={`font-mono ${config.imageTag ? 'text-green-600' : 'text-red-500'}`}>
                    {config.imageTag || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Port:</span>
                  <span className={`font-mono ${config.port && config.port >= 1 && config.port <= 65535 ? 'text-green-600' : 'text-red-500'}`}>
                    {config.port || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className={`font-mono ${config.environment ? 'text-green-600' : 'text-red-500'}`}>
                    {config.environment || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Replicas:</span>
                  <span className={`font-mono ${config.replicas && config.replicas >= 1 ? 'text-green-600' : 'text-red-500'}`}>
                    {config.replicas || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CPU:</span>
                  <span className={`font-mono ${config.resources.cpu ? 'text-green-600' : 'text-red-500'}`}>
                    {config.resources.cpu || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Memory:</span>
                  <span className={`font-mono ${config.resources.memory ? 'text-green-600' : 'text-red-500'}`}>
                    {config.resources.memory || 'Not set'}
                  </span>
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Configuration Progress</span>
                  <span>{Math.round((Object.keys(validationErrors).length === 0 ? 100 : (6 - Object.keys(validationErrors).length) / 6 * 100))}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.round((Object.keys(validationErrors).length === 0 ? 100 : (6 - Object.keys(validationErrors).length) / 6 * 100))}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Quick Help */}
            <div className="game-container p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Help</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="font-semibold text-gray-700">Ports:</div>
                  <div className="text-gray-600">Like door numbers for network traffic</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Replicas:</div>
                  <div className="text-gray-600">More copies = better availability</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Resources:</div>
                  <div className="text-gray-600">CPU and memory limits per instance</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Environment Variables:</div>
                  <div className="text-gray-600">Configuration without hardcoding</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Concept Card */}
        <div className="mt-8">
          <ConceptCard
            teaching={mission.teaching}
            difficulty={player.difficulty}
            onHintUsed={handleHintUsed}
          />
        </div>

        {/* Explanation Modal */}
        {showExplanation && selectedSetting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-800">{selectedSetting.name}</h3>
                <button
                  onClick={() => setShowExplanation(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <p className="text-gray-700">{selectedSetting.explanation}</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Best Practices:</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    {selectedSetting.category === 'basic' && (
                      <>
                        <li>• Use semantic versioning for image tags</li>
                        <li>• Choose standard ports (80, 443, 3000, 8080)</li>
                        <li>• Match environment to your deployment target</li>
                      </>
                    )}
                    {selectedSetting.category === 'scaling' && (
                      <>
                        <li>• Start with 2+ replicas for high availability</li>
                        <li>• Set resource limits to prevent resource exhaustion</li>
                        <li>• Monitor and adjust based on usage patterns</li>
                      </>
                    )}
                    {selectedSetting.category === 'security' && (
                      <>
                        <li>• Store secrets separately from code</li>
                        <li>• Use environment variables for configuration</li>
                        <li>• Rotate secrets regularly</li>
                      </>
                    )}
                    {selectedSetting.category === 'monitoring' && (
                      <>
                        <li>• Enable health checks for all services</li>
                        <li>• Set appropriate check intervals</li>
                        <li>• Monitor response times and error rates</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeployOrDie