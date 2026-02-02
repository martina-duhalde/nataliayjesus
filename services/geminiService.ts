
import { GoogleGenAI } from "@google/genai";

const WEDDING_FACTS = `
Evento: Boda de Natalia & Jesús
Aniversario: Se pusieron de novios el 2 de mayo de 2018.
Civil: Viernes 20 de Febrero, 2026 a las 11:00 am.
Ceremonia y Fiesta: Sábado 21 de Febrero, 2026.
Lugar: Azul, Buenos Aires, Argentina.
Horarios Sábado: Ceremonia en la Catedral 18:00, Recepción/Cóctel en Estancia 20:00, Cena 21:30.
Dress Code: Elegante Sport. Damas: vestido corto, largo, mono corto o mono largo elegante. Caballeros: saco, camisa y pantalón de vestir (corbata opcional).
Regalos: Apoyo al emprendimiento de la pareja (en crecimiento) (Alias: artesanales.antojito).
Alojamiento: Recomendamos Hotel Gran Azul o Posada de la Posta.
Transporte: El lugar cuenta con estacionamiento privado.
Niños: Evento solo para adultos.
`;

export interface AIResponse {
  text: string;
  sources?: { uri: string; title: string }[];
}

export const getAIResponse = async (userPrompt: string, history: {role: string, content: string}[]): Promise<AIResponse> => {
  // Inicialización directa según normativas
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        { role: 'user', parts: [{ text: "Contexto de la boda: " + WEDDING_FACTS }] },
        ...history.map(h => ({ 
          role: h.role === 'user' ? 'user' : 'model', 
          parts: [{ text: h.content }] 
        })),
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      config: {
        systemInstruction: "Eres el Concierge Virtual de la boda de Natalia y Jesús. Tu tono es extremadamente educado, cálido y servicial. Ayuda a los invitados con detalles de la boda. Tienes información sobre el Civil el viernes 20 a las 11am y la ceremonia religiosa el sábado 21 a las 18:00 en la Catedral. El dress code es 'Elegante Sport'. Para las damas, las opciones sugeridas son vestido corto, largo, mono corto o mono largo elegante. Si preguntan por regalos, menciona que el mejor regalo es su presencia, pero que si desean tener un detalle, agradecen el apoyo a su emprendimiento que está en crecimiento a través del alias 'artesanales.antojito'. No menciones ninguna billetera virtual específica, solo el alias. Siempre responde en español.",
        tools: [{ googleSearch: {} }]
      }
    });

    if (!response || !response.candidates || response.candidates.length === 0) {
      throw new Error("No se recibió una respuesta válida de la IA.");
    }

    const candidate = response.candidates[0];
    const sources = candidate.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri) || [];

    return {
      text: response.text || "Lo siento, no pude procesar eso. ¿Podrías preguntar de otra forma?",
      sources
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "El asistente tuvo un pequeño inconveniente. Por favor, intenta de nuevo o consulta la información directamente en la página." };
  }
};
