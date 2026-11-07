import { describe, expect, it } from 'vitest'
import { simulate } from './calc'

describe('simulate', () => {
  it('sizes a typical bill', () => {
    const r = simulate({ bill: 600, region: 'se', roof: 'ceramic' })
    expect(r.panels).toBeGreaterThan(5)
    expect(r.kwp).toBeCloseTo(r.panels * 0.55, 2)
    expect(r.paybackYears).not.toBeNull()
    expect(r.paybackYears!).toBeGreaterThan(2)
    expect(r.paybackYears!).toBeLessThan(8)
    expect(r.total25).toBeGreaterThan(0)
    expect(r.cumulative).toHaveLength(26)
  })
  it('handles zero and invalid bills', () => {
    for (const bill of [0, -5, NaN]) {
      const r = simulate({ bill, region: 'ne', roof: 'metal' })
      expect(r.panels).toBe(0)
      expect(r.paybackYears).toBeNull()
    }
  })
  it('costs more on ground mounts', () => {
    const a = simulate({ bill: 800, region: 's', roof: 'ceramic' })
    const b = simulate({ bill: 800, region: 's', roof: 'ground' })
    expect(b.cost).toBeGreaterThan(a.cost)
  })
})
