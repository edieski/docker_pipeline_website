import React from 'react'
import { useNavigate } from 'react-router-dom'

const TestStyling: React.FC = () => {
  const navigate = useNavigate()

  const handleLaunchMission = () => {
    console.log('Launch Mission button clicked!')
    alert('Starting the adventure!')
    navigate('/difficulty')
  }

  return (
    <div 
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 25%, #8b5cf6 50%, #ec4899 75%, #f59e0b 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '600px',
          width: '100%'
        }}
      >
        <div
          style={{
            fontSize: '6rem',
            marginBottom: '20px',
            animation: 'float 3s ease-in-out infinite'
          }}
        >
          🚀
        </div>
        <h1
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: '3rem',
            fontWeight: 'bold',
            marginBottom: '20px'
          }}
        >
          Operation Deploy the Python
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#374151', marginBottom: '30px' }}>
          DevOps Escape Room Adventure
        </p>
        <button
          onClick={handleLaunchMission}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            padding: '16px 32px',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 25px 50px rgba(59, 130, 246, 0.25)',
            animation: 'glow 2s ease-in-out infinite'
          }}
        >
          🚀 Launch Mission
        </button>
      </div>
    </div>
  )
}

export default TestStyling
