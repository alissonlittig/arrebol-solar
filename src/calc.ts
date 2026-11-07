// All figures are fictional demo assumptions (BRL), not real quotes.
export type Region = { id: string; name: string; sun: number; tariff: number }

export const REGIONS: Region[] = [
  { id: 'ne', name: 'Northeast', sun: 5.6, tariff: 0.92 },
  { id: 'co', name: 'Midwest', sun: 5.4, tariff: 0.96 },
  { id: 'se', name: 'Southeast', sun: 5.0, tariff: 1.02 },
  { id: 'n', name: 'North', sun: 4.8, tariff: 1.08 },
  { id: 's', name: 'South', sun: 4.5, tariff: 0.98 },
]

export const ROOFS = [
  { id: 'ceramic', name: 'Ceramic tile', factor: 1.0 },
  { id: 'metal', name: 'Metal sheet', factor: 0.94 },
  { id: 'slab', name: 'Concrete slab', factor: 1.06 },
  { id: 'ground', name: 'Ground mount', factor: 1.12 },
]

const PERF = 0.8 // performance ratio
const MIN_KWH = 100 // grid availability fee stays billed
const PANEL_KWP = 0.55
const PRICE_KWP = 6200
const TARIFF_GROWTH = 0.05
const DEGRADATION = 0.007
const YEARS = 25
const CO2_PER_KWH = 0.085 // kg, grid average (illustrative)

export type Input = { bill: number; region: string; roof: string }

export type Result = {
  kwhMonth: number
  kwp: number
  panels: number
  genMonth: number
  cost: number
  savingsMonth: number
  savingsYear1: number
  paybackYears: number | null
  total25: number
  co2Year: number
  cumulative: number[] // index 0 = year 0 (-cost)
}

export function simulate({ bill, region, roof }: Input): Result {
  const r = REGIONS.find((x) => x.id === region) ?? REGIONS[0]
  const f = ROOFS.find((x) => x.id === roof)?.factor ?? 1
  const b = Math.max(0, Number.isFinite(bill) ? bill : 0)
  const kwhMonth = b / r.tariff
  const offsetKwh = Math.max(0, kwhMonth - MIN_KWH)
  const perKwp = r.sun * 30 * PERF
  const panels = Math.max(offsetKwh > 0 ? 2 : 0, Math.ceil(offsetKwh / perKwp / PANEL_KWP))
  const kwp = +(panels * PANEL_KWP).toFixed(2)
  const genMonth = kwp * perKwp
  const cost = Math.round(kwp * PRICE_KWP * f)
  const cumulative = [-cost]
  let acc = -cost
  let paybackYears: number | null = null
  let savingsYear1 = 0
  for (let y = 1; y <= YEARS; y++) {
    const gain = genMonth * 12 * Math.pow(1 - DEGRADATION, y - 1) * r.tariff * Math.pow(1 + TARIFF_GROWTH, y - 1)
    if (y === 1) savingsYear1 = gain
    const prev = acc
    acc += gain
    if (paybackYears === null && acc >= 0 && cost > 0) paybackYears = +(y - 1 + -prev / gain).toFixed(1)
    cumulative.push(acc)
  }
  return {
    kwhMonth, kwp, panels, genMonth, cost,
    savingsMonth: savingsYear1 / 12, savingsYear1, paybackYears,
    total25: acc, co2Year: genMonth * 12 * CO2_PER_KWH, cumulative,
  }
}
