import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Home, BookOpen, Activity, Target,
  Trash2, Droplet, Flame, ChevronRight, Sparkles,
  Search, X, Pencil
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid
} from 'recharts';
import { FOODS, POPULAR_IDS, searchFoods, computeMacros, unitLabel } from './foods.js';

// ─── Brand palette ─────────────────────────────────────────────────────────
const C = {
  navy: '#0A1628',
  navyMid: '#10223D',
  navyCard: '#172E50',
  navyBorder: 'rgba(201,169,97,0.18)',
  gold: '#C9A961',
  goldBright: '#E5C76B',
  goldDim: '#8B7340',
  cream: '#F5F1E8',
  mute: '#8FA0BA',
  protein: '#E08766',
  carbs: '#7BA098',
  fat: '#C9A961',
};

// ─── Storage helpers (localStorage, persistent on device) ──────────────────
const storage = {
  async get(key, fallback) {
    try {
      const r = localStorage.getItem(key);
      return r ? JSON.parse(r) : fallback;
    } catch { return fallback; }
  },
  async set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error('storage:set failed', e); }
  },
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const mealsKey = () => `meals:${todayStr()}`;
const waterKey = () => `water:${todayStr()}`;

const DEFAULT_GOALS = { calories: 2200, protein: 180, carbs: 200, fat: 65 };

// ─── Macro Ring ────────────────────────────────────────────────────────────
function MacroRing({ label, current, target, color, size = 96, stroke = 8, big = false }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(current / Math.max(target, 1), 1);
  const offset = circ * (1 - pct);
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke="rgba(201,169,97,0.13)" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(.2,.7,.2,1)' }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div style={{
            color: C.cream,
            fontFamily: 'Fraunces, Georgia, serif',
            fontWeight: 500,
            fontSize: big ? 40 : 20,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>{Math.round(current)}</div>
          <div style={{ color: C.mute, fontSize: big ? 12 : 10, marginTop: big ? 6 : 2 }}>
            of {target}{label === 'Calories' ? '' : 'g'}
          </div>
        </div>
      </div>
      {!big && (
        <div className="mt-3" style={{
          color: C.gold, fontSize: 10, letterSpacing: '0.18em',
          textTransform: 'uppercase', fontWeight: 500,
        }}>{label}</div>
      )}
    </div>
  );
}

// ─── Reusable card ─────────────────────────────────────────────────────────
function Card({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{
      backgroundColor: C.navyCard,
      border: `1px solid ${C.navyBorder}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      ...style,
    }}>{children}</div>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────
function Header({ name }) {
  const h = new Date().getHours();
  const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  return (
    <div className="pt-10 pb-6 px-6">
      <div style={{
        color: C.gold, fontSize: 10, letterSpacing: '0.3em',
        textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
      }}>{dateStr}</div>
      <div style={{
        fontFamily: 'Fraunces, Georgia, serif',
        color: C.cream, fontSize: 30, fontWeight: 400,
        letterSpacing: '-0.02em', lineHeight: 1.1,
      }}>
        {greet},<br/>
        <span style={{ fontStyle: 'italic', color: C.goldBright }}>{name || 'friend'}.</span>
      </div>
      <div style={{
        marginTop: 18, height: 1,
        background: `linear-gradient(to right, ${C.gold}, transparent)`,
      }}/>
    </div>
  );
}

// ─── TODAY VIEW ────────────────────────────────────────────────────────────
function TodayView({ meals, goals, water, setWater, onAdd, onDelete }) {
  const totals = useMemo(() => meals.reduce((a, m) => ({
    cal: a.cal + (+m.cal || 0),
    p:   a.p   + (+m.p   || 0),
    c:   a.c   + (+m.c   || 0),
    f:   a.f   + (+m.f   || 0),
  }), { cal: 0, p: 0, c: 0, f: 0 }), [meals]);

  return (
    <div className="px-6 pb-32">
      <Card className="flex flex-col items-center" style={{ paddingTop: 32, paddingBottom: 32 }}>
        <div style={{
          color: C.gold, fontSize: 10, letterSpacing: '0.25em',
          textTransform: 'uppercase', marginBottom: 20,
        }}>Today's Intake</div>
        <MacroRing
          label="Calories" current={totals.cal} target={goals.calories}
          color={C.goldBright} size={200} stroke={10} big
        />
        <div className="mt-6 flex items-center gap-2" style={{ color: C.mute, fontSize: 13 }}>
          <Flame size={14} style={{ color: C.gold }}/>
          {Math.max(0, goals.calories - totals.cal)} kcal remaining
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { k: 'Protein', cur: totals.p, t: goals.protein, color: C.protein },
          { k: 'Carbs',   cur: totals.c, t: goals.carbs,   color: C.carbs   },
          { k: 'Fat',     cur: totals.f, t: goals.fat,     color: C.fat     },
        ].map(m => (
          <Card key={m.k} className="flex justify-center" style={{ padding: 16 }}>
            <MacroRing label={m.k} current={m.cur} target={m.t} color={m.color} size={90} stroke={7}/>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div style={{
              color: C.gold, fontSize: 10, letterSpacing: '0.25em',
              textTransform: 'uppercase', marginBottom: 4,
            }}>Hydration</div>
            <div style={{
              fontFamily: 'Fraunces, Georgia, serif',
              color: C.cream, fontSize: 22,
            }}>{water} <span style={{ color: C.mute, fontSize: 14 }}>/ 8 glasses</span></div>
          </div>
          <Droplet size={22} style={{ color: C.gold }}/>
        </div>
        <div className="flex gap-2 justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <button key={i}
              onClick={() => setWater(i + 1 === water ? i : i + 1)}
              className="flex-1 rounded-lg transition-all"
              style={{
                height: 38,
                backgroundColor: i < water ? C.gold : 'rgba(201,169,97,0.12)',
                border: i < water ? 'none' : `1px solid ${C.navyBorder}`,
              }}
              aria-label={`Glass ${i+1}`}
            />
          ))}
        </div>
      </Card>

      <div className="mt-8 mb-4 flex items-center justify-between">
        <div style={{
          color: C.gold, fontSize: 11, letterSpacing: '0.25em',
          textTransform: 'uppercase', fontWeight: 500,
        }}>Today's Meals</div>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all"
          style={{
            backgroundColor: C.gold, color: C.navy,
            fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
          }}>
          <Plus size={14}/> ADD
        </button>
      </div>

      {meals.length === 0 ? (
        <Card className="text-center py-10">
          <Sparkles size={22} style={{ color: C.gold, margin: '0 auto 12px' }}/>
          <div style={{
            fontFamily: 'Fraunces, Georgia, serif',
            color: C.cream, fontSize: 17, marginBottom: 4,
          }}>A fresh start.</div>
          <div style={{ color: C.mute, fontSize: 13 }}>Log your first meal to begin.</div>
        </Card>
      ) : (
        <div className="space-y-3">
          {meals.map(m => (
            <Card key={m.id} style={{ padding: 16 }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <div style={{
                    fontFamily: 'Fraunces, Georgia, serif',
                    color: C.cream, fontSize: 16, marginBottom: 6,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>{m.name}</div>
                  <div className="flex gap-3 flex-wrap" style={{ fontSize: 11 }}>
                    <span style={{ color: C.goldBright, fontWeight: 600 }}>{m.cal} kcal</span>
                    <span style={{ color: C.protein }}>P {m.p}g</span>
                    <span style={{ color: C.carbs }}>C {m.c}g</span>
                    <span style={{ color: C.fat }}>F {m.f}g</span>
                  </div>
                </div>
                <button onClick={() => onDelete(m.id)}
                  className="p-2 rounded-lg transition-opacity hover:opacity-100"
                  style={{ color: C.mute, opacity: 0.5 }}>
                  <Trash2 size={15}/>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LOG VIEW ──────────────────────────────────────────────────────────────
function LogView({ onSave, onBack }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [qty, setQty] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [custom, setCustom] = useState({ name: '', cal: '', p: '', c: '', f: '' });

  const results = useMemo(() => searchFoods(query), [query]);
  const macros = useMemo(() => selected ? computeMacros(selected, qty) : null, [selected, qty]);

  const pickFood = (food) => {
    setSelected(food);
    setQty(String(food.defaultServing));
    setQuery('');
  };

  const clearFood = () => {
    setSelected(null);
    setQty('');
    setQuery('');
  };

  const submitFromDb = () => {
    if (!selected || !macros) return;
    const unit = unitLabel(selected, parseFloat(qty));
    onSave({
      id: Date.now(),
      name: `${selected.name} (${qty}${selected.baseUnit === 'piece' ? ' ' + unit : selected.baseUnit})`,
      cal: macros.cal,
      p: macros.p,
      c: macros.c,
      f: macros.f,
    });
    clearFood();
    onBack();
  };

  const submitCustom = () => {
    if (!custom.name.trim()) return;
    onSave({
      id: Date.now(),
      name: custom.name.trim(),
      cal: +custom.cal || 0,
      p: +custom.p || 0,
      c: +custom.c || 0,
      f: +custom.f || 0,
    });
    setCustom({ name: '', cal: '', p: '', c: '', f: '' });
    setCustomMode(false);
    onBack();
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: C.navyMid,
    border: `1px solid ${C.navyBorder}`,
    borderRadius: 10,
    padding: '12px 14px',
    color: C.cream,
    fontSize: 15,
    fontFamily: 'inherit',
    outline: 'none',
  };
  const labelStyle = {
    color: C.gold, fontSize: 10, letterSpacing: '0.2em',
    textTransform: 'uppercase', marginBottom: 8, display: 'block', fontWeight: 500,
  };

  const popularFoods = POPULAR_IDS.map(id => FOODS.find(f => f.id === id)).filter(Boolean);

  return (
    <div className="px-6 pb-32">
      <Card>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          color: C.cream, fontSize: 22, marginBottom: 4,
        }}>New entry</div>
        <div style={{ color: C.mute, fontSize: 13, marginBottom: 20 }}>
          Search a food — macros calculate automatically.
        </div>

        {/* ── Selected food card ─────────────────────────────────────── */}
        {selected ? (
          <>
            <div style={{
              backgroundColor: C.navyMid,
              border: `1px solid ${C.gold}`,
              borderRadius: 12,
              padding: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
              <div className="flex-1 min-w-0 pr-3">
                <div style={{ color: C.gold, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 4 }}>{selected.cat}</div>
                <div style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  color: C.cream, fontSize: 16, lineHeight: 1.2,
                }}>{selected.name}</div>
              </div>
              <button onClick={clearFood} aria-label="Clear" style={{
                color: C.mute, padding: 6,
              }}><X size={18}/></button>
            </div>

            <label style={labelStyle}>Quantity</label>
            <div className="flex items-center gap-2 mb-5">
              <input
                type="number" inputMode="decimal" step="any" autoFocus
                value={qty}
                onChange={e => setQty(e.target.value)}
                style={{ ...inputStyle, flex: 1, textAlign: 'right',
                  fontFamily: 'Fraunces, Georgia, serif', fontSize: 22 }}
                placeholder="0"
              />
              <div style={{
                color: C.gold,
                fontSize: 14,
                letterSpacing: '0.05em',
                minWidth: 60,
                textAlign: 'center',
                padding: '12px 8px',
              }}>
                {unitLabel(selected, parseFloat(qty) || 0)}
              </div>
            </div>

            {/* Live macro preview */}
            <div style={{
              backgroundColor: C.navy,
              borderRadius: 12,
              padding: 18,
              border: `1px solid ${C.navyBorder}`,
            }}>
              <div style={{
                color: C.gold, fontSize: 10, letterSpacing: '0.25em',
                textTransform: 'uppercase', marginBottom: 14, textAlign: 'center',
              }}>Calculated Macros</div>
              <div className="flex items-baseline justify-center gap-1 mb-4">
                <span style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  color: C.goldBright, fontSize: 40, fontWeight: 500,
                  lineHeight: 1, letterSpacing: '-0.02em',
                }}>{macros ? macros.cal : 0}</span>
                <span style={{ color: C.mute, fontSize: 13, marginLeft: 4 }}>kcal</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Protein', val: macros?.p ?? 0, color: C.protein },
                  { label: 'Carbs',   val: macros?.c ?? 0, color: C.carbs   },
                  { label: 'Fat',     val: macros?.f ?? 0, color: C.fat     },
                ].map(m => (
                  <div key={m.label}>
                    <div style={{
                      fontFamily: 'Fraunces, Georgia, serif',
                      color: m.color, fontSize: 22, fontWeight: 500, lineHeight: 1,
                    }}>{m.val}<span style={{ fontSize: 12, marginLeft: 2 }}>g</span></div>
                    <div style={{
                      color: C.mute, fontSize: 9, letterSpacing: '0.18em',
                      textTransform: 'uppercase', marginTop: 4,
                    }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={submitFromDb}
              disabled={!macros}
              className="w-full mt-6 py-3.5 rounded-xl transition-all"
              style={{
                backgroundColor: macros ? C.gold : 'rgba(201,169,97,0.3)',
                color: C.navy, fontWeight: 600,
                letterSpacing: '0.08em', fontSize: 13,
                cursor: macros ? 'pointer' : 'not-allowed',
              }}>
              SAVE TO TODAY
            </button>
          </>
        ) : (
          <>
            {/* ── Search bar ─────────────────────────────────────────── */}
            <label style={labelStyle}>Search Food</label>
            <div className="relative">
              <Search size={16} style={{
                position: 'absolute', left: 14, top: '50%',
                transform: 'translateY(-50%)', color: C.gold,
              }}/>
              <input
                style={{ ...inputStyle, paddingLeft: 40 }}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. oats, chicken, banana…"
                autoFocus
              />
            </div>

            {/* Results dropdown */}
            {query.trim() && results.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {results.map(f => (
                  <button key={f.id} onClick={() => pickFood(f)}
                    className="w-full text-left rounded-lg p-3 transition-all flex items-center justify-between"
                    style={{
                      backgroundColor: C.navyMid,
                      border: `1px solid ${C.navyBorder}`,
                    }}>
                    <div className="flex-1 min-w-0 pr-2">
                      <div style={{
                        fontFamily: 'Fraunces, Georgia, serif',
                        color: C.cream, fontSize: 14, marginBottom: 2,
                      }}>{f.name}</div>
                      <div style={{ color: C.mute, fontSize: 10 }}>
                        {f.cal} kcal · {f.p}p · {f.c}c · {f.f}f
                        <span style={{ color: C.goldDim, marginLeft: 4 }}>
                          per {f.baseUnit === 'piece' ? 'piece' : f.baseAmount + f.baseUnit}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: C.gold }}/>
                  </button>
                ))}
              </div>
            )}

            {/* No matches */}
            {query.trim() && results.length === 0 && (
              <div className="mt-3 text-center py-4" style={{ color: C.mute, fontSize: 13 }}>
                No match found.
                <button onClick={() => {
                  setCustom({ ...custom, name: query });
                  setCustomMode(true);
                  setQuery('');
                }} style={{
                  color: C.gold, marginLeft: 8, fontWeight: 600, fontSize: 13,
                }}>
                  Add as custom →
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ── Popular foods (when nothing selected) ──────────────────────── */}
      {!selected && !customMode && (
        <>
          <div className="mt-8 mb-3" style={{
            color: C.gold, fontSize: 11, letterSpacing: '0.25em',
            textTransform: 'uppercase', fontWeight: 500,
          }}>Popular</div>
          <div className="grid grid-cols-2 gap-2">
            {popularFoods.map(f => (
              <button key={f.id} onClick={() => pickFood(f)}
                className="text-left rounded-xl p-3 transition-all"
                style={{
                  backgroundColor: C.navyCard,
                  border: `1px solid ${C.navyBorder}`,
                }}>
                <div style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  color: C.cream, fontSize: 13, lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{f.name}</div>
                <div style={{ color: C.goldDim, fontSize: 10, marginTop: 4 }}>
                  Default: {f.defaultServing}{f.baseUnit === 'piece' ? ' pc' : f.baseUnit}
                </div>
              </button>
            ))}
          </div>

          <button onClick={() => setCustomMode(true)}
            className="w-full mt-6 py-3 rounded-xl flex items-center justify-center gap-2"
            style={{
              backgroundColor: 'transparent',
              border: `1px solid ${C.navyBorder}`,
              color: C.gold, fontSize: 12,
              letterSpacing: '0.1em', fontWeight: 500,
            }}>
            <Pencil size={13}/> ADD CUSTOM FOOD
          </button>
        </>
      )}

      {/* ── Custom entry (manual macros) ───────────────────────────────── */}
      {customMode && !selected && (
        <Card className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div style={{
              fontFamily: 'Fraunces, Georgia, serif',
              color: C.cream, fontSize: 18,
            }}>Custom entry</div>
            <button onClick={() => setCustomMode(false)} style={{ color: C.mute }}>
              <X size={18}/>
            </button>
          </div>

          <label style={labelStyle}>Food</label>
          <input style={inputStyle} value={custom.name}
            onChange={e => setCustom({ ...custom, name: e.target.value })}
            placeholder="e.g. Grandma's pasta bake"/>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <label style={labelStyle}>Calories</label>
              <input type="number" inputMode="numeric" style={inputStyle} value={custom.cal}
                onChange={e => setCustom({ ...custom, cal: e.target.value })} placeholder="0"/>
            </div>
            <div>
              <label style={labelStyle}>Protein (g)</label>
              <input type="number" inputMode="numeric" style={inputStyle} value={custom.p}
                onChange={e => setCustom({ ...custom, p: e.target.value })} placeholder="0"/>
            </div>
            <div>
              <label style={labelStyle}>Carbs (g)</label>
              <input type="number" inputMode="numeric" style={inputStyle} value={custom.c}
                onChange={e => setCustom({ ...custom, c: e.target.value })} placeholder="0"/>
            </div>
            <div>
              <label style={labelStyle}>Fat (g)</label>
              <input type="number" inputMode="numeric" style={inputStyle} value={custom.f}
                onChange={e => setCustom({ ...custom, f: e.target.value })} placeholder="0"/>
            </div>
          </div>

          <button onClick={submitCustom}
            className="w-full mt-6 py-3.5 rounded-xl transition-all"
            style={{
              backgroundColor: C.gold, color: C.navy,
              fontWeight: 600, letterSpacing: '0.08em', fontSize: 13,
            }}>
            SAVE TO TODAY
          </button>
        </Card>
      )}
    </div>
  );
}

// ─── BODY VIEW ─────────────────────────────────────────────────────────────
function BodyView({ weights, onLog }) {
  const [val, setVal] = useState('');

  const sorted = [...weights].sort((a,b) => a.date.localeCompare(b.date));
  const current = sorted.length ? sorted[sorted.length - 1].weight : null;
  const start = sorted.length ? sorted[0].weight : null;
  const delta = current && start ? (current - start) : 0;

  const submit = () => {
    const n = parseFloat(val);
    if (!n || n <= 0) return;
    onLog({ date: todayStr(), weight: n });
    setVal('');
  };

  const chartData = sorted.map(w => ({
    date: w.date.slice(5),
    weight: w.weight,
  }));

  return (
    <div className="px-6 pb-32">
      <Card className="text-center" style={{ paddingTop: 28, paddingBottom: 28 }}>
        <div style={{
          color: C.gold, fontSize: 10, letterSpacing: '0.25em',
          textTransform: 'uppercase', marginBottom: 12,
        }}>Current Weight</div>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          color: C.cream, fontSize: 56, lineHeight: 1,
          fontWeight: 400, letterSpacing: '-0.03em',
        }}>
          {current !== null ? current.toFixed(1) : '—'}
          <span style={{ fontSize: 18, color: C.mute, marginLeft: 6 }}>kg</span>
        </div>
        {delta !== 0 && (
          <div className="mt-4" style={{
            color: delta < 0 ? C.carbs : C.protein, fontSize: 13,
            letterSpacing: '0.05em',
          }}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)} kg since start
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <div style={{
          color: C.gold, fontSize: 10, letterSpacing: '0.25em',
          textTransform: 'uppercase', marginBottom: 16, fontWeight: 500,
        }}>Trend</div>
        {chartData.length < 2 ? (
          <div className="py-8 text-center" style={{ color: C.mute, fontSize: 13 }}>
            Log a few entries to see your trend.
          </div>
        ) : (
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer>
              <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(201,169,97,0.08)" vertical={false}/>
                <XAxis dataKey="date" stroke={C.mute} fontSize={10} tickLine={false} axisLine={false}/>
                <YAxis stroke={C.mute} fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']}/>
                <Tooltip
                  contentStyle={{
                    backgroundColor: C.navyMid,
                    border: `1px solid ${C.gold}`,
                    borderRadius: 8,
                    color: C.cream,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: C.gold }}
                />
                <Line type="monotone" dataKey="weight" stroke={C.goldBright}
                  strokeWidth={2.5} dot={{ fill: C.gold, r: 3 }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="mt-4">
        <div style={{
          color: C.gold, fontSize: 10, letterSpacing: '0.25em',
          textTransform: 'uppercase', marginBottom: 12, fontWeight: 500,
        }}>Log Today</div>
        <div className="flex gap-2">
          <input type="number" inputMode="decimal" step="0.1" value={val}
            onChange={e => setVal(e.target.value)} placeholder="e.g. 78.4"
            style={{
              flex: 1,
              backgroundColor: C.navyMid,
              border: `1px solid ${C.navyBorder}`,
              borderRadius: 10,
              padding: '12px 14px',
              color: C.cream,
              fontSize: 15,
              outline: 'none',
            }}/>
          <button onClick={submit} className="px-5 rounded-xl"
            style={{
              backgroundColor: C.gold, color: C.navy,
              fontWeight: 600, fontSize: 13, letterSpacing: '0.08em',
            }}>SAVE</button>
        </div>
      </Card>
    </div>
  );
}

// ─── GOALS VIEW ────────────────────────────────────────────────────────────
function GoalsView({ name, setName, goals, setGoals }) {
  const [form, setForm] = useState(goals);
  const [n, setN] = useState(name);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setForm(goals); }, [goals]);

  // Auto-calculate calories from macros: P×4 + C×4 + F×9
  const calculatedCalories = useMemo(() => {
    const p = +form.protein || 0;
    const c = +form.carbs || 0;
    const f = +form.fat || 0;
    return Math.round(p * 4 + c * 4 + f * 9);
  }, [form.protein, form.carbs, form.fat]);

  const save = () => {
    setGoals({
      calories: calculatedCalories,
      protein:  +form.protein  || 0,
      carbs:    +form.carbs    || 0,
      fat:      +form.fat      || 0,
    });
    setName(n.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: C.navyMid,
    border: `1px solid ${C.navyBorder}`,
    borderRadius: 10,
    padding: '12px 14px',
    color: C.cream,
    fontSize: 15,
    outline: 'none',
    textAlign: 'center',
    fontFamily: 'Fraunces, Georgia, serif',
  };

  const labelStyle = {
    color: C.gold, fontSize: 10, letterSpacing: '0.2em',
    textTransform: 'uppercase', marginBottom: 8, display: 'block', fontWeight: 500,
  };

  return (
    <div className="px-6 pb-32">
      <Card>
        <div style={{
          fontFamily: 'Fraunces, Georgia, serif',
          color: C.cream, fontSize: 22, marginBottom: 4,
        }}>Your targets</div>
        <div style={{ color: C.mute, fontSize: 13, marginBottom: 20 }}>
          Set your macros — calories calculate automatically.
        </div>

        <label style={labelStyle}>Your name</label>
        <input style={{ ...inputStyle, textAlign: 'left', fontFamily: 'inherit' }}
          value={n} onChange={e => setN(e.target.value)} placeholder="First name"/>

        <div style={{ height: 1, background: C.navyBorder, margin: '24px 0' }}/>

        <label style={labelStyle}>Daily Macros (grams)</label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div style={{
              fontSize: 10, color: C.protein, marginBottom: 6, textAlign: 'center',
              letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
            }}>Protein</div>
            <input type="number" inputMode="numeric" style={inputStyle} value={form.protein}
              onChange={e => setForm({ ...form, protein: e.target.value })}/>
          </div>
          <div>
            <div style={{
              fontSize: 10, color: C.carbs, marginBottom: 6, textAlign: 'center',
              letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
            }}>Carbs</div>
            <input type="number" inputMode="numeric" style={inputStyle} value={form.carbs}
              onChange={e => setForm({ ...form, carbs: e.target.value })}/>
          </div>
          <div>
            <div style={{
              fontSize: 10, color: C.fat, marginBottom: 6, textAlign: 'center',
              letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600,
            }}>Fat</div>
            <input type="number" inputMode="numeric" style={inputStyle} value={form.fat}
              onChange={e => setForm({ ...form, fat: e.target.value })}/>
          </div>
        </div>

        {/* Calculated calories display */}
        <div style={{
          backgroundColor: C.navy,
          borderRadius: 12,
          padding: 20,
          border: `1px solid ${C.navyBorder}`,
          marginTop: 20,
        }}>
          <div style={{
            color: C.gold, fontSize: 10, letterSpacing: '0.25em',
            textTransform: 'uppercase', marginBottom: 10, textAlign: 'center',
          }}>Daily Calories · Calculated</div>
          <div className="flex items-baseline justify-center">
            <span style={{
              fontFamily: 'Fraunces, Georgia, serif',
              color: C.goldBright, fontSize: 46, fontWeight: 500,
              lineHeight: 1, letterSpacing: '-0.02em',
              transition: 'all 0.3s ease',
            }}>{calculatedCalories}</span>
            <span style={{ color: C.mute, fontSize: 13, marginLeft: 6 }}>kcal</span>
          </div>
          <div style={{
            color: C.goldDim, fontSize: 10, textAlign: 'center', marginTop: 10,
            letterSpacing: '0.05em',
          }}>
            ({+form.protein || 0}×4) + ({+form.carbs || 0}×4) + ({+form.fat || 0}×9)
          </div>
        </div>

        <button onClick={save}
          className="w-full mt-6 py-3.5 rounded-xl transition-all"
          style={{
            backgroundColor: saved ? C.carbs : C.gold,
            color: C.navy, fontWeight: 600,
            letterSpacing: '0.08em', fontSize: 13,
          }}>
          {saved ? '✓ SAVED' : 'SAVE CHANGES'}
        </button>
      </Card>

      <div className="text-center mt-8" style={{
        color: C.goldDim, fontSize: 10, letterSpacing: '0.3em',
        textTransform: 'uppercase',
      }}>
        Crafted by Peter · Micro Tracker
      </div>
    </div>
  );
}

// ─── Bottom Nav ────────────────────────────────────────────────────────────
function BottomNav({ view, setView }) {
  const tabs = [
    { id: 'today', label: 'Today', Icon: Home },
    { id: 'log',   label: 'Log',   Icon: BookOpen },
    { id: 'body',  label: 'Body',  Icon: Activity },
    { id: 'goals', label: 'Goals', Icon: Target },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center pointer-events-none" style={{ paddingBottom: 16 }}>
      <div className="flex pointer-events-auto rounded-full" style={{
        backgroundColor: 'rgba(10,22,40,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${C.navyBorder}`,
        padding: 6,
        boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
      }}>
        {tabs.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)}
              className="flex items-center gap-2 rounded-full transition-all"
              style={{
                padding: active ? '10px 18px' : '10px 14px',
                backgroundColor: active ? C.gold : 'transparent',
                color: active ? C.navy : C.mute,
              }}>
              <Icon size={17}/>
              {active && (
                <span style={{
                  fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
                }}>{label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('today');
  const [meals, setMeals] = useState([]);
  const [goals, setGoalsState] = useState(DEFAULT_GOALS);
  const [weights, setWeights] = useState([]);
  const [water, setWaterState] = useState(0);
  const [name, setNameState] = useState('');
  const [loaded, setLoaded] = useState(false);

  // Inject brand fonts
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,400;0,500;0,600;1,400&family=Manrope:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    document.body.style.fontFamily = 'Manrope, -apple-system, sans-serif';
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // Hydrate state from persistent storage
  useEffect(() => {
    (async () => {
      const [m, g, w, wt, nm] = await Promise.all([
        storage.get(mealsKey(), []),
        storage.get('goals', DEFAULT_GOALS),
        storage.get(waterKey(), 0),
        storage.get('weights', []),
        storage.get('name', ''),
      ]);
      setMeals(m);
      setGoalsState(g);
      setWaterState(w);
      setWeights(wt);
      setNameState(nm);
      setLoaded(true);
    })();
  }, []);

  const addMeal = async (m) => {
    const next = [...meals, m];
    setMeals(next);
    await storage.set(mealsKey(), next);
  };
  const deleteMeal = async (id) => {
    const next = meals.filter(m => m.id !== id);
    setMeals(next);
    await storage.set(mealsKey(), next);
  };
  const setWater = async (n) => {
    setWaterState(n);
    await storage.set(waterKey(), n);
  };
  const setGoals = async (g) => {
    setGoalsState(g);
    await storage.set('goals', g);
  };
  const logWeight = async (entry) => {
    const filtered = weights.filter(w => w.date !== entry.date);
    const next = [...filtered, entry];
    setWeights(next);
    await storage.set('weights', next);
  };
  const setName = async (nm) => {
    setNameState(nm);
    await storage.set('name', nm);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: C.navy,
      backgroundImage: `
        radial-gradient(ellipse at top, rgba(201,169,97,0.08), transparent 50%),
        radial-gradient(ellipse at bottom, rgba(23,46,80,0.6), transparent 60%)
      `,
      color: C.cream,
      fontFamily: 'Manrope, -apple-system, sans-serif',
    }}>
      <div style={{ maxWidth: 460, margin: '0 auto' }}>
        <Header name={name}/>
        {!loaded ? (
          <div className="text-center py-20" style={{ color: C.mute }}>Loading…</div>
        ) : (
          <>
            {view === 'today' && (
              <TodayView
                meals={meals} goals={goals} water={water} setWater={setWater}
                onAdd={() => setView('log')} onDelete={deleteMeal}
              />
            )}
            {view === 'log' && (
              <LogView onSave={addMeal} onBack={() => setView('today')}/>
            )}
            {view === 'body' && (
              <BodyView weights={weights} onLog={logWeight}/>
            )}
            {view === 'goals' && (
              <GoalsView name={name} setName={setName} goals={goals} setGoals={setGoals}/>
            )}
          </>
        )}
        <BottomNav view={view} setView={setView}/>
      </div>
    </div>
  );
}
