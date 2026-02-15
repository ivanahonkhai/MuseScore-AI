
import React, { useState, useEffect, useRef } from 'react';
import { 
  MusicNote, NoteDuration, DynamicMarking, InstrumentType, ClefType, Staff,
  DURATION_LABELS, KEYS, TIME_SIGNATURES, DYNAMIC_VALUES
} from './types';
import MusicStaff from './components/MusicStaff';
import { audioService } from './services/audioService';
import { analyzeSong } from './services/geminiService';

const App: React.FC = () => {
  const [staffs, setStaffs] = useState<Staff[]>([
    { id: 'staff-1', name: 'Melody', clef: 'treble', instrument: 'piano', notes: [] },
    { id: 'staff-2', name: 'Accompaniment', clef: 'bass', instrument: 'piano', notes: [] }
  ]);
  const [activeStaffId, setActiveStaffId] = useState<string>('staff-1');
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('0.25');
  const [selectedDynamic, setSelectedDynamic] = useState<DynamicMarking>('mf');
  const [keySignature, setKeySignature] = useState(KEYS[0]);
  const [timeSignature, setTimeSignature] = useState(TIME_SIGNATURES[0]);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(100);
  const [playbackBeat, setPlaybackBeat] = useState(0);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [songAnalysis, setSongAnalysis] = useState<string>('');

  const playbackRef = useRef<number | null>(null);

  const addNote = (staffId: string, pitch: string, beat: number) => {
    const newNote: MusicNote = {
      id: Math.random().toString(36).substr(2, 9),
      pitch,
      beat,
      duration: selectedDuration,
      dynamic: selectedDynamic
    };
    
    const staff = staffs.find(s => s.id === staffId);
    if (!staff) return;

    audioService.playNote(
      pitch, 
      parseFloat(selectedDuration) * (60 / tempo) * 4, 
      DYNAMIC_VALUES[selectedDynamic],
      staff.instrument
    );
    
    setStaffs(prev => prev.map(s => {
      if (s.id === staffId) {
        return {
          ...s,
          notes: [...s.notes.filter(n => !(n.pitch === pitch && n.beat === beat)), newNote].sort((a, b) => a.beat - b.beat)
        };
      }
      return s;
    }));
  };

  const removeNote = (staffId: string, noteId: string) => {
    setStaffs(prev => prev.map(s => {
      if (s.id === staffId) {
        return { ...s, notes: s.notes.filter(n => n.id !== noteId) };
      }
      return s;
    }));
  };

  const addStaff = () => {
    const id = `staff-${Date.now()}`;
    setStaffs(prev => [...prev, { id, name: `Staff ${prev.length + 1}`, clef: 'treble', instrument: 'piano', notes: [] }]);
    setActiveStaffId(id);
  };

  const updateStaffSettings = (id: string, updates: Partial<Staff>) => {
    setStaffs(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const clearSong = () => {
    setStaffs(prev => prev.map(s => ({ ...s, notes: [] })));
    setSongAnalysis('');
  };

  const togglePlay = () => {
    if (isPlaying) {
      if (playbackRef.current) clearInterval(playbackRef.current);
      setIsPlaying(false);
      setPlaybackBeat(0);
    } else {
      setIsPlaying(true);
      startPlayback();
    }
  };

  const startPlayback = () => {
    let currentBeat = 0;
    const resolution = 0.0625; // 16th note steps
    const stepInterval = (60 / tempo) * 1000 * 4 * resolution;
    
    playbackRef.current = window.setInterval(() => {
      setPlaybackBeat(currentBeat);
      
      staffs.forEach(staff => {
        const notesToPlay = staff.notes.filter(n => Math.abs(n.beat - currentBeat) < 0.001);
        notesToPlay.forEach(note => {
          audioService.playNote(
            note.pitch, 
            parseFloat(note.duration) * (60 / tempo) * 4,
            DYNAMIC_VALUES[note.dynamic],
            staff.instrument
          );
        });
      });

      currentBeat += resolution;
      if (currentBeat >= 8) { // 2 measures limit for now
        if (playbackRef.current) clearInterval(playbackRef.current);
        setIsPlaying(false);
        setPlaybackBeat(0);
      }
    }, stepInterval);
  };

  const handleAnalyze = async () => {
    const allNotes = staffs.flatMap(s => s.notes);
    if (allNotes.length === 0) return;
    setIsAiLoading(true);
    try {
      const analysis = await analyzeSong(allNotes);
      setSongAnalysis(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-[1200px] mx-auto bg-slate-50">
      {/* Header */}
      <header className="w-full mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold serif-font text-slate-800">MuseScore AI</h1>
          <p className="text-slate-400 font-medium">Multi-instrument composition studio.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={togglePlay}
            className={`px-8 py-3 rounded-full font-bold shadow-xl transition-all ${
              isPlaying ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-900 text-white'
            }`}
          >
            {isPlaying ? '⏹ Stop' : '▶ Play Score'}
          </button>
          <button 
            onClick={clearSong}
            className="px-6 py-3 rounded-full font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </header>

      {/* Toolbox */}
      <section className="w-full grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Note Duration Picker */}
        <div className="md:col-span-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Rhythm Toolbox</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(DURATION_LABELS) as [NoteDuration, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSelectedDuration(val)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedDuration === val 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Settings */}
        <div className="md:col-span-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Score Settings</label>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-500">Tempo</span>
              <input 
                type="range" min="40" max="180" value={tempo} 
                onChange={(e) => setTempo(parseInt(e.target.value))}
                className="flex-1 accent-indigo-600"
              />
              <span className="text-xs font-mono font-bold w-12">{tempo}</span>
            </div>
            <div className="flex gap-2">
               <select 
                value={timeSignature} 
                onChange={(e) => setTimeSignature(e.target.value)}
                className="flex-1 bg-slate-50 text-xs font-bold p-2 rounded-lg border-none"
              >
                {TIME_SIGNATURES.map(ts => <option key={ts} value={ts}>{ts}</option>)}
              </select>
               <select 
                value={keySignature} 
                onChange={(e) => setKeySignature(e.target.value)}
                className="flex-1 bg-slate-50 text-xs font-bold p-2 rounded-lg border-none"
              >
                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Score Editor */}
      <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden mb-8">
        {/* Staff Headers / Tabs */}
        <div className="bg-slate-100/50 p-2 flex gap-2 border-b border-slate-200 overflow-x-auto">
          {staffs.map(s => (
            <div 
              key={s.id}
              className={`group flex items-center gap-3 px-4 py-2 rounded-xl cursor-pointer transition-all ${
                activeStaffId === s.id ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-200/50'
              }`}
              onClick={() => setActiveStaffId(s.id)}
            >
              <div className="flex flex-col">
                <input 
                  className="bg-transparent border-none p-0 text-xs font-bold text-slate-700 outline-none w-24"
                  value={s.name}
                  onChange={(e) => updateStaffSettings(s.id, { name: e.target.value })}
                />
                <div className="flex gap-1">
                  <select 
                    className="bg-transparent border-none p-0 text-[10px] text-slate-400 font-medium outline-none"
                    value={s.clef}
                    onChange={(e) => updateStaffSettings(s.id, { clef: e.target.value as ClefType })}
                  >
                    <option value="treble">Treble</option>
                    <option value="bass">Bass</option>
                  </select>
                  <span className="text-[10px] text-slate-300">•</span>
                  <select 
                    className="bg-transparent border-none p-0 text-[10px] text-slate-400 font-medium outline-none"
                    value={s.instrument}
                    onChange={(e) => updateStaffSettings(s.id, { instrument: e.target.value as InstrumentType })}
                  >
                    <option value="piano">Piano</option>
                    <option value="strings">Strings</option>
                    <option value="brass">Brass</option>
                    <option value="organ">Organ</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={addStaff}
            className="px-4 py-2 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:text-slate-600 hover:border-slate-400 text-xs font-bold"
          >
            + Add Staff
          </button>
        </div>

        {/* Staff Rendering */}
        <div className="relative">
          {staffs.map(staff => (
            <MusicStaff 
              key={staff.id}
              staff={staff}
              isActive={activeStaffId === staff.id}
              onAddNote={addNote}
              onRemoveNote={removeNote}
              isPlaying={isPlaying}
              playbackBeat={playbackBeat}
              timeSignature={timeSignature}
            />
          ))}
          
          {/* Vertical Score Line (Connecting staffs) */}
          <div className="absolute left-[60px] top-[30px] bottom-[30px] w-[2px] bg-slate-400" />
        </div>
      </div>

      {/* Footer / AI */}
      <div className="w-full flex flex-col md:flex-row gap-6">
        <button 
          onClick={handleAnalyze}
          disabled={isAiLoading}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white p-6 rounded-3xl font-bold shadow-lg transition-all disabled:opacity-50"
        >
          {isAiLoading ? 'Gemini is Analyzing...' : '✨ Deep Analysis of Score'}
        </button>
        {songAnalysis && (
          <div className="flex-[2] bg-white border border-slate-200 p-6 rounded-3xl shadow-sm italic serif-font text-xl text-slate-700">
            "{songAnalysis}"
          </div>
        )}
      </div>

      <footer className="mt-12 text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center">
        MuseScore AI v3.0 • Advanced Notation Mode • 16th Note Resolution
      </footer>
    </div>
  );
};

export default App;
