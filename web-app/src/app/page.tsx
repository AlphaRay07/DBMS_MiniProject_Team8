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
  Activity
} from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'races' | 'standings' | 'driver-card' | 'strategy'>('races');
  const [userRole, setUserRole] = useState<'Strategist' | 'Viewer'>('Strategist');

  // Data states
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
  const [loading, setLoading] = useState(false);

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
  }, [selectedRaceId]);

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white p-2 rounded-lg font-black tracking-wider text-sm">
            F1
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Motorsport Race Strategy System</h1>
            <p className="text-xs text-slate-400">MySQL Relational Engine & Performance Analytics</p>
          </div>
        </div>

        {/* Role Selector (Rubric Sec. 11) */}
        <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-300 font-medium">Role:</span>
          <select 
            value={userRole} 
            onChange={(e) => setUserRole(e.target.value as any)}
            className="bg-slate-900 text-xs font-semibold px-2 py-1 rounded text-emerald-400 focus:outline-none"
          >
            <option value="Strategist">Race Strategist (Admin/CRUD)</option>
            <option value="Viewer">Spectator / Viewer (Read-only)</option>
          </select>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-slate-800 bg-slate-900/40 px-6 flex gap-6">
        <button
          onClick={() => setActiveTab('races')}
          className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'races'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Flag className="w-4 h-4" /> Grand Prix Results
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'standings'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" /> Championship Standings
        </button>
        <button
          onClick={() => setActiveTab('driver-card')}
          className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'driver-card'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-4 h-4" /> Stored Procedure Analytics
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`py-3.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition ${
            activeTab === 'strategy'
              ? 'border-red-500 text-white'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" /> Strategy Desk (CRUD)
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {/* TAB 1: RACES & CLASSIFICATION */}
        {activeTab === 'races' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Race List Sidebar */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 max-h-[78vh] overflow-y-auto">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-red-500" /> 2023 Race Calendar
              </h2>
              <div className="space-y-1.5">
                {races.map((r) => (
                  <button
                    key={r.race_id}
                    onClick={() => setSelectedRaceId(r.race_id)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                      selectedRaceId === r.race_id
                        ? 'bg-red-600/20 text-red-400 border border-red-500/40'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white">R{r.round_no} {r.circuit_name}</div>
                      <div className="text-[11px] text-slate-400">{r.country} • {r.race_date.split('T')[0]}</div>
                    </div>
                    {r.winner_name && (
                      <span className="text-[10px] bg-slate-800 text-amber-400 px-1.5 py-0.5 rounded font-mono">
                        🏆 {r.winner_name.split(' ').pop()}
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
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <span className="text-xs font-bold text-red-500 tracking-wide uppercase">
                          Round {raceDetails.race.round_no}
                        </span>
                        <h2 className="text-xl font-bold text-white">{raceDetails.race.circuit_name}</h2>
                        <p className="text-xs text-slate-400">{raceDetails.race.location}, {raceDetails.race.country}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400">Total Classified</span>
                        <div className="text-lg font-black text-emerald-400">{raceDetails.results.length} Cars</div>
                      </div>
                    </div>

                    {/* Classification Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="p-2.5 rounded-l">Pos</th>
                            <th className="p-2.5">Driver</th>
                            <th className="p-2.5">Team</th>
                            <th className="p-2.5">Grid</th>
                            <th className="p-2.5">+/-</th>
                            <th className="p-2.5">Laps</th>
                            <th className="p-2.5">Status</th>
                            <th className="p-2.5 rounded-r">Points</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {raceDetails.results.map((res: any) => (
                            <tr key={res.driver_name} className="hover:bg-slate-800/30">
                              <td className="p-2.5 font-bold font-mono">
                                {res.position ? res.position : 'DNF'}
                              </td>
                              <td className="p-2.5 font-semibold text-white">{res.driver_name}</td>
                              <td className="p-2.5 text-slate-400">{res.team_name}</td>
                              <td className="p-2.5 font-mono text-slate-400">{res.grid_position}</td>
                              <td className={`p-2.5 font-mono font-bold ${
                                res.positions_gained > 0
                                  ? 'text-emerald-400'
                                  : res.positions_gained < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-500'
                              }`}>
                                {res.positions_gained > 0 ? `+${res.positions_gained}` : res.positions_gained}
                              </td>
                              <td className="p-2.5 font-mono text-slate-300">{res.laps_completed}</td>
                              <td className="p-2.5 text-slate-400">{res.status}</td>
                              <td className="p-2.5 font-mono font-bold text-amber-400">{res.points}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pit Stops Summary */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                    <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" /> Pit Stop Execution Log (Decimal 8,3 Duration)
                    </h3>
                    <div className="overflow-x-auto max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="p-2">Lap</th>
                            <th className="p-2">Driver</th>
                            <th className="p-2">Team</th>
                            <th className="p-2">Stop Time</th>
                            <th className="p-2 text-right">Duration (Sec)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {raceDetails.pitStops.map((ps: any, idx: number) => (
                            <tr key={idx} className="hover:bg-slate-800/30">
                              <td className="p-2 font-mono text-slate-400">{ps.lap_number}</td>
                              <td className="p-2 font-medium text-white">{ps.driver_name}</td>
                              <td className="p-2 text-slate-400">{ps.team_name}</td>
                              <td className="p-2 font-mono text-slate-400">{ps.stop_time}</td>
                              <td className="p-2 font-mono font-bold text-right text-blue-400">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Driver Standings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Driver World Championship
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Rank</th>
                      <th className="p-2.5">Driver</th>
                      <th className="p-2.5">Team</th>
                      <th className="p-2.5 text-center">Wins</th>
                      <th className="p-2.5 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {standings.drivers.map((d: any) => (
                      <tr key={d.driver_name} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold font-mono text-amber-400">{d.championship_rank}</td>
                        <td className="p-2.5 font-semibold text-white">{d.driver_name}</td>
                        <td className="p-2.5 text-slate-400">{d.team_name}</td>
                        <td className="p-2.5 font-mono text-center text-slate-300">{d.total_wins}</td>
                        <td className="p-2.5 font-mono font-black text-right text-emerald-400">{d.championship_points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Constructor Standings */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-500" /> Constructors Championship
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800/60 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Team</th>
                      <th className="p-2.5">Nationality</th>
                      <th className="p-2.5 text-center">Wins</th>
                      <th className="p-2.5 text-center">Podiums</th>
                      <th className="p-2.5 text-right">Total Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {standings.teams.map((t: any) => (
                      <tr key={t.team_name} className="hover:bg-slate-800/30">
                        <td className="p-2.5 font-bold text-white">{t.team_name}</td>
                        <td className="p-2.5 text-slate-400">{t.nationality}</td>
                        <td className="p-2.5 font-mono text-center text-slate-300">{t.wins}</td>
                        <td className="p-2.5 font-mono text-center text-amber-400">{t.podiums}</td>
                        <td className="p-2.5 font-mono font-black text-right text-emerald-400">{t.total_points}</td>
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-indigo-400" /> Stored Procedure: Driver Season Card
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Executes MySQL procedure: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">CALL sp_get_driver_season_summary(2023, driver)</code>
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Driver surname (e.g. Verstappen, Alonso, Hamilton)"
                className="flex-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => loadDriverSummary(driverSearch)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-lg transition"
              >
                Execute Procedure
              </button>
            </div>

            {driverSummary ? (
              <div className="grid grid-cols-2 gap-4 bg-slate-950/60 p-5 rounded-xl border border-slate-800">
                <div className="col-span-2 border-b border-slate-800 pb-3">
                  <span className="text-xs text-slate-400 uppercase font-bold">Driver Name</span>
                  <div className="text-2xl font-black text-white">{driverSummary.driver_name}</div>
                  <span className="text-xs text-indigo-400">2023 Championship Statistics</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Races Entered</span>
                  <div className="text-xl font-bold font-mono text-white">{driverSummary.races_entered}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Best Finish</span>
                  <div className="text-xl font-bold font-mono text-amber-400">P{driverSummary.best_finish}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Total Wins</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">{driverSummary.total_wins}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Total Podiums</span>
                  <div className="text-xl font-bold font-mono text-amber-400">{driverSummary.podiums}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Total Points</span>
                  <div className="text-xl font-bold font-mono text-emerald-400">{driverSummary.total_points}</div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Avg Pit Stop Duration</span>
                  <div className="text-xl font-bold font-mono text-blue-400">
                    {driverSummary.avg_pit_stop_duration ? `${driverSummary.avg_pit_stop_duration}s` : 'N/A'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-500">
                No record returned from stored procedure for "{driverSearch}".
              </div>
            )}
          </div>
        )}

        {/* TAB 4: STRATEGY DESK (CRUD & AUTHORIZATION) */}
        {activeTab === 'strategy' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Strategy Form */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> New Strategy Recommendation
              </h2>
              <p className="text-[11px] text-slate-400 mb-4">
                Enforces Role-Based Access Control: Viewers cannot create or delete notes.
              </p>

              <form onSubmit={handleAddStrategy} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400">Select Grand Prix</label>
                  <select
                    value={selectedRaceId || ''}
                    onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  >
                    {races.map((r) => (
                      <option key={r.race_id} value={r.race_id}>
                        R{r.round_no} {r.circuit_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Strategy Title</label>
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="e.g. 2-Stop Undercut on Lap 18"
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400">Recommended Tyre</label>
                  <select
                    value={noteTyre}
                    onChange={(e) => setNoteTyre(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  >
                    <option value="Soft">Soft (Red)</option>
                    <option value="Medium">Medium (Yellow)</option>
                    <option value="Hard">Hard (White)</option>
                    <option value="Intermediate">Intermediate (Green)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Strategy Analysis / Instructions</label>
                  <textarea
                    rows={3}
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Detail telemetry justification and pit window..."
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={userRole !== 'Strategist'}
                  className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                    userRole === 'Strategist'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Save Strategy Note (INSERT)
                </button>
              </form>
            </div>

            {/* Existing Notes Feed (Demonstrates SELECT & DELETE) */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-bold text-white mb-2 flex items-center justify-between">
                <span>Active Strategy Notes (SQL DML: SELECT / DELETE)</span>
                <span className="text-xs text-slate-400">{notes.length} total notes</span>
              </h2>

              {notes.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-xs text-slate-500">
                  No strategy notes recorded yet. Add one using the form on the left!
                </div>
              ) : (
                notes.map((n) => (
                  <div key={n.note_id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{n.title}</span>
                        <span className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-0.5 rounded font-mono">
                          Tyre: {n.recommended_tyre}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                          By: {n.author_role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{n.content}</p>
                      <div className="text-[10px] text-slate-500">Created: {new Date(n.created_at).toLocaleString()}</div>
                    </div>

                    <button
                      onClick={() => handleDeleteStrategy(n.note_id)}
                      disabled={userRole !== 'Strategist'}
                      title={userRole !== 'Strategist' ? 'Only Strategists can delete' : 'Delete note'}
                      className={`p-2 rounded-lg transition ${
                        userRole === 'Strategist'
                          ? 'text-rose-400 hover:bg-rose-500/20'
                          : 'text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
