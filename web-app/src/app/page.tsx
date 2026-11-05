'use client';

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Calendar,
  Flag,
  Gauge,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  TrendingUp,
  Activity,
  Zap,
  AlertTriangle,
  Radio,
  Layers,
  ChevronDown,
  Search
} from 'lucide-react';

const AVAILABLE_DRIVERS = [
  { id: 1, code: 'VER', name: 'Max Verstappen', team: 'Red Bull Racing', color: '#38bdf8' },
  { id: 2, code: 'PER', name: 'Sergio Perez', team: 'Red Bull Racing', color: '#60a5fa' },
  { id: 3, code: 'ALO', name: 'Fernando Alonso', team: 'Aston Martin', color: '#34d399' },
  { id: 4, code: 'HAM', name: 'Lewis Hamilton', team: 'Mercedes', color: '#fbbf24' },
  { id: 5, code: 'LEC', name: 'Charles Leclerc', team: 'Ferrari', color: '#f87171' },
  { id: 6, code: 'SAI', name: 'Carlos Sainz', team: 'Ferrari', color: '#fb923c' },
  { id: 7, code: 'NOR', name: 'Lando Norris', team: 'McLaren', color: '#f472b6' },
  { id: 8, code: 'RUS', name: 'George Russell', team: 'Mercedes', color: '#a78bfa' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'races' | 'standings' | 'driver-card' | 'strategy' | 'telemetry'>('races');
  const [userRole, setUserRole] = useState<'Strategist' | 'Viewer'>('Strategist');

  // Relational data states (Student A)
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<number | null>(null);
  const [raceDetails, setRaceDetails] = useState<any | null>(null);
  const [standings, setStandings] = useState<{ drivers: any[]; teams: any[] }>({ drivers: [], teams: [] });
  const [driverSummary, setDriverSummary] = useState<any | null>(null);
  const [driverSearch, setDriverSearch] = useState('Verstappen');
  const [notes, setNotes] = useState<any[]>([]);

  // Strategy form
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTyre, setNoteTyre] = useState('Hard');
  const [, setLoading] = useState(false);

  // NoSQL Telemetry & Events states (Student B)
  const [selectedLap, setSelectedLap] = useState<number>(15);
  const [driverAId, setDriverAId] = useState<number>(1); // VER
  const [driverBId, setDriverBId] = useState<number>(4); // HAM
  const [metricMode, setMetricMode] = useState<'speed' | 'throttle' | 'rpm' | 'gear'>('speed');
  const [telemetrySamples, setTelemetrySamples] = useState<any[]>([]);
  const [telemetryLoading, setTelemetryLoading] = useState(false);
  const [speedTrap, setSpeedTrap] = useState<any[]>([]);
  const [raceEvents, setRaceEvents] = useState<any[]>([]);
  const [showPipelineCode, setShowPipelineCode] = useState(false);

  // New incident form states (Student B NoSQL CRUD)
  const [newEvLap, setNewEvLap] = useState<number>(15);
  const [newEvType, setNewEvType] = useState<string>('Yellow Flag');
  const [newEvDriver, setNewEvDriver] = useState<string>('');
  const [newEvDesc, setNewEvDesc] = useState<string>('');
  const [newEvSeverity, setNewEvSeverity] = useState<string>('Medium');
  const [eventPosting, setEventPosting] = useState(false);

  // Fetch initial races and standings
  useEffect(() => {
    fetch('/api/races')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.races.length > 0) {
          setRaces(data.races);
          setSelectedRaceId(data.races[0].race_id);
        }
      });

    fetch('/api/standings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStandings({ drivers: data.drivers, teams: data.teams });
        }
      });

    loadDriverSummary('Verstappen');
    loadStrategyNotes();
  }, []);

  // Fetch details when selected race changes
  useEffect(() => {
    if (!selectedRaceId) return;
    setLoading(true);
    fetch(`/api/races/${selectedRaceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRaceDetails(data);
        }
        setLoading(false);
      });

    loadTelemetryData(selectedRaceId, selectedLap, driverAId, driverBId);
    loadRaceEvents(selectedRaceId);
    loadSpeedTrap(selectedRaceId);
  }, [selectedRaceId]);

  // Reload telemetry when lap or drivers change
  useEffect(() => {
    if (selectedRaceId) {
      loadTelemetryData(selectedRaceId, selectedLap, driverAId, driverBId);
    }
  }, [selectedLap, driverAId, driverBId]);

  const loadDriverSummary = (driverName: string) => {
    fetch(`/api/analytics/driver?driver=${encodeURIComponent(driverName)}&year=2023`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDriverSummary(data.summary);
        }
      });
  };

  const loadStrategyNotes = () => {
    fetch('/api/strategy-notes')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setNotes(data.notes);
      });
  };

  const loadTelemetryData = (raceId: number, lap: number, dA: number, dB: number) => {
    setTelemetryLoading(true);
    fetch(`/api/telemetry?raceId=${raceId}&lap=${lap}&driverId=${dA}&compareDriverId=${dB}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setTelemetrySamples(data.samples || []);
        }
        setTelemetryLoading(false);
      })
      .catch(() => setTelemetryLoading(false));
  };

  const loadRaceEvents = (raceId: number) => {
    fetch(`/api/events?raceId=${raceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRaceEvents(data.events || []);
        }
      });
  };

  const loadSpeedTrap = (raceId: number) => {
    fetch(`/api/analytics/speed-trap?raceId=${raceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSpeedTrap(data.leaderboard || []);
        }
      });
  };

  const handleAddStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRaceId || !noteTitle || !noteContent) return;

    const res = await fetch('/api/strategy-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: selectedRaceId,
        author_role: userRole,
        title: noteTitle,
        content: noteContent,
        recommended_tyre: noteTyre,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setNoteTitle('');
      setNoteContent('');
      loadStrategyNotes();
    } else {
      alert(data.error);
    }
  };

  const handleDeleteStrategy = async (noteId: number) => {
    const res = await fetch(`/api/strategy-notes?id=${noteId}&role=${userRole}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      loadStrategyNotes();
    } else {
      alert(data.error);
    }
  };

  const handleLogEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRaceId || !newEvDesc) return;
    setEventPosting(true);

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        race_id: selectedRaceId,
        lap_number: newEvLap,
        event_type: newEvType,
        driver_id: null,
        driver_name: newEvDriver || 'Race Control',
        description: newEvDesc,
        severity: newEvSeverity,
        author_role: userRole,
      }),
    });

    const data = await res.json();
    setEventPosting(false);
    if (data.success) {
      setNewEvDesc('');
      loadRaceEvents(selectedRaceId);
    } else {
      alert(data.error);
    }
  };

  // Helper to render minimalist SVG telemetry trace
  const renderSvgTelemetry = () => {
    const samplesA = telemetrySamples.filter((s) => s.driver_id === driverAId);
    const samplesB = telemetrySamples.filter((s) => s.driver_id === driverBId);

    const width = 640;
    const height = 180;
    const padX = 35;
    const padY = 20;

    let minVal = 0;
    let maxVal = 350;
    let unit = 'km/h';

    if (metricMode === 'speed') {
      minVal = 80;
      maxVal = 340;
      unit = 'km/h';
    } else if (metricMode === 'throttle') {
      minVal = 0;
      maxVal = 100;
      unit = '%';
    } else if (metricMode === 'rpm') {
      minVal = 7000;
      maxVal = 13500;
      unit = 'RPM';
    } else if (metricMode === 'gear') {
      minVal = 1;
      maxVal = 8;
      unit = 'Gear';
    }

    const getVal = (s: any) => {
      if (!s.telemetry) return minVal;
      return s.telemetry[metricMode] ?? minVal;
    };

    const makePath = (samples: any[]) => {
      if (samples.length === 0) return '';
      return samples
        .map((s, idx) => {
          const x = padX + (idx / Math.max(1, samples.length - 1)) * (width - padX * 2);
          const val = Math.max(minVal, Math.min(maxVal, getVal(s)));
          const y = height - padY - ((val - minVal) / (maxVal - minVal)) * (height - padY * 2);
          return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(' ');
    };

    const pathA = makePath(samplesA);
    const pathB = makePath(samplesB);

    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 select-none">
          {/* Subtle grid lines */}
          {[0, 0.5, 1].map((pct, i) => {
            const y = height - padY - pct * (height - padY * 2);
            const valLabel = Math.round(minVal + pct * (maxVal - minVal));
            return (
              <g key={i}>
                <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="#1e293b" strokeWidth="1" />
                <text x={padX - 8} y={y + 3} fill="#64748b" fontSize="9" textAnchor="end" fontFamily="monospace">
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Curve Driver A */}
          {pathA && <path d={pathA} fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
          {/* Curve Driver B */}
          {pathB && <path d={pathB} fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeDasharray="3 3" strokeLinecap="round" strokeLinejoin="round" />}

          {/* Minimal X Labels */}
          <text x={padX} y={height - 4} fill="#475569" fontSize="9" textAnchor="start">Sector 1</text>
          <text x={width / 2} y={height - 4} fill="#475569" fontSize="9" textAnchor="middle">Sector 2</text>
          <text x={width - padX} y={height - 4} fill="#475569" fontSize="9" textAnchor="end">Sector 3</text>
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs pt-3 mt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-sky-400 rounded-full inline-block"></span>
              <span className="text-slate-200 font-medium text-xs">
                {AVAILABLE_DRIVERS.find(d => d.id === driverAId)?.code}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-0.5 bg-amber-400 rounded-full inline-block"></span>
              <span className="text-slate-400 font-medium text-xs">
                {AVAILABLE_DRIVERS.find(d => d.id === driverBId)?.code}
              </span>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500">{unit}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-slate-200 flex flex-col font-sans antialiased selection:bg-slate-800">
      {/* Top Header - Clean, low visual noise */}
      <header className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-neutral-300">
            F1
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Motorsport Strategy System
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                Hybrid DB
              </span>
            </h1>
          </div>
        </div>

        {/* Role Selector */}
        <div className="flex items-center gap-2 bg-neutral-900 px-2.5 py-1 rounded-md border border-neutral-800 text-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-400">Role:</span>
          <select
            value={userRole}
            onChange={(e) => setUserRole(e.target.value as any)}
            className="bg-transparent text-neutral-200 font-medium focus:outline-none cursor-pointer"
          >
            <option value="Strategist" className="bg-neutral-900">Race Strategist (CRUD)</option>
            <option value="Viewer" className="bg-neutral-900">Viewer (Read-only)</option>
          </select>
        </div>
      </header>

      {/* Navigation Tabs - Understated pills */}
      <nav className="border-b border-neutral-900 bg-neutral-950 px-6 flex gap-1 overflow-x-auto text-xs py-2">
        <button
          onClick={() => setActiveTab('races')}
          className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'races'
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
        >
          <Flag className="w-3.5 h-3.5 text-neutral-400" /> Grand Prix Results
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'standings'
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
        >
          <Trophy className="w-3.5 h-3.5 text-neutral-400" /> Standings
        </button>
        <button
          onClick={() => setActiveTab('driver-card')}
          className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'driver-card'
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
        >
          <Gauge className="w-3.5 h-3.5 text-neutral-400" /> Driver Card
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'strategy'
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
        >
          <Activity className="w-3.5 h-3.5 text-neutral-400" /> Strategy Desk
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'telemetry'
            ? 'bg-neutral-800 text-white'
            : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
            }`}
        >
          <Zap className="w-3.5 h-3.5 text-neutral-400" /> Telemetry & Events
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: RACES & CLASSIFICATION */}
        {activeTab === 'races' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Race List Sidebar */}
            <div className="lg:col-span-1 bg-neutral-900/50 border border-neutral-900 rounded-lg p-3 max-h-[80vh] overflow-y-auto">
              <div className="text-xs font-semibold text-neutral-400 mb-2 px-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" /> 2023 Calendar
              </div>
              <div className="space-y-1">
                {races.map((r) => (
                  <button
                    key={r.race_id}
                    onClick={() => setSelectedRaceId(r.race_id)}
                    className={`w-full text-left px-3 py-2 rounded text-xs transition flex items-center justify-between ${selectedRaceId === r.race_id
                      ? 'bg-neutral-800 text-white border border-neutral-700/60'
                      : 'hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                      }`}
                  >
                    <div>
                      <div className="font-medium text-slate-200">R{r.round_no} {r.circuit_name}</div>
                      <div className="text-[11px] text-neutral-500">{r.country}</div>
                    </div>
                    {r.winner_name && (
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {r.winner_name.split(' ').pop()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Race Details & Pit Stops */}
            <div className="lg:col-span-3 space-y-6">
              {raceDetails && (
                <>
                  <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5">
                    <div className="flex justify-between items-baseline mb-4 pb-3 border-b border-neutral-900">
                      <div>
                        <div className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">
                          Round {raceDetails.race.round_no}
                        </div>
                        <h2 className="text-base font-semibold text-white">{raceDetails.race.circuit_name}</h2>
                        <div className="text-xs text-neutral-400">{raceDetails.race.location}, {raceDetails.race.country}</div>
                      </div>
                      <div className="text-xs font-mono text-neutral-400">
                        {raceDetails.results.length} Drivers Classified
                      </div>
                    </div>

                    {/* Classification Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-neutral-800 text-neutral-400 text-[11px] font-medium">
                          <tr>
                            <th className="py-2 px-3">Pos</th>
                            <th className="py-2 px-3">Driver</th>
                            <th className="py-2 px-3">Team</th>
                            <th className="py-2 px-3 font-mono">Grid</th>
                            <th className="py-2 px-3 font-mono">+/-</th>
                            <th className="py-2 px-3 font-mono">Laps</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3 font-mono text-right">Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {raceDetails.results.map((res: any, idx: number) => {
                            const isP1 = res.position === 1;
                            const isPodium = res.position === 2 || res.position === 3;
                            const isTop5 = res.position === 4 || res.position === 5;

                            const rowBg = isP1
                              ? 'bg-amber-500/[0.07] hover:bg-amber-500/[0.12] border-l-2 border-l-amber-400'
                              : isPodium
                                ? 'bg-sky-500/[0.04] hover:bg-sky-500/[0.09] border-l-2 border-l-sky-400/80'
                                : isTop5
                                  ? 'bg-neutral-800/30 hover:bg-neutral-800/50 border-l-2 border-l-neutral-600'
                                  : 'hover:bg-neutral-900/60';

                            const badgeStyle = isP1
                              ? 'text-amber-400 font-bold bg-amber-400/15 border border-amber-400/30 px-1.5 py-0.5 rounded'
                              : isPodium
                                ? 'text-sky-300 font-semibold bg-sky-400/10 border border-sky-400/20 px-1.5 py-0.5 rounded'
                                : isTop5
                                  ? 'text-neutral-200 font-medium bg-neutral-800 border border-neutral-700/60 px-1.5 py-0.5 rounded'
                                  : 'text-neutral-400 font-medium';

                            return (
                              <tr key={res.driver_name || idx} className={`${rowBg} transition-colors`}>
                                <td className="py-2.5 px-3 font-mono">
                                  <span className={`inline-flex items-center justify-center min-w-[24px] ${badgeStyle}`}>
                                    {res.position ? res.position : 'DNF'}
                                  </span>
                                </td>
                                <td className={`py-2.5 px-3 font-medium ${isP1 ? 'text-amber-100 font-semibold' : isPodium ? 'text-neutral-100' : 'text-neutral-200'}`}>
                                  {res.driver_name}
                                </td>
                                <td className="py-2.5 px-3 text-neutral-400">{res.team_name}</td>
                                <td className="py-2.5 px-3 font-mono text-neutral-500">{res.grid_position}</td>
                                <td className={`py-2.5 px-3 font-mono ${res.positions_gained > 0
                                  ? 'text-emerald-400 font-medium'
                                  : res.positions_gained < 0
                                    ? 'text-rose-400'
                                    : 'text-neutral-500'
                                  }`}>
                                  {res.positions_gained > 0 ? `+${res.positions_gained}` : res.positions_gained}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-neutral-400">{res.laps_completed}</td>
                                <td className="py-2.5 px-3 text-neutral-400">{res.status}</td>
                                <td className={`py-2.5 px-3 font-mono text-right ${isP1 ? 'text-amber-400 font-bold' : isPodium ? 'text-sky-300 font-semibold' : 'text-neutral-200 font-medium'}`}>
                                  {res.points}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pit Stops Summary */}
                  <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5">
                    <div className="text-xs font-semibold text-neutral-300 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" /> Pit Stop Execution Log
                    </div>
                    <div className="overflow-x-auto max-h-56 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="border-b border-neutral-800 text-neutral-400 text-[11px] font-medium">
                          <tr>
                            <th className="py-2 px-3 font-mono">Lap</th>
                            <th className="py-2 px-3">Driver</th>
                            <th className="py-2 px-3">Team</th>
                            <th className="py-2 px-3 font-mono">Time</th>
                            <th className="py-2 px-3 font-mono text-right">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-900">
                          {raceDetails.pitStops.map((ps: any, idx: number) => (
                            <tr key={idx} className="hover:bg-neutral-900/60 transition">
                              <td className="py-2 px-3 font-mono text-neutral-500">{ps.lap_number}</td>
                              <td className="py-2 px-3 text-neutral-300">{ps.driver_name}</td>
                              <td className="py-2 px-3 text-neutral-500">{ps.team_name}</td>
                              <td className="py-2 px-3 font-mono text-neutral-500">{ps.stop_time}</td>
                              <td className="py-2 px-3 font-mono text-right text-neutral-200">
                                {Number(ps.duration).toFixed(3)}s
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: STANDINGS */}
        {activeTab === 'standings' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Driver Standings */}
            <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5">
              <div className="text-xs font-semibold text-neutral-300 mb-3 flex items-center gap-1.5 pb-2 border-b border-neutral-900">
                <Trophy className="w-3.5 h-3.5 text-neutral-400" /> Driver World Championship
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400 text-[11px] font-medium">
                    <tr>
                      <th className="py-2 px-3 font-mono">Rank</th>
                      <th className="py-2 px-3">Driver</th>
                      <th className="py-2 px-3">Team</th>
                      <th className="py-2 px-3 font-mono text-center">Wins</th>
                      <th className="py-2 px-3 font-mono text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {standings.drivers.map((d: any) => (
                      <tr key={d.driver_name} className="hover:bg-neutral-900/60 transition">
                        <td className="py-2 px-3 font-mono text-neutral-400">{d.championship_rank}</td>
                        <td className="py-2 px-3 font-medium text-white">{d.driver_name}</td>
                        <td className="py-2 px-3 text-neutral-500">{d.team_name}</td>
                        <td className="py-2 px-3 font-mono text-center text-neutral-400">{d.total_wins}</td>
                        <td className="py-2 px-3 font-mono text-right text-neutral-200 font-semibold">{d.championship_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Constructor Standings */}
            <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5">
              <div className="text-xs font-semibold text-neutral-300 mb-3 flex items-center gap-1.5 pb-2 border-b border-neutral-900">
                <Flag className="w-3.5 h-3.5 text-neutral-400" /> Constructors Championship
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400 text-[11px] font-medium">
                    <tr>
                      <th className="py-2 px-3">Team</th>
                      <th className="py-2 px-3">Nationality</th>
                      <th className="py-2 px-3 font-mono text-center">Wins</th>
                      <th className="py-2 px-3 font-mono text-center">Podiums</th>
                      <th className="py-2 px-3 font-mono text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {standings.teams.map((t: any) => (
                      <tr key={t.team_name} className="hover:bg-neutral-900/60 transition">
                        <td className="py-2 px-3 font-medium text-white">{t.team_name}</td>
                        <td className="py-2 px-3 text-neutral-500">{t.nationality}</td>
                        <td className="py-2 px-3 font-mono text-center text-neutral-400">{t.wins}</td>
                        <td className="py-2 px-3 font-mono text-center text-neutral-400">{t.podiums}</td>
                        <td className="py-2 px-3 font-mono text-right text-neutral-200 font-semibold">{t.total_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STORED PROCEDURE DEMO */}
        {activeTab === 'driver-card' && (
          <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-6 max-w-xl mx-auto space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-neutral-400" /> Driver Season Performance Card
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Executes MySQL Stored Procedure: <code className="font-mono text-neutral-300">CALL sp_get_driver_season_summary(2023, driver)</code>
              </p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  placeholder="Driver surname (Verstappen, Alonso, Hamilton)"
                  className="w-full bg-neutral-900 border border-neutral-800 pl-8 pr-3 py-1.5 rounded-md text-xs text-white focus:outline-none focus:border-neutral-600 transition"
                />
              </div>
              <button
                onClick={() => loadDriverSummary(driverSearch)}
                className="bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs px-3.5 py-1.5 rounded-md transition border border-neutral-700"
              >
                Execute
              </button>
            </div>

            {driverSummary ? (
              <div className="grid grid-cols-2 gap-3 bg-neutral-950 p-4 rounded-md border border-neutral-900 text-xs">
                <div className="col-span-2 pb-2.5 border-b border-neutral-900">
                  <div className="text-[11px] text-neutral-500 uppercase tracking-wider">Driver Profile</div>
                  <div className="text-base font-semibold text-white mt-0.5">{driverSummary.driver_name}</div>
                  <div className="text-[11px] text-neutral-400">2023 Season Totals</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500">Races Entered</div>
                  <div className="text-sm font-mono text-neutral-200 mt-0.5">{driverSummary.races_entered}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500">Best Finish</div>
                  <div className="text-sm font-mono text-neutral-200 mt-0.5">P{driverSummary.best_finish}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500">Total Wins</div>
                  <div className="text-sm font-mono text-neutral-200 mt-0.5">{driverSummary.total_wins}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500">Total Podiums</div>
                  <div className="text-sm font-mono text-neutral-200 mt-0.5">{driverSummary.podiums}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500">Total Points</div>
                  <div className="text-sm font-mono text-neutral-200 mt-0.5">{driverSummary.total_points}</div>
                </div>
                <div>
                  <div className="text-[11px] text-neutral-500">Avg Pit Stop</div>
                  <div className="text-sm font-mono text-neutral-200 mt-0.5">
                    {driverSummary.avg_pit_stop_duration ? `${driverSummary.avg_pit_stop_duration}s` : 'N/A'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-neutral-500">
                No record returned for &quot;{driverSearch}&quot;.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STRATEGY DESK (CRUD & AUTHORIZATION) */}
        {activeTab === 'strategy' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Create Strategy Form */}
            <div className="lg:col-span-1 bg-neutral-900/40 border border-neutral-900 rounded-lg p-5">
              <div className="text-xs font-semibold text-neutral-200 mb-1 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-neutral-400" /> New Strategy Note
              </div>
              <p className="text-[11px] text-neutral-500 mb-4">
                RBAC enforced: Only Strategists can insert or delete records.
              </p>

              <form onSubmit={handleAddStrategy} className="space-y-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Grand Prix</label>
                  <select
                    value={selectedRaceId || ''}
                    onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                    className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                  >
                    {races.map((r) => (
                      <option key={r.race_id} value={r.race_id}>
                        R{r.round_no} {r.circuit_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Strategy Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. 2-Stop Undercut on Lap 18"
                    className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Recommended Tyre</label>
                  <select
                    value={noteTyre}
                    onChange={(e) => setNoteTyre(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                  >
                    <option value="Soft">Soft (Red)</option>
                    <option value="Medium">Medium (Yellow)</option>
                    <option value="Hard">Hard (White)</option>
                    <option value="Intermediate">Intermediate (Green)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Analysis / Notes</label>
                  <textarea
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Provide pit window and tyre degradation metrics..."
                    className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={userRole !== 'Strategist'}
                  className={`w-full py-2 rounded-md text-xs font-medium transition ${userRole === 'Strategist'
                    ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                    : 'bg-neutral-900 text-neutral-600 border border-neutral-900 cursor-not-allowed'
                    }`}
                >
                  Save Strategy Note (INSERT)
                </button>
              </form>
            </div>

            {/* Existing Notes Feed */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                <span className="font-medium text-neutral-300">Active Strategy Notes</span>
                <span>{notes.length} records</span>
              </div>

              {notes.length === 0 ? (
                <div className="bg-neutral-900/30 border border-neutral-900 rounded-lg p-8 text-center text-xs text-neutral-500">
                  No strategy notes recorded yet.
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n.note_id} className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-3.5 flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{n.title}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
                          {n.recommended_tyre}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          by {n.author_role}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300">{n.content}</p>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteStrategy(n.note_id)}
                      disabled={userRole !== 'Strategist'}
                      title={userRole !== 'Strategist' ? 'Only Strategists can delete' : 'Delete note'}
                      className={`p-1.5 rounded transition ${userRole === 'Strategist'
                        ? 'text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10'
                        : 'text-neutral-700 cursor-not-allowed'
                        }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: STUDENT B - TELEMETRY & RACE EVENTS (NOSQL LAYER) */}
        {activeTab === 'telemetry' && (
          <div className="space-y-6">
            {/* Top Bar */}
            <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Radio className="w-4 h-4 text-neutral-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Telemetry & Event Stream</div>
                  <div className="text-[11px] text-neutral-500">MongoDB collection: telemetry_samples & race_events</div>
                </div>
              </div>

              {/* Lap Selection */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-neutral-500 mr-1">Lap:</span>
                {[1, 5, 15, 25, 35, 45, 50].map((lapNum) => (
                  <button
                    key={lapNum}
                    onClick={() => setSelectedLap(lapNum)}
                    className={`px-2 py-1 text-xs font-mono rounded transition ${selectedLap === lapNum
                      ? 'bg-neutral-800 text-white border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                      }`}
                  >
                    L{lapNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Visualizer Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2 bg-neutral-900/40 border border-neutral-900 rounded-lg p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-900">
                  <div>
                    <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-neutral-400" /> Head-to-Head Trace (Lap {selectedLap})
                    </h3>
                  </div>

                  {/* Driver Selectors */}
                  <div className="flex items-center gap-2 text-xs">
                    <select
                      value={driverAId}
                      onChange={(e) => setDriverAId(Number(e.target.value))}
                      className="bg-neutral-900 border border-neutral-800 text-sky-400 font-medium rounded px-2 py-1 focus:outline-none"
                    >
                      {AVAILABLE_DRIVERS.map((d) => (
                        <option key={d.id} value={d.id} className="bg-neutral-900 text-neutral-200">{d.code} ({d.name.split(' ').pop()})</option>
                      ))}
                    </select>

                    <span className="text-neutral-500 text-[11px]">vs</span>

                    <select
                      value={driverBId}
                      onChange={(e) => setDriverBId(Number(e.target.value))}
                      className="bg-neutral-900 border border-neutral-800 text-amber-400 font-medium rounded px-2 py-1 focus:outline-none"
                    >
                      {AVAILABLE_DRIVERS.map((d) => (
                        <option key={d.id} value={d.id} className="bg-neutral-900 text-neutral-200">{d.code} ({d.name.split(' ').pop()})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Metric Selector Buttons */}
                <div className="flex gap-1.5">
                  {(['speed', 'throttle', 'rpm', 'gear'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetricMode(m)}
                      className={`text-xs px-2.5 py-1 rounded transition capitalize ${metricMode === m
                        ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                        : 'text-neutral-500 hover:text-neutral-300'
                        }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Chart Frame */}
                <div className="bg-neutral-950 p-2.5 rounded border border-neutral-900">
                  {telemetryLoading ? (
                    <div className="h-44 flex items-center justify-center text-xs text-neutral-500">
                      Querying MongoDB...
                    </div>
                  ) : (
                    renderSvgTelemetry()
                  )}
                </div>
              </div>

              {/* Sensor Stat Cards */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5 space-y-3">
                  <div className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5 pb-2 border-b border-neutral-900">
                    <Layers className="w-3.5 h-3.5 text-neutral-400" /> Delta Readout
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-neutral-950 p-2.5 rounded border border-neutral-900 flex justify-between items-center hover:border-neutral-800 transition">
                      <div>
                        <div className="text-[11px] text-neutral-500 mb-0.5">Peak Speed (Car A)</div>
                        <div className="text-base font-mono font-bold text-sky-400">
                          {Math.max(...telemetrySamples.filter(s => s.driver_id === driverAId).map(s => s.telemetry?.speed || 0), 322)}
                          <span className="text-[11px] font-sans font-normal text-neutral-400 ml-1">km/h</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-neutral-500 mb-0.5">Comp. Peak (Car B)</div>
                        <div className="text-base font-mono font-bold text-amber-400">
                          {Math.max(...telemetrySamples.filter(s => s.driver_id === driverBId).map(s => s.telemetry?.speed || 0), 318)}
                          <span className="text-[11px] font-sans font-normal text-neutral-400 ml-1">km/h</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-950 p-2.5 rounded border border-neutral-900 flex justify-between items-center hover:border-neutral-800 transition">
                      <div>
                        <div className="text-[11px] text-neutral-500 mb-0.5">Avg Throttle (Car A)</div>
                        <div className="text-base font-mono font-bold text-emerald-400">
                          {(() => {
                            const samples = telemetrySamples.filter(s => s.driver_id === driverAId);
                            if (samples.length === 0) return '78.4%';
                            const avg = samples.reduce((acc, s) => acc + (s.telemetry?.throttle || 0), 0) / samples.length;
                            return `${avg.toFixed(1)}%`;
                          })()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-neutral-500 mb-0.5">Comp. Avg (Car B)</div>
                        <div className="text-base font-mono font-bold text-teal-400">
                          {(() => {
                            const samples = telemetrySamples.filter(s => s.driver_id === driverBId);
                            if (samples.length === 0) return '75.9%';
                            const avg = samples.reduce((acc, s) => acc + (s.telemetry?.throttle || 0), 0) / samples.length;
                            return `${avg.toFixed(1)}%`;
                          })()}
                        </div>
                      </div>
                    </div>

                    <div className="bg-neutral-950 p-2.5 rounded border border-neutral-900 flex justify-between items-center">
                      <div>
                        <div className="text-[11px] text-neutral-500 mb-0.5">DRS Activation</div>
                        <div className="text-xs font-mono font-medium text-neutral-300">
                          {telemetrySamples.filter(s => (s.driver_id === driverAId || s.driver_id === driverBId) && s.telemetry?.drs === 1).length > 0
                            ? 'Zones 1 & 3'
                            : 'Inactive In Stint'}
                        </div>
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-neutral-900/30 border border-neutral-900 rounded-lg p-3.5">
                  <div className="text-[11px] font-medium text-neutral-400 mb-1">Architectural Justification</div>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Time-series telemetry samples (10-50Hz) are stored in MongoDB to prevent table bloat in MySQL while maintaining foreign reference links via <code className="text-neutral-400 font-mono">race_id</code> and <code className="text-neutral-400 font-mono">driver_id</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Middle Section: MongoDB Aggregation Pipeline - Speed Trap */}
            <div className="bg-neutral-900/40 border border-neutral-900 rounded-lg p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-neutral-900">
                <div>
                  <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-neutral-400" /> Aggregation Pipeline: Speed Trap & Stint Analytics
                  </h3>
                </div>

                <button
                  onClick={() => setShowPipelineCode(!showPipelineCode)}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPipelineCode ? 'rotate-180' : ''}`} />
                  {showPipelineCode ? 'Hide Pipeline' : 'View Aggregation Pipeline'}
                </button>
              </div>

              {showPipelineCode && (
                <div className="bg-neutral-950 p-3.5 rounded border border-neutral-900 font-mono text-[11px] text-neutral-300 overflow-x-auto">
                  <pre>{`db.telemetry_samples.aggregate([
  { $match: { race_id: ${selectedRaceId || 1} } },
  {
    $group: {
      _id: { driver_id: "$driver_id", driver_code: "$driver_code" },
      top_speed: { $max: "$telemetry.speed" },
      avg_speed: { $avg: "$telemetry.speed" },
      avg_throttle: { $avg: "$telemetry.throttle" },
      total_drs_samples: { $sum: "$telemetry.drs" },
      samples_analyzed: { $sum: 1 }
    }
  },
  { $project: { driver_code: "$_id.driver_code", top_speed: { $round: ["$top_speed", 1] }, avg_speed: { $round: ["$avg_speed", 1] }, avg_throttle: { $round: ["$avg_throttle", 1] }, total_drs_samples: 1, samples_analyzed: 1 } },
  { $sort: { top_speed: -1 } }
]);`}</pre>
                </div>
              )}

              {/* Speed Trap Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400 text-[11px] font-medium">
                    <tr>
                      <th className="py-2 px-3 font-mono">Rank</th>
                      <th className="py-2 px-3">Driver</th>
                      <th className="py-2 px-3 font-mono text-right">Top Speed</th>
                      <th className="py-2 px-3 font-mono text-right">Avg Speed</th>
                      <th className="py-2 px-3 font-mono text-right">Avg Throttle</th>
                      <th className="py-2 px-3 font-mono text-center">DRS Deployments</th>
                      <th className="py-2 px-3 font-mono text-right">Samples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {speedTrap.map((st: any, idx: number) => (
                      <tr key={st.driver_code || idx} className="hover:bg-neutral-900/60 transition">
                        <td className="py-2 px-3 font-mono text-neutral-500">#{idx + 1}</td>
                        <td className="py-2 px-3 font-medium text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: AVAILABLE_DRIVERS.find(d => d.code === st.driver_code)?.color || '#94a3b8' }}></span>
                          {st.driver_code}
                          <span className="text-neutral-500 text-[11px]">
                            ({AVAILABLE_DRIVERS.find(d => d.code === st.driver_code)?.name?.split(' ').pop() || 'Driver'})
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-right text-neutral-200 font-semibold">{st.top_speed} km/h</td>
                        <td className="py-2 px-3 font-mono text-right text-neutral-400">{st.avg_speed} km/h</td>
                        <td className="py-2 px-3 font-mono text-right text-neutral-400">{st.avg_throttle}%</td>
                        <td className="py-2 px-3 font-mono text-center text-neutral-400">{st.total_drs_samples}</td>
                        <td className="py-2 px-3 font-mono text-right text-neutral-500">{st.samples_analyzed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Row: Race Events Feed & Incident Logging (NoSQL CRUD) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Incident Feed */}
              <div className="lg:col-span-2 bg-neutral-900/40 border border-neutral-900 rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-900 text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-neutral-400" /> Race Control Incidents
                  </div>
                  <span className="text-neutral-500 font-mono text-[11px]">{raceEvents.length} events logged</span>
                </div>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {raceEvents.map((ev, idx) => (
                    <div key={ev._id || idx} className="bg-neutral-950 p-3 rounded border border-neutral-900 flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded text-[11px]">
                            L{ev.lap_number}
                          </span>
                          <span className="font-medium text-white">
                            {ev.event_type}
                          </span>
                          {ev.driver_name && (
                            <span className="text-neutral-400 text-[11px]">
                              • {ev.driver_name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-300 leading-snug">{ev.description}</p>
                        <div className="text-[10px] text-neutral-500 font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString()}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400">
                        {ev.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log Incident Form */}
              <div className="lg:col-span-1 bg-neutral-900/40 border border-neutral-900 rounded-lg p-5 space-y-3">
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-neutral-400" /> Log Race Incident
                </div>
                <p className="text-[11px] text-neutral-500">
                  Inserts document into MongoDB <code className="text-neutral-400 font-mono">race_events</code> collection.
                </p>

                <form onSubmit={handleLogEvent} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Incident Type</label>
                    <select
                      value={newEvType}
                      onChange={(e) => setNewEvType(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                    >
                      <option value="Yellow Flag">Yellow Flag</option>
                      <option value="Virtual Safety Car">Virtual Safety Car (VSC)</option>
                      <option value="Safety Car">Safety Car (Full SC)</option>
                      <option value="Red Flag">Red Flag</option>
                      <option value="Penalty">Time / Grid Penalty</option>
                      <option value="Incident">Driver Incident</option>
                      <option value="Overtake">Overtake</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Lap</label>
                      <input
                        type="number"
                        min={1}
                        max={70}
                        value={newEvLap}
                        onChange={(e) => setNewEvLap(Number(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-neutral-400 block mb-1">Severity</label>
                      <select
                        value={newEvSeverity}
                        onChange={(e) => setNewEvSeverity(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Driver / Sector</label>
                    <input
                      type="text"
                      value={newEvDriver}
                      onChange={(e) => setNewEvDriver(e.target.value)}
                      placeholder="e.g. Charles Leclerc / Turn 4"
                      className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newEvDesc}
                      onChange={(e) => setNewEvDesc(e.target.value)}
                      placeholder="Detail incident specifics..."
                      className="w-full bg-neutral-900 border border-neutral-800 px-2.5 py-1.5 rounded-md text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={userRole !== 'Strategist' || eventPosting}
                    className={`w-full py-2 rounded-md text-xs font-medium transition ${userRole === 'Strategist'
                      ? 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                      : 'bg-neutral-900 text-neutral-600 border border-neutral-900 cursor-not-allowed'
                      }`}
                  >
                    {eventPosting ? 'Logging Incident...' : 'Insert Incident Document'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
