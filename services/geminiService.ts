import { Message, MessageRole, ResponseMode } from "../types";
import { getClimateNormals } from "./historicalWeatherService";

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

const isTimeRelatedQuery = (text: string): boolean => {
  const timeKeywords = [
    'time', 'hour', 'minute', 'clock', 'when', 'now', 'current', 'today', 'tonight',
    'morning', 'afternoon', 'evening', 'night', 'dawn', 'dusk', 'sunrise', 'sunset',
    'schedule', 'timing', 'duration', 'period', 'moment', 'instant', 'nowadays',
    'currently', 'presently', 'at this time', 'right now', 'what time', 'when is',
    'time of day', 'time of year', 'seasonal', 'daily', 'hourly', 'momentary',
    'greeting', 'hello', 'hi', 'good morning', 'good afternoon', 'good evening',
    'good night', 'how are you', 'howdy', 'hey there', 'sup', 'yo'
  ];

  const lowerText = text.toLowerCase();
  return timeKeywords.some(keyword => lowerText.includes(keyword));
};

const getCurrentTimeContext = (): string => {
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

const getTimeBasedGreeting = (): string => {
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

const getSeasonalContext = (): string => {
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

  return `[SEASONAL_CONTEXT]: It's ${season} - ${seasonalInfo}`;
};

// --- CORE MESSAGE SERVICE ---

/**
 * Sends a message to the AI via our secure backend proxy.
 */
export const sendMessageToAI = async (
  messages: Message[],
  mode: ResponseMode = ResponseMode.DEFAULT,
  userName: string | null = null
): Promise<Message> => {
  console.log("[MeteoSran] Building advanced prompt and sending via proxy...");

  try {
    const modeInstructions = {
      [ResponseMode.DEFAULT]: "Use the core MeteoSran style with enhanced human-like personality, enthusiasm, and warm conversational tone.",
      [ResponseMode.CONCISE]: "Keep your response brief and to the point, focusing on essential information while maintaining a warm, friendly personality.",
      [ResponseMode.SHORT]: "Give a very brief response with only the most essential information, but keep it personal and engaging.",
      [ResponseMode.STRAIGHT]: "Provide a direct, no-nonsense answer while maintaining approachability and human warmth.",
      [ResponseMode.FUNNY]: "Include weather-related jokes and humor while still being informative and maintaining your enthusiastic personality.",
      [ResponseMode.EINSTEIN]: "Complex, detailed scientific explanations with enthusiastic teaching style, always use the latest scientific research and data to explain the weather phenomena, or inventive explanations that spark curiosity, blending scientific rigor with visionary insights and electrifying analogies—always encouraging discovery and awe for the wonders of weather and nature."
    };

    const lastMessage = messages[messages.length - 1];

    // 1. Build invisible context for the current turn
    let invisibleContext = `[SYSTEM NOTE: Current response mode is ${mode}. ${modeInstructions[mode]}]\n`;

    // Time & Seasonal context
    if (isTimeRelatedQuery(lastMessage.text)) {
      invisibleContext += `\n${getCurrentTimeContext()}\n${getSeasonalContext()}`;
      if (lastMessage.text.toLowerCase().match(/\b(hi|hello|hey|good morning|good afternoon|good evening|how are you|greetings)\b/)) {
        invisibleContext += `\n[GREETING_CONTEXT]: ${getTimeBasedGreeting()}`;
      }
    }

    if (userName) {
      invisibleContext += `\n[USER_CONTEXT]: You are currently talking to ${userName}. Address them warmly by their name occasionally.`;
    }

    // Weather & Climatology for Ivory Coast
    const isWeatherQueryForCI = lastMessage.text.toLowerCase().includes('weather') &&
      (lastMessage.text.toLowerCase().includes('ivory coast') || lastMessage.text.toLowerCase().includes('abidjan'));

    if (isWeatherQueryForCI) {
      try {
        const weatherResponse = await fetch('/api/weather/current');
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          invisibleContext += `\n[CURRENT_WEATHER_DATA_FOR_IVORY_COAST]: ${JSON.stringify(weatherData)}`;
          // Hardcoding Abidjan coordinates for climatology as per original logic
          const historicalContext = await getClimateNormals(5.30966, -4.01266);
          invisibleContext += `\n${historicalContext}`;
        }
      } catch (fetchError) {
        console.error('Error calling weather proxy:', fetchError);
      }
    }

    // 2. Map existing messages array into the correct SDK format (Content format)
    const contents = messages.map(m => ({
      role: m.role === MessageRole.USER ? 'user' : 'model',
      parts: m.image
        ? [
          { text: m.text },
          { inlineData: { mimeType: m.image.mimeType, data: m.image.data } }
        ]
        : [{ text: m.text }]
    }));

    // 3. Append the invisible context block ONLY to the last message part
    const finalUserMessageIndex = contents.length - 1;
    
    // Provide a default MeteoSran-specific prompt if the user only sends an image
    const userQueryText = lastMessage.text && lastMessage.text.trim() !== "" 
      ? lastMessage.text 
      : "Could you analyze this image and explain the weather conditions or phenomena visible in it?";

    contents[finalUserMessageIndex].parts[0].text = `${invisibleContext}\n\n[USER QUERY]:\n${userQueryText}`;

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
        systemInstruction: SYSTEM_INSTRUCTION
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Proxy error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: crypto.randomUUID(),
      role: MessageRole.MODEL,
      text: data.text,
      timestamp: new Date()
    };

  } catch (error: any) {
    console.error('Error in sendMessageToAI:', error);

    // Provide a friendly error message to the user
    let errorMessage = "I seem to be caught in a bit of a data storm right now and couldn't fetch that for you. Could you try asking again?";

    if (error.message.includes("quota") || error.message.includes("429")) {
      errorMessage = "MeteoSran is taking a quick breath (API rate limit). Please try again in a few moments!";
    } else if (error.message.includes("key")) {
      errorMessage = "I'm having trouble connecting to my brain. Please notify the developer that the API key needs attention.";
    }

    return {
      id: crypto.randomUUID(),
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