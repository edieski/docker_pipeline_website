import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface TechTerm {
  term: string
  definition: string
  // Case-insensitive variants
  variants?: string[]
}

const TECH_TERMS: TechTerm[] = [
  {
    term: 'caching',
    definition: "Docker's way of remembering what each layer built. When Docker builds your image, it creates a 'layer' for each instruction. If the files haven't changed since the last build, Docker reuses the saved result instead of rebuilding it. This makes builds much faster!",
    variants: ['cache', 'cached', 'caches', 'cache layer', 'layer caching']
  },
  {
    term: 'dependencies',
    definition: "External packages your application needs to run (like Flask, requests, pandas - listed in requirements.txt). They're usually listed in requirements.txt and don't change often, so putting them in Dockerfile layers before your code means those layers get cached and reused.",
    variants: ['dependency', 'dependency cache', 'deps']
  },
  {
    term: 'layer',
    definition: "Each Dockerfile instruction creates a 'layer' - like a saved snapshot of that step. Docker builds layers in order and can reuse unchanged layers from previous builds, which speeds up builds.",
    variants: ['layers', 'layer caching']
  },
  {
    term: 'Dockerfile',
    definition: "A text file with instructions for building a Docker image. It tells Docker what base image to use, what files to copy, what commands to run, and how to start your application.",
    variants: []
  },
  {
    term: 'requirements.txt',
    definition: "A file that lists all the Python packages (dependencies) your application needs. Each line contains a package name and optionally a version number. Used by pip install to install all dependencies at once.",
    variants: ['requirements', 'requirements file']
  },
  {
    term: 'pip install',
    definition: "A command that installs Python packages from PyPI (Python Package Index). In Dockerfiles, it's used to install dependencies listed in requirements.txt so your application can run.",
    variants: ['pip', 'pip install']
  },
  {
    term: 'container',
    definition: "A running instance of a Docker image. It's like a lightweight virtual machine that runs your application in isolation with everything it needs.",
    variants: ['containers', 'containerize']
  },
  {
    term: 'image',
    definition: "A read-only template for creating containers. Built from a Dockerfile. Can be stored in a registry and pulled to run on any machine.",
    variants: ['images', 'Docker image']
  },
  {
    term: 'CI/CD',
    definition: "Continuous Integration/Continuous Deployment - automated systems that test & deploy your code automatically when you push to GitHub. CI runs tests, CD deploys to production.",
    variants: ['CI', 'CD', 'continuous integration', 'continuous deployment', 'pipeline']
  },
  {
    term: 'pipeline',
    definition: "An automated sequence of steps (test → build → deploy) that runs when you push code. GitHub Actions, GitLab CI, and other tools run pipelines to ensure code quality.",
    variants: ['CI/CD pipeline']
  },
  {
    term: 'registry',
    definition: "A service that stores Docker images (like Docker Hub, GitHub Container Registry). You push images to registries and pull them when deploying to servers.",
    variants: ['container registry', 'image registry']
  },
  {
    term: 'deployment',
    definition: "The process of taking your built application and running it on a server where users can access it. Usually involves pulling an image from a registry and running it as a container.",
    variants: ['deploy', 'deploying']
  },
  {
    term: 'environment variables',
    definition: "Configuration values stored outside your code (like API keys, database URLs). Used to configure the same image differently for dev, staging, and production environments.",
    variants: ['env vars', 'env variables', 'environment variable']
  },
  {
    term: 'YAML',
    definition: "A human-readable data format often used for configuration files. Used in GitHub Actions workflows, Docker Compose files, and CI/CD pipeline definitions.",
    variants: ['yaml']
  },
  {
    term: 'invalidates',
    definition: "When a layer changes, Docker 'invalidates' (breaks) the cache for that layer and all layers that come after it. This means Docker has to rebuild those layers instead of reusing cached results.",
    variants: ['invalidate', 'invalidated', 'cache invalidation']
  }
]

interface TechTermTooltipProps {
  text: string
  className?: string
}

const TechTermTooltip: React.FC<TechTermTooltipProps> = ({ text, className = '' }) => {
  const [hoveredTerm, setHoveredTerm] = useState<string | null>(null)
  const [clickedTerm, setClickedTerm] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Find all technical terms in the text
  const findTechTerms = (text: string): Array<{ term: TechTerm; startIndex: number; length: number }> => {
    const found: Array<{ term: TechTerm; startIndex: number; length: number }> = []

    TECH_TERMS.forEach(techTerm => {
      // Check main term and variants
      const termsToCheck = [techTerm.term, ...(techTerm.variants || [])]
      
      termsToCheck.forEach(term => {
        const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        let match
        while ((match = regex.exec(text)) !== null) {
          found.push({
            term: techTerm,
            startIndex: match.index,
            length: match[0].length
          })
        }
      })
    })

    // Sort by start index and remove overlaps (keep longer matches)
    found.sort((a, b) => {
      if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex
      return b.length - a.length
    })

    // Remove overlapping matches
    const filtered: typeof found = []
    for (let i = 0; i < found.length; i++) {
      const current = found[i]
      const overlaps = filtered.some(existing => 
        (current.startIndex >= existing.startIndex && current.startIndex < existing.startIndex + existing.length) ||
        (existing.startIndex >= current.startIndex && existing.startIndex < current.startIndex + current.length)
      )
      if (!overlaps) {
        filtered.push(current)
      }
    }

    return filtered
  }

  const handleTermHover = (term: TechTerm, event: React.MouseEvent<HTMLSpanElement>) => {
    setHoveredTerm(term.term)
    const rect = event.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (containerRect) {
      setTooltipPosition({
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 10
      })
    }
  }

  const handleTermClick = (term: TechTerm, event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation()
    if (clickedTerm === term.term) {
      setClickedTerm(null)
    } else {
      setClickedTerm(term.term)
      const rect = event.currentTarget.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      if (containerRect) {
        setTooltipPosition({
          x: rect.left - containerRect.left + rect.width / 2,
          y: rect.top - containerRect.top - 10
        })
      }
    }
  }

  const renderTextWithTooltips = () => {
    const foundTerms = findTechTerms(text)
    if (foundTerms.length === 0) {
      return <span>{text}</span>
    }

    const parts: Array<{ text: string; term?: TechTerm; isTerm: boolean }> = []
    let lastIndex = 0

    foundTerms.forEach(({ term, startIndex, length }) => {
      // Add text before the term
      if (startIndex > lastIndex) {
        parts.push({ text: text.substring(lastIndex, startIndex), isTerm: false })
      }
      // Add the term
      parts.push({ 
        text: text.substring(startIndex, startIndex + length), 
        term, 
        isTerm: true 
      })
      lastIndex = startIndex + length
    })

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), isTerm: false })
    }

    return (
      <>
        {parts.map((part, index) => {
          if (part.isTerm && part.term) {
            const isActive = hoveredTerm === part.term.term || clickedTerm === part.term.term
            return (
              <span
                key={index}
                onMouseEnter={(e) => handleTermHover(part.term!, e)}
                onMouseLeave={() => setHoveredTerm(null)}
                onClick={(e) => handleTermClick(part.term!, e)}
                className={`cursor-help underline decoration-dotted decoration-blue-500 decoration-2 underline-offset-2 ${
                  isActive ? 'text-blue-600 font-semibold' : 'text-blue-600'
                }`}
                title={`Click or hover for definition: ${part.term.term}`}
              >
                {part.text}
              </span>
            )
          }
          return <span key={index}>{part.text}</span>
        })}
      </>
    )
  }

  const activeTerm = hoveredTerm || clickedTerm
  const activeTermData = TECH_TERMS.find(t => t.term === activeTerm)

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {renderTextWithTooltips()}
      
      <AnimatePresence>
        {activeTerm && activeTermData && tooltipPosition && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 max-w-xs bg-blue-900 text-white text-sm rounded-lg p-3 shadow-xl pointer-events-none"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
            onMouseEnter={() => setHoveredTerm(activeTerm)} // Keep tooltip open on hover
          >
            <div className="font-semibold mb-1 text-blue-200">{activeTermData.term}</div>
            <div className="text-blue-50 leading-relaxed">{activeTermData.definition}</div>
            {clickedTerm === activeTerm && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setClickedTerm(null)
                }}
                className="absolute top-1 right-1 text-blue-300 hover:text-white text-xs"
                aria-label="Close tooltip"
              >
                ×
              </button>
            )}
            {/* Arrow pointing down */}
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-blue-900"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default TechTermTooltip

