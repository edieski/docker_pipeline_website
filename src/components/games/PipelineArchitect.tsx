import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { useGameStore } from '../../store/gameStore'
import ConceptCard from '../ConceptCard'
import missionsData from '../../missions.json'

interface PipelineJob {
  id: string
  name: string
  type: 'job'
  description: string
  yaml: string
  dependencies: string[]
  position: { x: number; y: number }
  configured: boolean
}

interface JobNodeProps {
  job: PipelineJob
  onConfigure: (job: PipelineJob) => void
  onConnect: (fromJob: string, toJob: string) => void
}

const JobNode: React.FC<JobNodeProps> = ({ job, onConfigure, onConnect }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'pipeline-job',
    item: job,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  })

  const [{ isOver }, drop] = useDrop({
    accept: 'pipeline-job',
    drop: (droppedJob: PipelineJob) => {
      if (droppedJob.id !== job.id) {
        onConnect(droppedJob.id, job.id)
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  })

  return (
    <div
      ref={(node) => {
        drag(node)
        drop(node)
      }}
      className={`job-node ${isDragging ? 'opacity-50' : ''} ${isOver ? 'ring-2 ring-blue-400' : ''}`}
      style={{
        position: 'absolute',
        left: job.position.x,
        top: job.position.y,
        width: '140px',
        height: '100px'
      }}
    >
      <div className={`bg-white border-2 rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all ${
        job.configured ? 'border-green-500 bg-green-50' : 'border-blue-500'
      }`}>
        <div className="text-sm font-semibold text-center text-gray-800 mb-1">
          {job.name}
        </div>
        <div className="text-xs text-gray-600 text-center mb-2">
          {job.description}
        </div>
        <div className="text-xs text-gray-500 text-center mb-2">
          {job.dependencies.length} dependencies
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onConfigure(job)
          }}
          className={`w-full px-2 py-1 text-xs rounded transition-colors ${
            job.configured 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {job.configured ? '✓ Configured' : 'Configure'}
        </button>
      </div>
    </div>
  )
}

interface YAMLConfigModalProps {
  job: PipelineJob | null
  onClose: () => void
  onSave: (job: PipelineJob, yaml: string) => void
}

const YAMLConfigModal: React.FC<YAMLConfigModalProps> = ({ job, onClose, onSave }) => {
  const [yaml, setYaml] = useState('')
  const [selectedLine, setSelectedLine] = useState<number | null>(null)

  useEffect(() => {
    if (job) {
      setYaml(job.yaml)
      setSelectedLine(null)
    }
  }, [job])

  const handleSave = () => {
    if (job) {
      onSave(job, yaml)
    }
    onClose()
  }

  if (!job) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Configure {job.name} Job
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Job Description:
          </label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
            {job.description}
          </div>
        </div>

        {/* YAML Learn-by-click UI */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            YAML Configuration (click any line to see what it means):
          </label>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Left: Clickable YAML viewer + editor */}
            <div>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  YAML preview
                </div>
                <div className="max-h-64 overflow-auto font-mono text-sm">
                  {yaml.split('\n').map((line, idx) => {
                    const isSelected = selectedLine === idx
                    const lineNum = (idx + 1).toString().padStart(2, ' ')
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedLine(idx)}
                        title="Click for an explanation"
                        className={`w-full text-left flex items-start gap-3 px-3 py-1.5 hover:bg-blue-50 ${isSelected ? 'bg-blue-100' : ''}`}
                      >
                        <span className="shrink-0 w-6 text-right text-xs text-gray-400 select-none">
                          {lineNum}
                        </span>
                        <span className="whitespace-pre text-gray-800">
                          {line.length === 0 ? '\u00A0' : line}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-gray-700 mb-1">Edit YAML:</label>
                <textarea
                  value={yaml}
                  onChange={(e) => setYaml(e.target.value)}
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                  placeholder="Enter YAML configuration..."
                />
              </div>
            </div>

            {/* Right: Explanation panel */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Explanation</h4>
              {selectedLine === null ? (
                <p className="text-sm text-gray-600">Click a line on the left to see what it means, in plain English.</p>
              ) : (
                <div className="space-y-2">
                  <div className="text-xs text-gray-500">Line {selectedLine + 1}</div>
                  <pre className="text-sm bg-white border border-gray-200 rounded p-2 overflow-auto"><code className="font-mono">{yaml.split('\n')[selectedLine] || ''}</code></pre>
                  <p className="text-sm text-gray-800 leading-6">
                    {getYamlLineExplanation(yaml.split('\n')[selectedLine] || '', job.name)}
                  </p>
                </div>
              )}
              <div className="mt-3 text-xs text-gray-600">
                Tip: Lines that start with two spaces are nested under the previous key. For example, values under <span className="font-mono">steps:</span> are individual actions or commands.
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Required Elements:
          </label>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${yaml.includes('name:') ? 'bg-green-500' : 'bg-gray-300'}`} />
              Job name
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${yaml.includes('runs-on:') ? 'bg-green-500' : 'bg-gray-300'}`} />
              Runner
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${yaml.includes('steps:') ? 'bg-green-500' : 'bg-gray-300'}`} />
              Steps
            </div>
            <div className="flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${yaml.includes('uses:') ? 'bg-green-500' : 'bg-gray-300'}`} />
              Actions
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  )
}

function getYamlLineExplanation(line: string, jobName: string): string {
  const trimmed = line.trim()
  if (trimmed.length === 0) return 'Blank line for readability.'

  // Top-level common keys
  if (trimmed.startsWith('name:')) {
    return 'Human-friendly label for this job. It appears in the CI run UI.'
  }
  if (trimmed.startsWith('runs-on:')) {
    return 'Specifies the runner machine (environment) this job will run on.'
  }
  if (trimmed.startsWith('needs:')) {
    return 'Declares dependencies. This job will wait for the listed jobs to finish successfully before it starts.'
  }
  if (trimmed === 'steps:' || trimmed.startsWith('steps:')) {
    return 'A list of actions and commands that make up this job. Each item is a step.'
  }

  // Steps
  if (trimmed.startsWith('- uses:')) {
    if (trimmed.includes('actions/checkout')) {
      return 'Checks out your repository code so subsequent steps can access it.'
    }
    if (trimmed.includes('actions/setup-python')) {
      return 'Sets up a Python interpreter on the runner so you can run Python commands.'
    }
    if (trimmed.includes('docker/build-push-action')) {
      return 'GitHub Action from Docker that can build and optionally push Docker images.'
    }
    return 'Runs a pre-built GitHub Action by its owner/name@version.'
  }

  if (trimmed.startsWith('with:')) {
    return 'Inputs for the previous “uses” action. Indented keys under here configure that action.'
  }

  if (trimmed.startsWith('- run:')) {
    return 'Runs a shell command on the runner. Good for installing deps or executing tools.'
  }

  // Common nested keys
  if (trimmed.startsWith('push:')) {
    return 'For Docker build-push action: when true, pushes the built image to the registry.'
  }
  if (trimmed.startsWith('tags:')) {
    return 'Name and tag for the Docker image (e.g., repository:tag). Often uses the commit SHA.'
  }

  // Job-specific hints
  const lower = jobName.toLowerCase()
  if (lower.includes('test') && trimmed.includes('pytest')) {
    return 'Runs your test suite with pytest to verify the code works.'
  }
  if (lower.includes('lint') && trimmed.includes('flake8')) {
    return 'Runs flake8 to check code style and catch common Python issues.'
  }
  if (lower.includes('build') && trimmed.includes('docker/build-push-action')) {
    return 'Builds the Docker image for your application. Pushing can be disabled here.'
  }
  if (lower.includes('deploy') && trimmed.startsWith('- run:')) {
    return 'Represents the deployment action. In real pipelines this would call your deploy script or tool.'
  }

  return 'YAML key/value. Use indentation to nest related settings under their parent.'
}

const PipelineArchitect: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [availableJobs, setAvailableJobs] = useState<PipelineJob[]>([])
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [configuringJob, setConfiguringJob] = useState<PipelineJob | null>(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [timeSpentMs, setTimeSpentMs] = useState(0)
  const [lastValidation, setLastValidation] = useState<ReturnType<typeof validatePipeline> | null>(null)
  const [jobsAddedAtSubmit, setJobsAddedAtSubmit] = useState(0)

  const mission = missionsData.missions.find(m => m.id === 3)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  useEffect(() => {
    // Initialize available jobs with better descriptions
    const yamlTemplate = mission.validation?.yamlTemplate as Record<string, string> || {}
    
    const jobs: PipelineJob[] = [
      {
        id: 'job-test',
        name: 'Test',
        type: 'job',
        description: 'Run automated tests to ensure code quality',
        yaml: yamlTemplate.test || `name: Test
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
  - run: pip install -r requirements.txt
  - run: pytest`,
        dependencies: [],
        position: { x: 50, y: 100 },
        configured: false
      },
      {
        id: 'job-lint',
        name: 'Lint',
        type: 'job',
        description: 'Check code style and catch potential issues',
        yaml: yamlTemplate.lint || `name: Lint
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v4
  - uses: actions/setup-python@v5
  - run: pip install flake8
  - run: flake8 .`,
        dependencies: [],
        position: { x: 200, y: 100 },
        configured: false
      },
      {
        id: 'job-build',
        name: 'Build',
        type: 'job',
        description: 'Build Docker image from source code',
        yaml: yamlTemplate.build || `name: Build
needs: [test, lint]
runs-on: ubuntu-latest
steps:
  - uses: actions/checkout@v4
  - uses: docker/build-push-action@v6
    with:
      push: false
      tags: myapp:\${{ github.sha }}`,
        dependencies: [],
        position: { x: 350, y: 100 },
        configured: false
      },
      {
        id: 'job-push',
        name: 'Push',
        type: 'job',
        description: 'Push Docker image to container registry',
        yaml: yamlTemplate.push || `name: Push
needs: build
runs-on: ubuntu-latest
steps:
  - uses: docker/build-push-action@v6
    with:
      push: true
      tags: myapp:\${{ github.sha }}`,
        dependencies: [],
        position: { x: 500, y: 100 },
        configured: false
      },
      {
        id: 'job-deploy',
        name: 'Deploy',
        type: 'job',
        description: 'Deploy application to staging environment',
        yaml: yamlTemplate.deploy || `name: Deploy
needs: push
runs-on: ubuntu-latest
steps:
  - run: echo 'Deploying to staging'`,
        dependencies: [],
        position: { x: 650, y: 100 },
        configured: false
      }
    ]
    
    setAvailableJobs(jobs)
    setPipelineJobs([])
  }, [mission, player])

  const handleJobDrop = (job: PipelineJob) => {
    // Add job to pipeline if not already there
    if (!pipelineJobs.find(j => j.id === job.id)) {
      const newJob = {
        ...job,
        position: { x: 200 + pipelineJobs.length * 150, y: 200 }
      }
      setPipelineJobs(prev => [...prev, newJob])
    }
  }

  const handleJobConnect = (fromJobId: string, toJobId: string) => {
    setPipelineJobs(prev => prev.map(job => {
      if (job.id === toJobId && !job.dependencies.includes(fromJobId)) {
        return {
          ...job,
          dependencies: [...job.dependencies, fromJobId]
        }
      }
      return job
    }))
  }

  const handleConfigureJob = (job: PipelineJob) => {
    setConfiguringJob(job)
  }

  const handleSaveJobConfig = (job: PipelineJob, yaml: string) => {
    setPipelineJobs(prev => prev.map(j => 
      j.id === job.id ? { ...j, yaml, configured: true } : j
    ))
  }

  const validatePipeline = () => {
    const requiredJobs = mission.validation?.requiredJobs || []
    
    // Check if all required jobs are present
    const presentJobsLower = pipelineJobs.map(job => job.name.toLowerCase())
    const missingJobs = requiredJobs.filter(job => !presentJobsLower.includes(job.toLowerCase()))
    
    // Check if jobs have proper dependencies
    let dependencyScore = 0
    const hasTestFirst = pipelineJobs.some(job => 
      job.name.toLowerCase() === 'test' && 
      pipelineJobs.filter(j => j.dependencies.includes(job.id)).length > 0
    )
    
    const hasBuildAfterTest = pipelineJobs.some(job => 
      job.name.toLowerCase() === 'build' && 
      job.dependencies.some(depId => {
        const depJob = pipelineJobs.find(j => j.id === depId)
        return depJob?.name.toLowerCase() === 'test'
      })
    )
    
    if (hasTestFirst) dependencyScore += 25
    if (hasBuildAfterTest) dependencyScore += 25
    
    // Check YAML configuration quality
    let yamlScore = 0
    pipelineJobs.forEach(job => {
      if (job.yaml.includes('runs-on: ubuntu-latest')) yamlScore += 10
      if (job.yaml.includes('uses: actions/checkout@v4')) yamlScore += 10
      if (job.yaml.includes('steps:')) yamlScore += 10
      if (job.configured) yamlScore += 10
    })
    
    const totalScore = Math.min(100 - (missingJobs.length * 20) + dependencyScore + yamlScore, 100)
    
    return {
      score: totalScore,
      missingJobs,
      dependencyScore,
      yamlScore,
      allJobsPresent: missingJobs.length === 0,
      properDependencies: dependencyScore >= 50,
      allConfigured: pipelineJobs.every(job => job.configured)
    }
  }

  const handleSubmit = () => {
    const validation = validatePipeline()
    const timeSpent = Date.now() - startTime
    setTimeSpentMs(timeSpent)
    setLastValidation(validation)
    setJobsAddedAtSubmit(pipelineJobs.length)
    
    updateMissionProgress(3, {
      completed: validation.allJobsPresent && validation.properDependencies && validation.allConfigured,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.allJobsPresent && validation.properDependencies && validation.allConfigured) {
      unlockNextMission()
    }
  }

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1)
  }

  const handleNextMission = () => {
    navigate('/')
  }

  if (gameCompleted) {
    const validation = lastValidation || validatePipeline()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">
            {validation.allJobsPresent && validation.properDependencies && validation.allConfigured ? '🏗️' : '🔧'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.allJobsPresent && validation.properDependencies && validation.allConfigured ? 'Pipeline Complete!' : 'Good Progress!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{jobsAddedAtSubmit}/{mission.validation?.requiredJobs?.length || 0}</div>
                <div className="text-sm text-gray-600">Jobs Added</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{Math.max(0, Math.round(timeSpentMs / 60000))}min</div>
                <div className="text-sm text-gray-600">Time Spent</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
                <div className="text-sm text-gray-600">Hints Used</div>
              </div>
            </div>
          </div>
          
          {validation.allJobsPresent && validation.properDependencies && validation.allConfigured ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Excellent! You've built a complete CI/CD pipeline with proper job dependencies and configuration.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Make sure you have all required jobs: {mission.validation?.requiredJobs?.join(', ')} and proper dependencies between them.
              </p>
            </div>
          )}
          
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
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="game-container p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  🏗️ Mission 3: Pipeline Architect
                </h1>
                <p className="text-gray-600">
                  Design a CI/CD pipeline by connecting job nodes and configuring YAML
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Hints Used</div>
                <div className="text-2xl font-bold text-orange-600">{hintsUsed}</div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="game-container p-6 mb-6"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">How to Build Your Pipeline</h2>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-2">1. Add Jobs</h3>
                      <p className="text-blue-700">Click jobs from the left panel to add them to your pipeline</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-800 mb-2">2. Connect Dependencies</h3>
                      <p className="text-green-700">Drag jobs onto each other to create dependencies (test → build → deploy)</p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h3 className="font-semibold text-purple-800 mb-2">3. Configure YAML</h3>
                      <p className="text-purple-700">Click "Configure" on each job to set up the YAML configuration</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                    <h3 className="font-semibold text-yellow-800 mb-1">What is a job?</h3>
                    <p className="text-yellow-800">
                      A job is a set of steps that runs on one runner machine. Jobs can depend on other jobs using <code className="font-mono">needs:</code> so they run in the right order.
                      In this mission you'll connect jobs like <span className="font-semibold">test → build → push → deploy</span> and fill in minimal YAML. Comments in the templates explain each line.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Side - Available Jobs */}
            <div className="space-y-6">
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Jobs</h2>
                <div className="grid grid-cols-1 gap-3">
                  {availableJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleJobDrop(job)}
                    >
                      <div className="text-sm font-semibold text-gray-800">{job.name}</div>
                      <div className="text-xs text-gray-600">{job.description}</div>
                      <div className="text-xs text-gray-500 mt-1">Click to add to pipeline</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Pipeline Canvas */}
            <div className="space-y-6">
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Pipeline Canvas</h2>
                <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg" style={{ height: '500px' }}>
                  {pipelineJobs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      <div className="text-center">
                        <div className="text-4xl mb-4">🏗️</div>
                        <p>Add jobs from the left panel to build your pipeline</p>
                      </div>
                    </div>
                  ) : (
                    pipelineJobs.map((job) => (
                      <JobNode
                        key={job.id}
                        job={job}
                        onConfigure={handleConfigureJob}
                        onConnect={handleJobConnect}
                      />
                    ))
                  )}
                </div>
                
                <div className="mt-4 flex justify-between">
                  <div className="text-sm text-gray-600">
                    Jobs: {pipelineJobs.length} | Configured: {pipelineJobs.filter(j => j.configured).length}
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit Pipeline
                  </button>
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

          {/* Pipeline Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="game-container p-6 mt-6"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">Pipeline Requirements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Required Jobs:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  {(mission.validation?.requiredJobs || []).map((job) => (
                    <li key={job} className="flex items-center">
                      <span className={`w-2 h-2 rounded-full mr-2 ${
                        pipelineJobs.some(j => j.name === job) ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      {job}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Job Dependencies:</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>• test → build → push → deploy</div>
                  <div>• lint can run parallel with test</div>
                  <div>• Configure each job with proper YAML</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* YAML Configuration Modal */}
        <YAMLConfigModal
          job={configuringJob}
          onClose={() => setConfiguringJob(null)}
          onSave={handleSaveJobConfig}
        />
      </div>
    </DndProvider>
  )
}

export default PipelineArchitect