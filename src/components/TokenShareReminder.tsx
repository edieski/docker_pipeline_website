import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/gameStore'

// Shows a non-intrusive reminder every 10 minutes prompting the student
// to copy a fresh progress token and share it with the instructor.
const TEN_MIN_MS = 10 * 60 * 1000

const TokenShareReminder: React.FC = () => {
  const { player } = useGameStore()
  const [visible, setVisible] = React.useState(false)
  const [token, setToken] = React.useState('')
  const [copied, setCopied] = React.useState(false)

  // Generate a token whenever we show the reminder
  const refreshToken = React.useCallback(() => {
    try {
      const t = useGameStore.getState().generateProgressToken()
      setToken(t)
    } catch {
      setToken('')
    }
  }, [])

  // Schedule reminder every 10 minutes while a player exists
  React.useEffect(() => {
    if (!player) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const schedule = () => {
      timer = setTimeout(() => {
        if (cancelled) return
        refreshToken()
        setCopied(false)
        setVisible(true)
      }, TEN_MIN_MS)
    }

    // Start the cycle
    schedule()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [player, refreshToken])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  // When user dismisses, re-arm the next reminder
  const dismiss = () => {
    if (copied) {
      setVisible(false)
    }
  }

  if (!player) return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4"
        >
          <div className="max-w-2xl w-full bg-white border border-blue-200 shadow-xl rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📩</div>
              <div className="flex-1">
                <div className="font-semibold text-gray-800 mb-1">Share your progress with the instructor</div>
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-semibold">Action required:</span> Copy this token and paste it in the call chat now. You will be reminded every 10 minutes.
                </div>
                <textarea
                  value={token}
                  readOnly
                  className="w-full h-24 p-2 border rounded font-mono text-xs bg-gray-50"
                />
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {copied ? '✅ Copied — now paste in the call chat' : '📋 Copy token'}
                  </button>
                  <button
                    onClick={dismiss}
                    className={`px-3 py-2 rounded ${copied ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    disabled={!copied}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default TokenShareReminder


