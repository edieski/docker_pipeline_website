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
  yaml: string
  dependencies: string[]
  position: { x: number; y: number }
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
        width: '120px',
        height: '80px'
      }}
    >
      <div className="bg-white border-2 border-blue-500 rounded-lg p-3 cursor-pointer hover:shadow-lg transition-shadow">
        <div className="text-sm font-semibold text-center text-gray-800 mb-2">
          {job.name}
        </div>
        <div className="text-xs text-gray-600 text-center">
          {job.dependencies.length} deps
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onConfigure(job)
          }}
          className="w-full mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
        >
          Configure
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

  useEffect(() => {
    if (job) {
      setYaml(job.yaml)
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
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Configure {job.name} Job
        </h3>
        
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            YAML Configuration:
          </label>
          <textarea
            value={yaml}
            onChange={(e) => setYaml(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder="Enter YAML configuration..."
          />
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

const PipelineArchitect: React.FC = () => {
  const navigate = useNavigate()
  const { player, updateMissionProgress, unlockNextMission } = useGameStore()
  const [availableJobs, setAvailableJobs] = useState<PipelineJob[]>([])
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([])
  const [gameCompleted, setGameCompleted] = useState(false)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [startTime] = useState(Date.now())
  const [configuringJob, setConfiguringJob] = useState<PipelineJob | null>(null)

  const mission = missionsData.missions.find(m => m.id === 3)
  
  if (!mission || !player) {
    navigate('/')
    return null
  }

  useEffect(() => {
    // Initialize available jobs based on mission data
    const requiredJobs = mission.validation?.requiredJobs || []
    const yamlTemplate = mission.validation?.yamlTemplate as Record<string, string> || {}
    
    const jobs = requiredJobs.map((jobName, index) => ({
      id: `job-${jobName}`,
      name: jobName,
      type: 'job' as const,
      yaml: yamlTemplate[jobName] || `name: ${jobName}\nruns-on: ubuntu-latest\nsteps:\n  - run: echo "Hello ${jobName}"`,
      dependencies: [],
      position: { x: 50 + (index * 150), y: 100 }
    }))
    
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
      j.id === job.id ? { ...j, yaml } : j
    ))
  }

  const validatePipeline = () => {
    const requiredJobs = mission.validation?.requiredJobs || []
    
    // Check if all required jobs are present
    const presentJobs = pipelineJobs.map(job => job.name)
    const missingJobs = requiredJobs.filter(job => !presentJobs.includes(job))
    
    // Check if jobs have proper dependencies
    let dependencyScore = 0
    const hasTestFirst = pipelineJobs.some(job => 
      job.name === 'test' && 
      pipelineJobs.filter(j => j.dependencies.includes(job.id)).length > 0
    )
    
    const hasBuildAfterTest = pipelineJobs.some(job => 
      job.name === 'build' && 
      job.dependencies.some(depId => {
        const depJob = pipelineJobs.find(j => j.id === depId)
        return depJob?.name === 'test'
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
    })
    
    const totalScore = Math.min(100 - (missingJobs.length * 20) + dependencyScore + yamlScore, 100)
    
    return {
      score: totalScore,
      missingJobs,
      dependencyScore,
      yamlScore,
      allJobsPresent: missingJobs.length === 0,
      properDependencies: dependencyScore >= 50
    }
  }

  const handleSubmit = () => {
    const validation = validatePipeline()
    const timeSpent = Date.now() - startTime
    
    updateMissionProgress(3, {
      completed: validation.allJobsPresent && validation.properDependencies,
      timeSpent,
      hintsUsed,
      score: validation.score
    })
    
    setGameCompleted(true)
    
    if (validation.allJobsPresent && validation.properDependencies) {
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
    const validation = validatePipeline()
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="game-container max-w-2xl w-full p-8 text-center"
        >
          <div className="text-6xl mb-6">
            {validation.allJobsPresent && validation.properDependencies ? '🏗️' : '🔧'}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            {validation.allJobsPresent && validation.properDependencies ? 'Pipeline Complete!' : 'Good Progress!'}
          </h1>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{validation.score}/100</div>
                <div className="text-sm text-gray-600">Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{pipelineJobs.length}/{mission.validation?.requiredJobs?.length || 0}</div>
                <div className="text-sm text-gray-600">Jobs Added</div>
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
          
          {validation.allJobsPresent && validation.properDependencies ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">
                🎯 Excellent! You've built a complete CI/CD pipeline with proper job dependencies and configuration.
              </p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">
                💡 Close! Make sure you have all required jobs: {mission.validation?.requiredJobs?.join(', ')} and proper dependencies between them.
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
        <div className="max-w-6xl mx-auto">
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

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Game Area */}
            <div className="space-y-6">
              {/* Available Jobs */}
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Available Jobs</h2>
                <div className="grid grid-cols-2 gap-3">
                  {availableJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-gray-50 border border-gray-300 rounded-lg p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleJobDrop(job)}
                    >
                      <div className="text-sm font-semibold text-gray-800">{job.name}</div>
                      <div className="text-xs text-gray-600">Click to add to pipeline</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pipeline Canvas */}
              <div className="game-container p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Pipeline Canvas</h2>
                <div className="relative bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg" style={{ height: '400px' }}>
                  {pipelineJobs.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Drag jobs here to build your pipeline
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
                
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Submit Pipeline
                  </button>
                </div>
              </div>
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
