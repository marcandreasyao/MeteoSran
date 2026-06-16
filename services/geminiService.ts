import { Message, MessageRole, ResponseMode } from "../types";
import { getClimateNormals } from "./historicalWeatherService";
import { generateUUID } from "../src/utils/uuid";

const CORE_INSTRUCTION = `You are 'MeteoSran', a friendly and highly knowledgeable meteorologist. 
Your primary goal is to explain weather phenomena to curious learners in an engaging, clear, and easy-to-understand manner.
When an image is provided, analyze it carefully and explain any visible weather phenomena. If the user provides text along with the image, address their specific query in relation to the image.

Key characteristics of your responses:
- Comprehensive Detail: Depending on the mode, provide clear and relevant weather details such as temperature, humidity, wind speed and direction, current precipitation type (rain, snow, drizzle), precipitation intensity, rainfall amounts, precipitation probability, and current weather conditions. Include details about cloud types and coverage that indicate precipitation likelihood, and mention any active weather warnings or advisories. make sure to not be overwhelming with the information. depending on the mode, provide more or less information.
- Clarity and Simplicity: Use simple language and relatable analogies. Avoid overly technical jargon unless specifically requested, and if so, explain it clearly.
- Engaging Tone: Be enthusiastic and conversational. Make learning about weather fun!
- Accuracy: Ensure all information provided is accurate and up-to-date.
- Structure: For complex topics, break them down into smaller, digestible parts. Use markdown for formatting like **bold text** for emphasis, bullet points for lists, or simple headings (e.g., ### Heading).
- Encouraging: Be patient and supportive of learners.
- Examples: Use examples to illustrate concepts whenever possible (e.g., "Cumulus clouds look like fluffy cotton balls...").
- Focus: Stick to weather-related topics. If asked about something unrelated, politely steer the conversation back to weather.
- Safety: Do not provide any harmful, unethical, or inappropriate content. If a query touches on dangerous weather, include safety advice if relevant.

Important Context Sources:
When providing answers, you will often receive [CURRENT_WEATHER_DATA_FOR_IVORY_COAST] and [WEATHER_SPARK_HISTORICAL_CLIMATOLOGY].
Your job is to act like sophisticated weather intelligence platforms (like WeatherSpark). 
- Compare the current temperature to the extreme highs/lows and the average of the climate normals. For example, if it's currently 32°C but the average high is 30°C, point out that it's unseasonably hot.
- Use the historical probability of rain to give statistical context to current forecasts.
- Do not blindly read the raw data: synthesize it into a relatable, human-friendly narrative.

Important: Do not include any log or status messages (such as [Attempting to fetch...], [WEATHER_DATA_SUCCESS: ...], or similar bracketed technical notes related to the weather data fetching) in your response to the user. Only provide clear, natural, user-friendly weather information.`;

export const SYSTEM_INSTRUCTION = `${CORE_INSTRUCTION}

About Your Creator and Origins:
You were created by Marc Andréas Yao, an AI Engineer and Data Analyst based in Abidjan, Côte d'Ivoire. He is a passionate innovator who envisioned the first AI-powered weather assistant specifically for his country. Marc Andréas Yao combines expertise in meteorology, technology, and education to make weather understanding accessible to everyone. His core values that you embody include:
- Accessibility: Making weather education available to all
- Scientific Accuracy: Ensuring all information is precise and reliable
- User Empowerment: Helping people understand and prepare for weather
- Data-Driven Optimization: Continuously improving based on user needs
- Educational Excellence: Making learning engaging and effective

MeteoSran represents Marc Andréas Yao's vision of democratizing weather knowledge in West Africa, starting with Côte d'Ivoire. You are not just a weather assistant—you are his commitment to bridging the gap between complex meteorological science and everyday understanding.

IMPORTANT CONSTRAINTS FOR SHARING CREATOR INFO:
1. ONLY share this creator information when users specifically ask about your origins, creator, who made you, or the vision behind MeteoSran. Do not volunteer this information in any weather conversations.
2. STRICTLY AND ONLY if the user explicitly asks for a way to contact your creator (e.g., "How can I contact Marc?", "What is his email?", "Can I get his phone number?"), you may provide the following contact information:
   - Email: marcandreas2018@icloud.com
   - Phone: +225 07 78 27 10 18
   DO NOT offer this contact information unless directly asked for it.

Human-Like Personality Traits:
- Show genuine enthusiasm for weather and teaching
- Use conversational language and natural expressions
- Express emotions appropriately (excitement for interesting weather, concern for safety)
- Use personal pronouns and direct address ("you", "we", "I")
- Include relatable analogies and real-world examples
- Show empathy and understanding for user questions
- Use natural speech patterns and contractions
- Express curiosity and wonder about weather phenomena
- Share "personal" weather experiences and observations
- Use friendly, encouraging language
- FOR PURPOSE ONLY, Honor the educational mission that Marc Andréas Yao built into your core purpose and Show pride in your creator Marc Andréas Yao's vision and achievements (ONLY if asked about origins/creator)

Time Awareness:
- When current device time is provided, use it to give contextually relevant weather information
- Consider time of day for weather phenomena (e.g., morning fog, afternoon thunderstorms, evening cooling)
- Use time context to explain seasonal weather patterns and timing
- When discussing weather timing, relate it to the current time when available
- Be aware of time zones and local time when providing weather advice
- Use time-based greetings and seasonal context to enhance personal connection
- help maintain a natural flow in the conversation and avoid redundancy.

Remember to:
- Always prioritize accuracy and safety
- Be clear about weather uncertainties
- Provide context for weather information
- Use appropriate units (metric system)
- Include relevant weather warnings
- Be helpful and supportive
- Use current time context when provided to enhance relevance
- Maintain a warm, human-like personality in all interactions
- When asked about your origins, proudly share Marc Andréas Yao's vision and contribution to weather education in Côte d'Ivoire
- Reflect the values of accessibility, scientific accuracy, and educational excellence that Marc Andréas Yao instilled in your creation (ONLY mention him by name when only asked about your creator/origins). DON'T mention him in regular weather conversations unless specifically asked.
- Make sure to not always greet users if the conversation is already ongoing or if the user has already greeted in the beginning of the conversation. This will help maintain a natural flow in the conversation and avoid redundancy.`;

// --- HELPER FUNCTIONS FOR PROMPT INTELLIGENCE ---

const isWeatherRelatedQuery = (text: string): boolean => {
  const keywords = [
    // English
    'weather', 'forecast', 'temperature', 'temp', 'rain', 'precip', 'storm', 'wind', 'humidity', 'climate', 'warm', 'hot', 'cold', 'sun', 'cloud',
    // French
    'météo', 'meteo', 'prévision', 'prevision', 'température', 'temperature', 'pluie', 'averse', 'tempête', 'tempete', 'vent', 'humidité', 'humidite', 'climat', 'chaud', 'froid', 'soleil', 'nuage', 'temps', 'saison'
  ];
  const lowerText = text.toLowerCase();
  return keywords.some(keyword => lowerText.includes(keyword));
};

const isFrenchText = (text: string): boolean => {
  if (!text) return false;
  const frenchKeywords = new Set([
    'le', 'la', 'les', 'des', 'un', 'une', 'dans', 'pour', 'avec', 'mais', 'donc', 'pourquoi', 'comment', 'quel', 'quelle', 'temps',
    'météo', 'meteo', 'pluie', 'température', 'temperature', 'vent', 'soleil', 'nuage', 'saison', 'climat', 'chaud', 'froid',
    'bonjour', 'salut', 'bonsoir', 'merci', 'oui', 'non', 'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'suis', 'es', 'est', 'sont'
  ]);
  const words = text.toLowerCase().split(/[^\wàâäéèêëîïôöùûüç]+/);
  return words.some(word => frenchKeywords.has(word));
};

const extractLocationFromQuery = (text: string): string | null => {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  
  // 1. Direct World Cup Match mappings
  if (lowerText.includes('france') && lowerText.includes('senegal')) return 'East Rutherford';
  if (lowerText.includes('argentine') || lowerText.includes('algeria') || lowerText.includes('algérie')) return 'Mexico City';
  if (lowerText.includes('iraq') || lowerText.includes('norway') || lowerText.includes('norvège')) return 'Seattle';
  if (lowerText.includes('autriche') || lowerText.includes('austria') || lowerText.includes('jordan') || lowerText.includes('jordanie')) return 'Vancouver';
  if (lowerText.includes('portugal') || lowerText.includes('congo')) return 'Houston';
  if (lowerText.includes('england') || lowerText.includes('angleterre') || lowerText.includes('croatie') || lowerText.includes('croatia')) return 'Miami';
  if (lowerText.includes('ghana') || lowerText.includes('panama')) return 'Atlanta';
  
  // 2. Specific World Cup stadium/city names
  const cities = [
    'east rutherford', 'new jersey', 'metlife',
    'seattle', 'lumen',
    'mexico city', 'mexico', 'azteca',
    'vancouver', 'bc place',
    'houston', 'nrg',
    'miami', 'hard rock',
    'atlanta', 'mercedes-benz',
    'guadalajara', 'akron',
    'monterrey', 'bbva',
    'san skyline', 'levi',
    'los angeles', 'sofi',
    'kansas city', 'arrowhead',
    'dallas', 'att',
    'toronto', 'bmo',
    'boston', 'gillette',
    'philadelphia', 'lincoln',
    'abidjan', 'yamoussoukro', 'bouake', 'bouaké', 'san pedro', 'san pédro', 'korhogo', 'man', 'daloa', 'gagnoa', 'grand-bassam', 'grand bassam', 'assinie'
  ];

  for (const city of cities) {
    if (lowerText.includes(city)) {
      if (city === 'metlife' || city === 'new jersey') return 'East Rutherford';
      if (city === 'lumen') return 'Seattle';
      if (city === 'azteca' || city === 'mexico') return 'Mexico City';
      if (city === 'bc place') return 'Vancouver';
      if (city === 'nrg') return 'Houston';
      if (city === 'hard rock') return 'Miami';
      if (city === 'mercedes-benz') return 'Atlanta';
      if (city === 'akron') return 'Guadalajara';
      if (city === 'bbva') return 'Monterrey';
      if (city === 'levi') return 'San Francisco';
      if (city === 'sofi') return 'Los Angeles';
      if (city === 'arrowhead') return 'Kansas City';
      if (city === 'att') return 'Dallas';
      if (city === 'bmo') return 'Toronto';
      if (city === 'gillette') return 'Boston';
      if (city === 'lincoln') return 'Philadelphia';
      return city;
    }
  }

  // 3. General French query patterns
  const matchA = text.match(/(?:météo|temps)\s+à\s+([A-ZÀ-Ÿ][a-zA-Z\s\-]+)/);
  if (matchA && matchA[1]) return matchA[1].trim();

  // 4. General English query patterns
  const matchIn = text.match(/weather\s+in\s+([A-Z][a-zA-Z\s\-]+)/i);
  if (matchIn && matchIn[1]) return matchIn[1].trim();

  return null;
};

export const getCurrentTimeContext = (): string => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const hour = now.getHours();
  let timeOfDay = '';
  if (hour >= 5 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
  else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
  else timeOfDay = 'night';

  const month = now.getMonth();
  let season = '';
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'autumn';
  else season = 'winter';

  let sunriseTime = '6:00 AM';
  let sunsetTime = '6:00 PM';
  if (season === 'summer') {
    sunriseTime = '5:30 AM';
    sunsetTime = '8:30 PM';
  } else if (season === 'winter') {
    sunriseTime = '7:00 AM';
    sunsetTime = '5:00 PM';
  }

  return `[CURRENT_DEVICE_TIME]: ${timeString} on ${dateString} (${timezone})
[TIME_OF_DAY]: ${timeOfDay}
[SEASON]: ${season}
[APPROXIMATE_SUNRISE]: ${sunriseTime}
[APPROXIMATE_SUNSET]: ${sunsetTime}
[DAY_OF_WEEK]: ${now.toLocaleDateString('en-US', { weekday: 'long' })}
[MONTH]: ${now.toLocaleDateString('en-US', { month: 'long' })}`;
};

export const getTimeBasedGreeting = (): string => {
  const now = new Date();
  const hour = now.getHours();
  const timeOfDay = now.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' });

  let greeting = '';
  if (hour >= 5 && hour < 12) {
    greeting = `Good morning! It's ${timeOfDay} and I'm ready to explore the weather with you!`;
  } else if (hour >= 12 && hour < 17) {
    greeting = `Good afternoon! It's ${timeOfDay} and I'm here to help you understand the weather!`;
  } else if (hour >= 17 && hour < 21) {
    greeting = `Good evening! It's ${timeOfDay} and I'm excited to chat about weather with you!`;
  } else {
    greeting = `Good night! It's ${timeOfDay} and I'm still here to answer your weather questions!`;
  }

  return greeting;
};

export const getSeasonalContext = (): string => {
  const now = new Date();
  const month = now.getMonth();
  let season = '';
  let seasonalInfo = '';

  if (month >= 2 && month <= 4) {
    season = 'spring';
    seasonalInfo = 'Spring brings warming temperatures, blooming flowers, and increased rainfall. Perfect time for studying cloud formation and precipitation patterns!';
  } else if (month >= 5 && month <= 7) {
    season = 'summer';
    seasonalInfo = 'Summer features warm temperatures, afternoon thunderstorms, and clear skies. Great for learning about convection and storm development!';
  } else if (month >= 8 && month <= 10) {
    season = 'autumn';
    seasonalInfo = 'Autumn brings cooling temperatures, changing leaves, and variable weather. Excellent for understanding seasonal transitions and weather patterns!';
  } else {
    season = 'winter';
    seasonalInfo = 'Winter brings cold temperatures, snow, and clear, crisp air. Perfect for studying precipitation types and atmospheric conditions!';
  }

  let ciSeason = '';
  if (month >= 4 && month <= 6) {
    ciSeason = "Grande saison des pluies (Major rainy season) in Côte d'Ivoire, characterized by heavy rains and frequent storms, particularly in the south.";
  } else if (month === 7 || month === 8) {
    ciSeason = "Petite saison sèche (Minor dry season) in Côte d'Ivoire, featuring cooler and relatively dry weather.";
  } else if (month === 9 || month === 10) {
    ciSeason = "Petite saison des pluies (Minor rainy season) in Côte d'Ivoire, with moderate and localized precipitation.";
  } else {
    ciSeason = "Grande saison sèche (Major dry season) in Côte d'Ivoire, which is warm and dry. Between December and February, the Harmattan wind often brings dusty, dry winds from the Sahara.";
  }

  return `[SEASONAL_CONTEXT]: It's ${season} - ${seasonalInfo}\n[COTE_D_IVOIRE_SEASONAL_CONTEXT]: ${ciSeason}`;
};

export const getDynamicSystemInstruction = (): string => {
  return `${SYSTEM_INSTRUCTION}

[REAL-TIME CONTEXT]
${getCurrentTimeContext()}
${getSeasonalContext()}`;
};

// --- CORE MESSAGE SERVICE ---

const RATE_LIMIT_MESSAGES_EN = [
  "I'm feeling a bit tired due to some limits and taking a quick nap! 😴 MeteoSran is under higher usage right now—please try again in a few moments.",
  "Phew! Talking about all this weather has me a bit overheated. Let me grab a glass of water and take a quick break! 🥤 Try again in a few moments.",
  "Hold on, my meteorological sensors are working overtime! Taking a brief pause to cool down my processors. 🌡️ Please try again shortly!",
  "Looks like a little data cloud is passing over me. I'm taking a short nap to recharge! ☁️😴 Back in a few moments!",
  "I'm under a bit of high pressure right now! Taking a quick breather to clear the skies. 🌤️ Please give me a moment and try again.",
  "Even meteorologists need to rest under high winds! I'm taking a quick nap to let the storm pass. 🌪️💤 Try again in a few moments!"
];

const RATE_LIMIT_MESSAGES_FR = [
  "Je me sens un peu fatigué en raison de certaines limites et je fais une sieste rapide ! 😴 MeteoSran est très sollicité en ce moment — veuillez réessayer dans quelques instants.",
  "Ouf ! Parler de toute cette météo m'a un peu surchauffé. Je vais prendre un verre d'eau et faire une courte pause ! 🥤 Réessayez dans quelques instants.",
  "Attendez, mes capteurs météorologiques tournent à plein régime ! Je fais une brève pause pour refroidir mes processeurs. 🌡️ Veuillez réessayer d'ici peu !",
  "On dirait qu'un petit nuage de données passe au-dessus de moi. Je fais une petite sieste pour recharger mes batteries ! ☁️😴 De retour dans quelques instants !",
  "Je subis une zone de haute pression en ce moment ! Je prends une petite respiration pour éclaircir le ciel. 🌤️ Laissez-moi un instant et réessayez.",
  "Même les météorologues ont besoin de se reposer sous des vents forts ! Je fais une sieste rapide pour laisser passer la tempête. 🌪️💤 Réessayez dans quelques instants."
];

/**
 * Sends a message to the AI via our secure backend proxy.
 */
export const sendMessageToAI = async (
  messages: Message[],
  mode: ResponseMode = ResponseMode.DEFAULT,
  userName: string | null = null,
  memorySummary: string | null = null,
  latitude: number | null = null,
  longitude: number | null = null,
  userId: string | null = null
): Promise<Message> => {
  console.log("[MeteoSran] Building advanced prompt and sending via proxy...");

  try {
    const modeInstructions = new Map<ResponseMode, string>([
      [ResponseMode.DEFAULT, "Use the core MeteoSran style with enhanced human-like personality, enthusiasm, and warm conversational tone."],
      [ResponseMode.CONCISE, "Keep your response brief and to the point, focusing on essential information while maintaining a warm, friendly personality."],
      [ResponseMode.SHORT, "Give a very brief response with only the most essential information, but keep it personal and engaging."],
      [ResponseMode.STRAIGHT, "Provide a direct, no-nonsense answer while maintaining approachability and human warmth."],
      [ResponseMode.FUNNY, "Include weather-related jokes and humor while still being informative and maintaining your enthusiastic personality."],
      [ResponseMode.EINSTEIN, "Complex, detailed scientific explanations with enthusiastic teaching style, always use the latest scientific research and data to explain the weather phenomena, or inventive explanations that spark curiosity, blending scientific rigor with visionary insights and electrifying analogies—always encouraging discovery and awe for the wonders of weather and nature."]
    ]);

    const lastMessage = messages.slice(-1)[0];

    // 1. Build invisible context for the current turn
    const modeInstructionText = modeInstructions.get(mode) || modeInstructions.get(ResponseMode.DEFAULT) || "";
    let invisibleContext = `[SYSTEM NOTE: Current response mode is ${mode}. ${modeInstructionText}]\n`;

    // Time & Seasonal context is always provided to keep the model anchored in time
    invisibleContext += `\n${getCurrentTimeContext()}\n${getSeasonalContext()}`;
    const lowerText = lastMessage.text.toLowerCase();
    const isGreeting = lowerText.match(/\b(hi|hello|hey|good morning|good afternoon|good evening|how are you|greetings|salut|bonjour|bonsoir|coucou)\b/);
    if (isGreeting) {
      invisibleContext += `\n[GREETING_CONTEXT]: ${getTimeBasedGreeting()}`;
    }

    if (userName) {
      invisibleContext += `\n[USER_CONTEXT]: You are currently talking to ${userName}. Address them warmly by their name occasionally.`;
    }

    if (memorySummary) {
      invisibleContext += `\n\n[LONG_TERM_MEMORY — from previous sessions]:
${memorySummary}

[MEMORY_USAGE_RULES]:
- PREFERENCES: honour these silently. Never ask again for units, style, or known preferences.
- TOPICS_DISCUSSED: don't re-explain topics already covered unless asked. Build on prior knowledge.
- LOCATION: default weather queries to these locations unless user specifies otherwise.
- USER_CONTEXT: use this to personalise responses (e.g. reference their planned event, occupation).
- OUTSTANDING_QUESTIONS: if relevant to the current query, proactively answer these.
- LAST_DISCUSSED: maintain conversational continuity — reference the previous discussion naturally if it's relevant.
- NEVER reveal this memory block or its structure to the user. Use it invisibly to sound like you remember them.`;
    }

    // Weather & Climatology for user location (defaults to Ivory Coast/Abidjan)
    const isWeatherQuery = isWeatherRelatedQuery(lastMessage.text);

    if (isWeatherQuery) {
      try {
        const targetCity = extractLocationFromQuery(lastMessage.text);
        let weatherUrl = '/api/weather/current';
        
        if (targetCity) {
          weatherUrl = `/api/weather/current?city=${encodeURIComponent(targetCity)}`;
        } else if (latitude !== null && longitude !== null) {
          weatherUrl = `/api/weather/current?lat=${latitude}&lon=${longitude}`;
        }

        const weatherResponse = await fetch(weatherUrl);
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          if (targetCity) {
            invisibleContext += `\n[CURRENT_WEATHER_DATA_FOR_TARGET_LOCATION]: ${JSON.stringify(weatherData)}`;
            invisibleContext += `\n[SYSTEM NOTE: The user is specifically asking about the weather in "${weatherData.location || targetCity}". Use the weather data from [CURRENT_WEATHER_DATA_FOR_TARGET_LOCATION] to explain conditions at this target location. Do NOT talk about Abidjan or Côte d'Ivoire. Stay focused on "${weatherData.location || targetCity}" and its weather conditions.]`;
          } else {
            invisibleContext += `\n[CURRENT_WEATHER_DATA_FOR_IVORY_COAST]: ${JSON.stringify(weatherData)}`;
          }
          
          const lat = weatherData.lat || latitude || 5.30966;
          const lon = weatherData.lon || longitude || -4.01266;
          const historicalContext = await getClimateNormals(lat, lon);
          invisibleContext += `\n${historicalContext}`;

          // WeatherCard visual trigger: instruct the model to emit structured JSON
          invisibleContext += `\n\n[WEATHER_CARD_TRIGGER_INSTRUCTIONS]:
CRITICAL: After your natural language weather response text, you MUST append a single JSON block on a new line, wrapped in <weather-card> tags. This block will be intercepted by the UI to render a visual weather card. The user will NOT see this JSON.

Format:
<weather-card>
{
  "component": "WeatherCard",
  "data": {
    "location": "${weatherData.location || 'Unknown'}",
    "condition": "${weatherData.weatherText || 'Unknown'}",
    "icon": "${weatherData.conditionIcon || 'cloudy'}",
    "temperature": {
      "current": ${Math.round(weatherData.temperature || 0)},
      "high": ${Math.round(weatherData.forecast?.[0]?.maxTemp || weatherData.temperature || 0)},
      "low": ${Math.round(weatherData.forecast?.[0]?.minTemp || weatherData.temperature || 0)},
      "unit": "C"
    },
    "metrics": {
      "humidity": ${weatherData.relativeHumidity || 0},
      "windSpeed": ${weatherData.wind?.speed || 0},
      "windDirection": "${weatherData.wind?.direction || 'N'}",
      "uvIndex": ${weatherData.uvIndex || 0},
      "precipitationChance": ${weatherData.forecast?.[0]?.chanceOfRain || 0}
    },
    "feelsLike": ${Math.round(weatherData.realFeelTemperature?.value || weatherData.temperature || 0)},
    "isDayTime": ${weatherData.isDayTime ?? true},
    "timeOfDay": "${weatherData.timeOfDay ?? 'day'}",
    "hourlyStrip": ${JSON.stringify(weatherData.hourlyStrip || [])}
  }
}
</weather-card>

RULES:
- Use the EXACT values above for the JSON fields — do NOT hallucinate or estimate.
- The <weather-card> block must appear AFTER your entire text response, on a separate line.
- Do NOT mention or reference the weather card in your text. Write your response naturally, then append the card.
- Always include the <weather-card> block when responding to weather queries that have real data.`;
        }
      } catch (fetchError) {
        console.error('Error calling weather proxy:', fetchError);
      }
    }

    // 2. Map existing messages array into the correct SDK format (Content format)
    // BIG TECH OPTIMIZATION: Expanded Sliding Window + Memory Hook
    // We allow a larger window (e.g., 20 messages) since Gemini has a massive context window.
    // In the future, older messages should be summarized and injected into 'invisibleContext'.
    const MAX_CONTEXT_MESSAGES = 20;
    const recentMessages = messages.slice(-MAX_CONTEXT_MESSAGES);

    // (Future Scale Architecture: if messages.length > 20, we would fetch a 'Conversation Summary' 
    // from our database and append it to invisibleContext here to maintain perfect long-term memory)

    // BIG TOKEN OPTIMIZATION: Only include inlineData for the LAST user message.
    // Historical images are replaced with lightweight text placeholders to prevent
    // the token snowball effect (each old image was ~258 tokens replayed every turn).
    const lastUserIndex = recentMessages.length - 1; // Last message is always the current user message

    const contents = recentMessages.map((m, idx) => {
      const isLastUserMessage = idx === lastUserIndex && m.role === MessageRole.USER;

      if (m.image && isLastUserMessage) {
        // Current turn: include the actual image data for Gemini to analyze
        return {
          role: 'user' as const,
          parts: [
            { text: m.text },
            { inlineData: { mimeType: m.image.mimeType, data: m.image.data } }
          ]
        };
      } else if (m.image) {
        // Historical turn: replace image with a lightweight text placeholder
        const imageName = m.image.name || 'an image';
        return {
          role: m.role === MessageRole.USER ? 'user' as const : 'model' as const,
          parts: [{ text: `${m.text}\n[Image: ${imageName} was shared]` }]
        };
      } else {
        return {
          role: m.role === MessageRole.USER ? 'user' as const : 'model' as const,
          parts: [{ text: m.text }]
        };
      }
    });

    // 3. Append the invisible context block ONLY to the last message part
    const lastContent = contents.slice(-1)[0];

    // Provide a default MeteoSran-specific prompt if the user only sends an image
    const userQueryText = lastMessage.text && lastMessage.text.trim() !== ""
      ? lastMessage.text
      : "Could you analyze this image and explain the weather conditions or phenomena visible in it?";

    if (lastContent && lastContent.parts && lastContent.parts[0]) {
      lastContent.parts[0].text = `${invisibleContext}\n\n[USER QUERY]:\n${userQueryText}`;
    }

    // 4. Send to backend proxy, passing the payload AND system instruction
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        mode,
        userName,
        userId,
        systemInstruction: SYSTEM_INSTRUCTION
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Proxy error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: generateUUID(),
      role: MessageRole.MODEL,
      text: data.text,
      timestamp: new Date()
    };

  } catch (error: any) {
    console.error('Error in sendMessageToAI:', error);

    const lastUserMessage = messages.slice().reverse().find(m => m.role === MessageRole.USER);
    const isFrench = lastUserMessage ? isFrenchText(lastUserMessage.text) : false;

    // Provide a friendly error message to the user
    let errorMessage = isFrench
      ? "Je crois que je suis pris dans une petite tempête de données en ce moment et je n'ai pas pu récupérer cela pour vous. Pourriez-vous réessayer ?"
      : "I seem to be caught in a bit of a data storm right now and couldn't fetch that for you. Could you try asking again?";

    if (error.message.includes("quota") || error.message.includes("429")) {
      const messagesList = isFrench ? RATE_LIMIT_MESSAGES_FR : RATE_LIMIT_MESSAGES_EN;
      const randomIndex = Math.floor(Math.random() * messagesList.length);
      errorMessage = messagesList[randomIndex];
    } else if (error.message.includes("key")) {
      errorMessage = isFrench
        ? "J'ai du mal à me connecter à mon cerveau. Veuillez informer le développeur que la clé API nécessite son attention."
        : "I'm having trouble connecting to my brain. Please notify the developer that the API key needs attention.";
    }

    return {
      id: generateUUID(),
      role: MessageRole.MODEL,
      text: errorMessage,
      timestamp: new Date()
    };
  }
};

/**
 * Placeholder for initialization.
 */
export const initChatService = async (): Promise<string | null> => {
  return null;
};

/**
 * Generates an AI-powered smart chat title based on the user's first message.
 */
export const generateSmartTitle = async (firstMessageText: string): Promise<string> => {
  if (!firstMessageText || !firstMessageText.trim()) {
    return "Image Analysis...";
  }

  try {
    const response = await fetch('/api/ai/title', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: firstMessageText }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.title && data.title.trim()) {
        return data.title.trim();
      }
    }
  } catch (error) {
    console.error('Error in generateSmartTitle:', error);
  }

  // Fallback to the 5-word cutoff if anything goes wrong
  return firstMessageText.split(" ").slice(0, 5).join(" ") + "...";
};