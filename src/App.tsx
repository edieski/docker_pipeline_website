import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useGameStore } from './store/gameStore'
import TestStyling from './components/TestStyling'
import DifficultySelector from './components/DifficultySelector'
import MissionSelect from './components/MissionSelect'
import IntroScreen from './components/IntroScreen'
import DockerfileJigsaw from './components/games/DockerfileJigsaw'
import { CacheCrash, PipelineArchitect, LogDetective, DeployOrDie, OutageSimulator } from './components/games'
import InstructorDashboard from './components/InstructorDashboard'
import VictoryScreen from './components/VictoryScreen'

function App() {
  const { player } = useGameStore()

  return (
    <Router>
      <div className="min-h-screen force-styling">
        <Routes>
          {/* Public routes */}
          <Route path="/instructor" element={<InstructorDashboard />} />
          <Route path="/difficulty" element={<DifficultySelector />} />
          
          {/* Game routes - require player */}
          <Route 
            path="/" 
            element={player ? <MissionSelect /> : <TestStyling />} 
          />
          
          {/* Mission intro screens */}
          <Route path="/intro/:missionId" element={<IntroScreen />} />
          
          {/* Game screens */}
          <Route path="/game/1" element={<DockerfileJigsaw />} />
          <Route path="/game/2" element={<CacheCrash />} />
          <Route path="/game/3" element={<PipelineArchitect />} />
          <Route path="/game/4" element={<LogDetective />} />
          <Route path="/game/5" element={<DeployOrDie />} />
          <Route path="/game/6" element={<OutageSimulator />} />
          
          {/* Victory screen */}
          <Route path="/victory" element={<VictoryScreen />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
