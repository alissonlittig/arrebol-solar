import { useMemo, useState } from 'preact/hooks'
import { REGIONS, ROOFS, simulate, type Result } from './calc'

const brl = (n: number) => 'R$ ' + Math.round(n).toLocaleString('en-US')
const num = (n: number, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d })

function Chart({ r }: { r: Result }) {
  const W = 640, H = 260, P = { l: 56, r: 16, t: 16, b: 30 }
  const min = Math.min(...r.cumulative), max = Math.max(...r.cumulative)
  const span = max - min || 1
  const x = (i: number) => P.l + (i / 25) * (W - P.l - P.r)
  const y = (v: number) => P.t + (1 - (v - min) / span) * (H - P.t - P.b)
  const pts = r.cumulative.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const zero = y(0)
  const area = `${x(0)},${zero} ${pts} ${x(25)},${zero}`
  const ticks = [0, 5, 10, 15, 20, 25]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cumulative savings over 25 years, ending at ${brl(r.total25)}`} class="chart">
      {[min, 0, max].filter((v) => v === 0 || Math.abs(y(v) - zero) > 16 || false).map((v) => (
        <g key={v}>
          <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} class={v === 0 ? 'zero' : 'grid'} />
          <text x={P.l - 8} y={y(v) + 4} text-anchor="end">{(v / 1000).toFixed(0)}k</text>
        </g>
      ))}
      {ticks.map((t) => <text key={t} x={x(t)} y={H - 8} text-anchor="middle">{t === 0 ? 'now' : `y${t}`}</text>)}
      <polygon points={area} class="area" />
      <polyline points={pts} class="line" />
      {r.paybackYears !== null && (
        <g>
          <circle cx={x(r.paybackYears)} cy={zero} r="6" class="dot" />
          <text x={x(r.paybackYears)} y={zero - 14} text-anchor="middle" class="pb">payback · {r.paybackYears} yrs</text>
        </g>
      )}
    </svg>
  )
}

function Simulator() {
  const [bill, setBill] = useState(650)
  const [region, setRegion] = useState('se')
  const [roof, setRoof] = useState('ceramic')
  const r = useMemo(() => simulate({ bill, region, roof }), [bill, region, roof])
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')
  const valid = /^\S+@\S+\.\S+$/.test(email)

  return (
    <section id="simulator" class="sim-wrap" aria-labelledby="sim-h">
      <div class="wrap">
        <p class="eyebrow dark">Savings simulator</p>
        <h2 id="sim-h">See what your roof can do in thirty seconds.</h2>
        <p class="lead dark">Move the slider to your average monthly power bill. Estimates use fictional demo assumptions.</p>
        <div class="sim">
          <form class="inputs" onSubmit={(e) => e.preventDefault()}>
            <label for="bill">Average monthly bill <output>{brl(bill)}</output></label>
            <input id="bill" type="range" min="150" max="3000" step="10" value={bill} onInput={(e) => setBill(+e.currentTarget.value)} />
            <div class="range-ends"><span>R$ 150</span><span>R$ 3,000</span></div>
            <label for="region">Region</label>
            <select id="region" value={region} onChange={(e) => setRegion(e.currentTarget.value)}>
              {REGIONS.map((x) => <option value={x.id} key={x.id}>{x.name} · {x.sun} sun-hours/day</option>)}
            </select>
            <fieldset>
              <legend>Roof type</legend>
              <div class="seg">
                {ROOFS.map((x) => (
                  <label key={x.id} class={roof === x.id ? 'on' : ''}>
                    <input type="radio" name="roof" value={x.id} checked={roof === x.id} onChange={() => setRoof(x.id)} />
                    {x.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </form>
          <div class="out" aria-live="polite">
            <div class="kpis">
              <div class="kpi big"><span>Monthly savings</span><b>{brl(r.savingsMonth)}</b><small>first year, avg.</small></div>
              <div class="kpi"><span>System</span><b>{num(r.kwp, 2)} kWp</b><small>{r.panels} panels</small></div>
              <div class="kpi"><span>Investment</span><b>{brl(r.cost)}</b><small>installed</small></div>
              <div class="kpi"><span>Payback</span><b>{r.paybackYears === null ? '—' : `${r.paybackYears} yrs`}</b><small>with 5%/yr tariff rise</small></div>
              <div class="kpi"><span>25-year net</span><b>{brl(r.total25)}</b><small>after paying the system</small></div>
              <div class="kpi"><span>CO₂ avoided</span><b>{num(r.co2Year / 1000, 1)} t/yr</b><small>illustrative grid mix</small></div>
            </div>
            <Chart r={r} />
          </div>
        </div>
        <div class="cta-card">
          {sent ? (
            <p role="status"><b>Thanks!</b> This is a demo, so nothing was sent. In the real flow an engineer would reply within one business day.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); if (valid) setSent(true) }}>
              <div>
                <b>Want the detailed proposal for {num(r.kwp, 2)} kWp?</b>
                <p>Leave your email. Demo form: nothing is stored or sent.</p>
              </div>
              <input type="email" aria-label="Email address" placeholder="you@example.com" value={email} onInput={(e) => setEmail(e.currentTarget.value)} aria-invalid={email !== '' && !valid} />
              <button class="btn" type="submit" disabled={!valid}>Request proposal</button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

const STEPS = [
  ['01', 'Bill and roof review', 'We read twelve months of bills and survey the roof with drone imagery, shading and orientation included.'],
  ['02', 'Sized to your usage', 'No oversized systems. We size to your consumption and keep the grid availability fee in the math.'],
  ['03', 'Install in 2–3 days', 'Certified crews, tier-one panels, microinverters on request. Grid approval is handled for you.'],
  ['04', 'Monitor and maintain', 'A live app shows generation per panel. Yearly cleaning and inspection are included for five years.'],
]
const CASES = [
  ['Casa Pinheiro', '5.5 kWp · Curitiba', 'R$ 780 → R$ 112', 'Payback 5.4 yrs'],
  ['Padaria Trigal', '16.5 kWp · Goiânia', 'R$ 2,350 → R$ 310', 'Payback 4.9 yrs'],
  ['Sítio Boa Vista', '8.8 kWp · Petrolina', 'R$ 1,120 → R$ 105', 'Payback 4.2 yrs'],
]
const FAQ = [
  ['How accurate is the simulator?', 'It is a first estimate based on regional sun-hours, a typical tariff and an 80% performance ratio. A site survey refines it.'],
  ['What happens on cloudy days or at night?', 'You draw from the grid and are billed for the difference. Surplus generated by day becomes credits for later.'],
  ['Does the system need maintenance?', 'Very little. Panels are rinsed by rain in most regions; we schedule an annual inspection and cleaning for dusty areas.'],
  ['Is this a real company?', 'No. Arrebol Solar is a fictional brand created for a portfolio demo. Prices, numbers and people are made up.'],
]

export function App() {
  return (
    <>
      <a class="skip" href="#simulator">Skip to simulator</a>
      <header class="top">
        <div class="wrap bar">
          <a class="logo" href="#top" aria-label="Arrebol Solar home">
            <svg width="26" height="26" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="38" r="14" fill="#f4a73b" /><path d="M6 50h52M32 8v8M12 18l6 6M52 18l-6 6" stroke="#f4a73b" stroke-width="5" stroke-linecap="round" /></svg>
            Arrebol <i>Solar</i>
          </a>
          <nav aria-label="Main"><a href="#how">Process</a><a href="#proof">Results</a><a href="#faq">FAQ</a><a class="btn sm" href="#simulator">Simulate</a></nav>
        </div>
      </header>
      <main id="top">
        <section class="hero">
          <div class="wrap hero-in">
            <div>
              <p class="eyebrow">Independent solar consulting</p>
              <h1>Stop renting your electricity from the grid.</h1>
              <p class="lead">We design rooftop solar around your actual bill, tell you the honest payback, and only build when the numbers work.</p>
              <div class="cta"><a class="btn" href="#simulator">Estimate my savings</a><a class="ghost" href="#how">How we work</a></div>
              <ul class="stats"><li><b>1,240</b>homes designed*</li><li><b>5.8 yrs</b>median payback*</li><li><b>96%</b>quote accuracy*</li></ul>
            </div>
            <div class="sun" aria-hidden="true"><div class="orb" /><div class="panel-grid">{Array.from({ length: 24 }, (_, i) => <i key={i} />)}</div></div>
          </div>
          <p class="wrap fine">* Fictional demo figures for a portfolio project.</p>
        </section>

        <Simulator />

        <section id="how" class="sec">
          <div class="wrap">
            <p class="eyebrow dark">Process</p>
            <h2>From bill to first kilowatt-hour.</h2>
            <ol class="steps">{STEPS.map(([n, t, d]) => <li key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></li>)}</ol>
          </div>
        </section>

        <section id="proof" class="sec alt">
          <div class="wrap">
            <p class="eyebrow dark">Results</p>
            <h2>Sample projects (fictional).</h2>
            <div class="cases">
              {CASES.map(([n, s, b, p]) => (
                <article key={n}><h3>{n}</h3><p class="muted">{s}</p><p class="bill">{b}</p><p class="tag">{p}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" class="sec">
          <div class="wrap narrow">
            <p class="eyebrow dark">FAQ</p>
            <h2>Straight answers.</h2>
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </section>
      </main>
      <footer class="foot"><div class="wrap"><b>Arrebol Solar</b>: fictional brand, portfolio demo by Alisson Littig. No real quotes, people or data. <a href="https://alissonlittig.github.io/">Back to portfolio</a></div></footer>
    </>
  )
}
