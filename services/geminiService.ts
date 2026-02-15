
import { GoogleGenAI, Type } from "@google/genai";
import { MusicNote, PITCHES_TREBLE, PITCHES_BASS } from "../types";

// Initialize the Google GenAI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMelodySuggestion = async (currentNotes: MusicNote[]): Promise<Partial<MusicNote>[]> => {
  const notesStr = currentNotes.map(n => `${n.pitch}(${n.duration})`).join(', ');
  
  // Combine pitches from both clefs to provide a valid list of options for the AI.
  const allPitches = [...new Set([...PITCHES_TREBLE, ...PITCHES_BASS])];
  
  // Request the next notes in the sequence using a structured JSON response.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Suggest the next 4 notes to follow this melody: ${notesStr || 'empty starting melody'}. Use pitches from: ${allPitches.join(', ')}. Durations should be '1', '0.5', '0.25', or '0.125'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            pitch: { type: Type.STRING },
            duration: { type: Type.STRING }
          },
          required: ["pitch", "duration"]
        }
      }
    }
  });

  try {
    // Access the .text property directly to extract the generated string.
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Failed to parse AI suggestion", e);
    return [];
  }
};

export const analyzeSong = async (notes: MusicNote[]): Promise<string> => {
  const notesStr = notes.map(n => `${n.pitch}(${n.duration})`).join(', ');
  
  // Ask the model to provide a brief musical analysis of the input notes.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Briefly describe the mood and musical characteristics of this short melody: ${notesStr}. Keep it under 2 sentences.`,
  });
  
  // Access the .text property for the final analysis output.
  return response.text || "A unique sequence of notes.";
};
