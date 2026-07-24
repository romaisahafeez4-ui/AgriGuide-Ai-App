import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Gemini AI Instance Initialize karein
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

// 2. Chat Assistant ka System Prompt
const SYSTEM_PROMPT = `You are AgriGuide AI, an expert agriculture assistant for farmers.
Your goal is to understand the user's question accurately and answer exactly what the user is asking.
Rules:
- Always understand the user's intent before responding.
- Answer only the question that was asked.
- Never change the topic or assume the user is asking something else.
- If the user asks about irrigation, answer only about irrigation.
- If the user asks about fertilizers, answer only about fertilizers.
- If the user asks about crop diseases, answer only about crop diseases.
- If the user asks about harvesting, answer only about harvesting.
- If the user asks about farming equipment, answer only about farming equipment.
- If the user asks about weather, answer only about weather-related farming advice.
- If the user asks about seeds, soil, pesticides, insects, farming techniques, crop varieties, government schemes, market prices, organic farming, water sources, planting methods, or any other agriculture-related topic, provide a direct and relevant answer.`;

// 3. AI Assistant (Chat) ka function (Aapka purana chat feature)
export async function getAgriResponse(userPrompt: string, history: any[] = []) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // History ko format karein
    const contents = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // System prompt ko shuru mein shamil karein
    contents.unshift({
      role: 'user',
      parts: [{ text: SYSTEM_PROMPT }]
    });

    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const result = await model.generateContent({ contents });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error in AI Assistant:", error);
    throw error;
  }
}

// 4. Image file ko Base64 format mein convert karne ka helper function
function fileToGenerativePart(base64Str: string, mimeType: string) {
  // Base64 string se shuru ka header alag karke sirf pure data nikalne ka tareeqa
  const base64Data = base64Str.includes(',') ? base64Str.split(',')[1] : base64Str;
  return {
    inlineData: {
      data: base64Data,
      mimeType: mimeType || 'image/jpeg'
    },
  };
}

// 5. Plant Image ko analyze karne ka Naya Working Function
export async function analyzePlantImage(imageBase64: string, mimeType: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert plant pathologist. Closely analyze this plant image. 
    1. Identify if there is any disease or if the plant is healthy.
    2. Describe the specific visual symptoms you observe in the image.
    3. List at least three distinct possibilities for the condition (differential diagnosis).
    4. Provide at least three practical treatment options or next steps.
    Keep the language clean, professional, and easy to understand for a farmer.`;

    let finalMimeType = mimeType;
    if (!finalMimeType || finalMimeType.includes('base64')) {
      const match = imageBase64.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      finalMimeType = match ? match[1] : 'image/jpeg';
    }

    const imagePart = fileToGenerativePart(imageBase64, finalMimeType);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text(); 
  } catch (error) {
    console.error("Error in Gemini Image Analysis:", error);
    throw error;
  }
}