
export type NoteDuration = 
  | '1'      // Whole
  | '0.75'   // Dotted Half
  | '0.5'    // Half
  | '0.375'  // Dotted Quarter
  | '0.25'   // Quarter
  | '0.1875' // Dotted Eighth
  | '0.125'  // Eighth
  | '0.0625' // Sixteenth
  ;

export type DynamicMarking = 'p' | 'mf' | 'f';
export type InstrumentType = 'piano' | 'organ' | 'brass' | 'strings';
export type ClefType = 'treble' | 'bass';

export interface MusicNote {
  id: string;
  pitch: string;
  duration: NoteDuration;
  beat: number; // 0-indexed, where 1.0 = one whole note measure (4 beats in 4/4)
  dynamic: DynamicMarking;
}

export interface Staff {
  id: string;
  name: string;
  clef: ClefType;
  instrument: InstrumentType;
  notes: MusicNote[];
}

export const PITCHES_TREBLE = [
  'B5', 'A5', 'G5', 'F5', 'E5', 'D5', 'C5',
  'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'
];

export const PITCHES_BASS = [
  'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3',
  'D3', 'C3', 'B2', 'A2', 'G2', 'F2', 'E2'
];

export const DURATION_LABELS: Record<NoteDuration, string> = {
  '1': 'Whole',
  '0.75': 'Dotted Half',
  '0.5': 'Half',
  '0.375': 'Dotted Quarter',
  '0.25': 'Quarter',
  '0.1875': 'Dotted Eighth',
  '0.125': 'Eighth',
  '0.0625': 'Sixteenth'
};

export const DYNAMIC_VALUES: Record<DynamicMarking, number> = {
  'p': 0.15,
  'mf': 0.4,
  'f': 0.8
};

export const NOTE_FREQUENCIES: Record<string, number> = {
  'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77
};

export const KEYS = ['C Major', 'G Major', 'D Major', 'F Major', 'Bb Major', 'A Minor'];
export const TIME_SIGNATURES = ['4/4', '3/4', '2/4', '6/8'];
