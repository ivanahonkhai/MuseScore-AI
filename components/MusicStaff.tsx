
import React from 'react';
import { MusicNote, PITCHES_TREBLE, PITCHES_BASS, NoteDuration, ClefType } from '../types';

interface MusicStaffProps {
  staff: {
    id: string;
    clef: ClefType;
    notes: MusicNote[];
  };
  onAddNote: (staffId: string, pitch: string, beat: number) => void;
  onRemoveNote: (staffId: string, noteId: string) => void;
  isPlaying: boolean;
  playbackBeat: number;
  timeSignature: string;
  isActive: boolean;
}

const MusicStaff: React.FC<MusicStaffProps> = ({ 
  staff,
  onAddNote, 
  onRemoveNote,
  isPlaying,
  playbackBeat,
  timeSignature,
  isActive
}) => {
  const LINE_SPACING = 12;
  const STAFF_TOP_PADDING = 30;
  const BEAT_WIDTH = 120; // Width of one quarter note beat
  const NUM_BEATS = 8; // Display 2 measures of 4/4
  const SUB_BEAT_RESOLUTION = 4; // 16th notes
  const GRID_WIDTH = BEAT_WIDTH / SUB_BEAT_RESOLUTION;

  const currentPitches = staff.clef === 'treble' ? PITCHES_TREBLE : PITCHES_BASS;

  const getPitchFromY = (y: number) => {
    const relativeY = y - STAFF_TOP_PADDING;
    const stepHeight = LINE_SPACING / 2;
    const index = Math.round(relativeY / stepHeight);
    if (index < 0 || index >= currentPitches.length) return null;
    return currentPitches[index];
  };

  const getBeatFromX = (x: number) => {
    const rawBeat = x / BEAT_WIDTH;
    // Snap to 16th note (0.25 of a quarter beat)
    return Math.round(rawBeat * SUB_BEAT_RESOLUTION) / SUB_BEAT_RESOLUTION;
  };

  const handleStaffClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pitch = getPitchFromY(y);
    const beat = getBeatFromX(x);

    if (pitch !== null && beat >= 0 && beat < NUM_BEATS) {
      onAddNote(staff.id, pitch, beat);
    }
  };

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0]) || 4;

  return (
    <div className={`relative w-full ${isActive ? 'bg-indigo-50/30' : 'bg-white'} border-b border-slate-200 transition-colors`}>
      <div style={{ width: NUM_BEATS * BEAT_WIDTH + 100, height: 160 }} className="relative mx-auto">
        <svg 
          width={NUM_BEATS * BEAT_WIDTH + 100} 
          height="100%" 
          onClick={handleStaffClick}
          className="cursor-crosshair"
        >
          {/* Measure Bars */}
          {Array.from({ length: Math.ceil(NUM_BEATS / beatsPerMeasure) + 1 }).map((_, i) => (
            <line 
              key={`measure-${i}`}
              x1={i * beatsPerMeasure * BEAT_WIDTH + 60} 
              y1={STAFF_TOP_PADDING + 3 * LINE_SPACING} 
              x2={i * beatsPerMeasure * BEAT_WIDTH + 60} 
              y2={STAFF_TOP_PADDING + 7 * LINE_SPACING} 
              stroke="#94a3b8" 
              strokeWidth="2"
            />
          ))}

          {/* Staff Lines */}
          {[0, 1, 2, 3, 4].map(i => (
            <line 
              key={`line-${i}`}
              x1="60" 
              y1={STAFF_TOP_PADDING + (i + 3) * LINE_SPACING} 
              x2={NUM_BEATS * BEAT_WIDTH + 60} 
              y2={STAFF_TOP_PADDING + (i + 3) * LINE_SPACING} 
              stroke="#cbd5e1" 
              strokeWidth="1"
            />
          ))}

          {/* Sub-grid (vague dots for 16ths) */}
          {Array.from({ length: NUM_BEATS * SUB_BEAT_RESOLUTION }).map((_, i) => (
            <circle 
              key={`grid-${i}`}
              cx={i * GRID_WIDTH + 60}
              cy={STAFF_TOP_PADDING + 5 * LINE_SPACING}
              r="1"
              fill="#e2e8f0"
            />
          ))}

          {/* Playback Cursor */}
          {isPlaying && (
            <rect 
              x={playbackBeat * BEAT_WIDTH + 60}
              y={STAFF_TOP_PADDING}
              width="2"
              height={10 * LINE_SPACING}
              fill="#f43f5e"
              className="opacity-40"
            />
          )}

          {/* Notes */}
          {staff.notes.map(note => {
            const pitchIndex = currentPitches.indexOf(note.pitch);
            if (pitchIndex === -1) return null;

            const cy = STAFF_TOP_PADDING + pitchIndex * (LINE_SPACING / 2);
            const cx = note.beat * BEAT_WIDTH + 60;
            
            const isHollow = note.duration === '1' || note.duration === '0.5' || note.duration === '0.75';
            const hasStem = note.duration !== '1';
            const stemUp = pitchIndex >= 7; // Simple rule: higher than middle line, stem down
            const stemHeight = 30;

            return (
              <g 
                key={note.id} 
                className="group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveNote(staff.id, note.id);
                }}
              >
                {/* Stem */}
                {hasStem && (
                  <line 
                    x1={stemUp ? cx + 5.5 : cx - 5.5}
                    y1={cy}
                    x2={stemUp ? cx + 5.5 : cx - 5.5}
                    y2={stemUp ? cy - stemHeight : cy + stemHeight}
                    stroke="#1e293b"
                    strokeWidth="1.2"
                  />
                )}
                
                {/* Flags for 8th/16th */}
                {note.duration === '0.125' && (
                   <path 
                    d={`M ${stemUp ? cx + 5.5 : cx - 5.5} ${stemUp ? cy - stemHeight : cy + stemHeight} q 5 5 5 15`}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1.2"
                   />
                )}
                {note.duration === '0.0625' && (
                   <g>
                    <path d={`M ${stemUp ? cx + 5.5 : cx - 5.5} ${stemUp ? cy - stemHeight : cy + stemHeight} q 5 5 5 15`} fill="none" stroke="#1e293b" strokeWidth="1.2" />
                    <path d={`M ${stemUp ? cx + 5.5 : cx - 5.5} ${stemUp ? cy - stemHeight + 8 : cy + stemHeight - 8} q 5 5 5 15`} fill="none" stroke="#1e293b" strokeWidth="1.2" />
                   </g>
                )}

                {/* Note Head */}
                <ellipse 
                  cx={cx} 
                  cy={cy} 
                  rx="6" 
                  ry="4.5" 
                  transform={`rotate(-20, ${cx}, ${cy})`}
                  fill={isHollow ? 'white' : '#1e293b'} 
                  stroke="#1e293b"
                  strokeWidth="1.8"
                  className="group-hover:stroke-rose-500 transition-colors"
                />
                
                {/* Dot for dotted notes */}
                {(note.duration === '0.75' || note.duration === '0.375' || note.duration === '0.1875') && (
                  <circle cx={cx + 12} cy={cy} r="1.5" fill="#1e293b" />
                )}

                <text x={cx - 15} y={cy + 25} fontSize="9" className="fill-slate-400 italic font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  {note.dynamic}
                </text>
              </g>
            );
          })}

          {/* Staff Indicators */}
          <text x="10" y={STAFF_TOP_PADDING + 5.5 * LINE_SPACING} fontSize="40" className="fill-slate-300 font-serif italic select-none">
            {staff.clef === 'treble' ? '𝄞' : '𝄢'}
          </text>
        </svg>

        {/* Staff Label */}
        <div className="absolute left-0 top-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">
          {staff.name || 'Staff'}
        </div>
      </div>
    </div>
  );
};

export default MusicStaff;
