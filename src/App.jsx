import React, { useState } from 'react';
import {
  LayoutDashboard, Radio, TrendingUp, Map as MapIcon, BarChart3,
  SlidersHorizontal, Database, Keyboard, History, BookOpen,
  Sun, Moon, FastForward, RotateCcw
} from 'lucide-react';
import { useTheme } from './lib/theme.js';
import { useForecast } from './engine/pipeline.js';
import { advanceCount, resetToDemo, useStore } from './data/store.js';
import { candidateName } from './data/candidates.js';
import { pct, timeAgo } from './lib/format.js';

import { Dashboard } from './screens/Dashboard.jsx';
import { ElectionNight } from './screens/ElectionNight.jsx';
import { ForecastScreen } from './screens/ForecastScreen.jsx';
import { MapView } from './screens/MapView.jsx';
import { Reporting } from './screens/Reporting.jsx';
import { ScenarioSim } from './screens/ScenarioSim.jsx';
import { DataConsole } from './screens/DataConsole.jsx';
import { ManualEntry } from './screens/ManualEntry.jsx';
import { Historical } from './screens/Historical.jsx';
import { Methodology } from './screens/Methodology.jsx';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'night', label: 'Election Night', icon: Radio },
  { id: 'forecast', label: 'Forecast & Runoff', icon: TrendingUp },
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'reporting', label: 'Reporting', icon: BarChart3 },
  { id: 'scenario', label: 'Scenario Sim', icon: SlidersHorizontal },
  { id: 'data', label: 'Live Data & Audit', icon: Database },
  { id: 'entry', label: 'Manual Entry', icon: Keyboard },
  { id: 'historical', label: 'Historical', icon: History },
  { id: 'methodology', label: 'Methodology', icon: BookOpen }
];

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [view, setView] = useState('dashboard');
  const state = useStore();
  const forecast = useForecast({ iterations: 4000 });
  const lastUpdate = state.results.reduce((m, r) => Math.max(m, r.receivedAt || 0), 0);
  const { agg, race } = forecast;

  const screen = (() => {
    switch (view) {
      case 'dashboard': return <Dashboard forecast={forecast} onNavigate={setView} />;
      case 'night': return <ElectionNight forecast={forecast} />;
      case 'forecast': return <ForecastScreen forecast={forecast} />;
      case 'map': return <MapView forecast={forecast} />;
      case 'reporting': return <Reporting forecast={forecast} />;
      case 'scenario': return <ScenarioSim forecast={forecast} />;
      case 'data': return <DataConsole />;
      case 'entry': return <ManualEntry />;
      case 'historical': return <Historical forecast={forecast} />;
      case 'methodology': return <Methodology />;
      default: return null;
    }
  })();

  return (
    <div className="min-h-full bg-term-bg text-term-text">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-term-border bg-term-bg/90 backdrop-blur">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-term-accent/15 flex items-center justify-center shrink-0">
              <span className="text-term-accent font-bold text-sm">ZM</span>
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold tracking-tight truncate">Zambia Election Terminal <span className="text-term-faint font-normal">2026</span></div>
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-term-muted tnum">
                <span className="live-dot inline-block w-1.5 h-1.5 rounded-full bg-term-good" />
                {pct(agg.national.pctCounted, 1)} counted · leading {candidateName(race.leader)} · {lastUpdate ? timeAgo(lastUpdate) : '—'}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => advanceCount(3)} className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-term-border bg-term-panel2 px-2.5 py-1.5 text-xs hover:bg-term-panel">
              <FastForward size={13} /> Advance
            </button>
            <button onClick={() => resetToDemo()} className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-term-border bg-term-panel2 px-2.5 py-1.5 text-xs hover:bg-term-panel">
              <RotateCcw size={13} /> Reset
            </button>
            <button onClick={toggleTheme} className="inline-flex items-center justify-center rounded-lg border border-term-border bg-term-panel2 w-8 h-8 hover:bg-term-panel" title="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* DEMO banner */}
      <div className="bg-term-warn/15 border-b border-term-warn/30">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-1.5 text-center text-[11px] font-medium tracking-wide text-term-warn">
          DEMO DATA — NOT ACTUAL ELECTION RESULTS · Illustrative candidates &amp; simulated returns for demonstration only
        </div>
      </div>

      {/* Body */}
      <div className="max-w-[1600px] mx-auto px-3 sm:px-5 py-4 flex flex-col md:flex-row gap-4">
        {/* Nav */}
        <nav className="md:w-52 shrink-0">
          <div className="flex md:flex-col gap-1 overflow-x-auto scroll-thin md:overflow-visible pb-1 md:pb-0 md:sticky md:top-[72px]">
            {NAV.map((n) => {
              const Icon = n.icon;
              const active = view === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setView(n.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                    active ? 'bg-term-accent/15 text-term-accent font-medium' : 'text-term-muted hover:bg-term-panel2 hover:text-term-text'
                  }`}
                >
                  <Icon size={15} /> {n.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 min-w-0">{screen}</main>
      </div>

      <footer className="max-w-[1600px] mx-auto px-3 sm:px-5 py-6 text-center text-[11px] text-term-faint">
        Zambia Presidential Election 2026 Prediction &amp; Live Results Analysis Terminal · reproducible seeded model · DEMO build.
      </footer>
    </div>
  );
}
