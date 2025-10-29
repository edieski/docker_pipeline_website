import { describe, it, expect } from 'vitest'
import missions from '../../../missions.json'
import { classify, validateOrder, mapRequiredOrderToUUID } from '../dockerValidation'

const mission1 = missions.missions.find((m) => m.id === 1)!

describe('Dockerfile validation (UUID-based)', () => {
  it('passes when placed order matches required order (using UUIDs)', () => {
    const requiredLabels = mission1.validation!.requiredOrder
    const requiredUUIDs = mapRequiredOrderToUUID(requiredLabels)

    // Build placed sequence by classifying the exact instructions that correspond
    const instructions = mission1.validation!.blocks
    const picked = [
      'FROM python:3.12-slim',
      'WORKDIR /app',
      'COPY requirements.txt .',
      'RUN pip install --no-cache-dir -r requirements.txt',
      'COPY . .',
      'EXPOSE 8000',
      'CMD ["python", "app.py"]'
    ]
    const placed = picked.map((s) => classify(s))

    const result = validateOrder(placed, requiredLabels)
    expect(result.success).toBe(true)
    expect(result.correctCount).toBe(requiredUUIDs.length)
    expect(result.score).toBeGreaterThanOrEqual(100 - 10) // without the bonus check exact points may vary
  })

  it('fails when order is incorrect', () => {
    const requiredLabels = mission1.validation!.requiredOrder
    // swap first two
    const wrongPlaced = [
      classify('WORKDIR /app'),
      classify('FROM python:3.12-slim'),
      classify('COPY requirements.txt .'),
      classify('RUN pip install --no-cache-dir -r requirements.txt'),
      classify('COPY . .'),
      classify('EXPOSE 8000'),
      classify('CMD ["python", "app.py"]')
    ]
    const result = validateOrder(wrongPlaced, requiredLabels)
    expect(result.success).toBe(false)
    expect(result.correctCount).toBeLessThan(requiredLabels.length)
  })

  it('treats "COPY ." and "COPY . ." consistently', () => {
    expect(classify('COPY . .')).toEqual(classify('COPY .'))
  })
})


