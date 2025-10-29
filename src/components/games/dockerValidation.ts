export const CATEGORY_UUID = {
  FROM: '11111111-1111-4111-8111-111111111111',
  WORKDIR: '22222222-2222-4222-8222-222222222222',
  COPY_REQS: '33333333-3333-4333-8333-333333333333',
  RUN_PIP: '44444444-4444-4444-8444-444444444444',
  COPY_APP: '55555555-5555-4555-8555-555555555555',
  EXPOSE: '66666666-6666-4666-8666-666666666666',
  CMD: '77777777-7777-4777-8777-777777777777',
  EXTRA: '88888888-8888-4888-8888-888888888888'
} as const

export const LABEL_BY_UUID: Record<string, string> = {
  [CATEGORY_UUID.FROM]: 'FROM',
  [CATEGORY_UUID.WORKDIR]: 'WORKDIR',
  [CATEGORY_UUID.COPY_REQS]: 'COPY requirements.txt',
  [CATEGORY_UUID.RUN_PIP]: 'RUN pip install',
  [CATEGORY_UUID.COPY_APP]: 'COPY .',
  [CATEGORY_UUID.EXPOSE]: 'EXPOSE',
  [CATEGORY_UUID.CMD]: 'CMD',
  [CATEGORY_UUID.EXTRA]: 'EXTRA'
}

export const LABEL_TO_UUID: Record<string, string> = {
  'FROM': CATEGORY_UUID.FROM,
  'WORKDIR': CATEGORY_UUID.WORKDIR,
  'COPY requirements.txt': CATEGORY_UUID.COPY_REQS,
  'RUN pip install': CATEGORY_UUID.RUN_PIP,
  'COPY .': CATEGORY_UUID.COPY_APP,
  'EXPOSE': CATEGORY_UUID.EXPOSE,
  'CMD': CATEGORY_UUID.CMD
}

export const classify = (text: string): string => {
  const t = text.trim().toUpperCase()
  if (t.startsWith('FROM')) return CATEGORY_UUID.FROM
  if (t.startsWith('WORKDIR')) return CATEGORY_UUID.WORKDIR
  if (t.startsWith('COPY REQUIREMENTS.TXT')) return CATEGORY_UUID.COPY_REQS
  if (t.startsWith('RUN PIP INSTALL')) return CATEGORY_UUID.RUN_PIP
  if (t.startsWith('COPY .')) return CATEGORY_UUID.COPY_APP
  if (t.startsWith('EXPOSE')) return CATEGORY_UUID.EXPOSE
  if (t.startsWith('CMD')) return CATEGORY_UUID.CMD
  return CATEGORY_UUID.EXTRA
}

export const mapRequiredOrderToUUID = (requiredOrder: string[]): string[] => {
  return requiredOrder.map((r) => LABEL_TO_UUID[(r || '').trim()] || CATEGORY_UUID.EXTRA)
}

export interface ValidationResult {
  score: number
  correctCount: number
  total: number
  feedback: string[]
  success: boolean
}

export const validateOrder = (
  placedKeyIds: (string | null)[],
  requiredOrderLabels: string[]
): ValidationResult => {
  const requiredOrder = mapRequiredOrderToUUID(requiredOrderLabels)
  const currentOrder = placedKeyIds

  let score = 0
  let feedback: string[] = []
  let correctCount = 0

  for (let i = 0; i < requiredOrder.length; i++) {
    const required = requiredOrder[i]
    const placed = currentOrder[i]
    if (placed) {
      if (placed === required) {
        correctCount++
        score += 20
        feedback.push(`✅ Step ${i + 1}: Correct!`)
      } else {
        const expectedLabel = LABEL_BY_UUID[required || ''] || requiredOrderLabels[i] || 'Unknown'
        const gotLabel = LABEL_BY_UUID[placed || ''] || 'Unknown'
        feedback.push(`❌ Step ${i + 1}: Expected "${expectedLabel}" , got "${gotLabel}"`)
      }
    } else {
      const expectedLabel = LABEL_BY_UUID[required || ''] || requiredOrderLabels[i] || 'Unknown'
      feedback.push(`❌ Step ${i + 1}: Missing "${expectedLabel}"`)
    }
  }

  if (placedKeyIds.every((b) => b !== null)) {
    score += 10
    feedback.push('✅ All slots filled!')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    correctCount,
    total: requiredOrder.length,
    feedback,
    success: correctCount === requiredOrder.length && placedKeyIds.every((b) => b !== null)
  }
}


