# The Story of MeteoSran: Reimagining Weather Intelligence with West Africa's First Premium AI Assistant (Accessible Anywhere)

![MeteoSran Official Logo](Meteosran-logo.png)

Here in West Africa, weather is not just a statistic: it is the rhythm of daily life. In cities like Abidjan and Yamoussoukro, a sudden tropical downpour or an intense seasonal heatwave determines whether markets open, crops thrive, or roads remain passable. Yet, traditional weather applications and Weather Agencies offer little more than dry, numerical grids and generic percentages. They lack context, educational warmth, and more than anything human/climate connection.

Enter **MeteoSran**, the first advanced Ivorian Weather AI Assistant. Conceived and developed by Marc Andréas Yao, MeteoSran is a Progressive Web App (PWA), and will become a native app soon, designed to merge advanced meteorological intelligence with premium, Apple-inspired interface aesthetics. Under the guiding philosophy "Ask Anything. Discover Everything humanely," it transforms raw forecast data into rich, personalized narratives for everyone.

Here is the story behind this experience, its high-performance architecture, and the engineering details that make it feel alive.

---

## The Birth of MeteoSran: Beyond the Numerical Grid

![Screenshot of MeteoSran Welcome Screen (Dark mode)](Meteosran-welcome-screen-dark.png)

Traditional weather forecasting tells you what the temperature is, but it rarely explains "why" or "how" it affects you, right? MeteoSran was built to bridge this gap. By utilizing Fine-tuned Google's advanced Gemini AI models and multimodal forecasting, the assistant acts as a hyper friendly, expert climatologist.

Instead of showing a static "32°C and 80% humidity," MeteoSran synthesizes real-time reports from the very accurate Weather provider like AccuWeather and crafts descriptive, natural language summaries. Whether you are a student learning about atmospheric pressure, an educator preparing a classroom lesson, or a commuter planning a route, MeteoSran tailors its explanations to your needs.

---

## Six Tailored Dimensions of Conversation

Every user interacts differently. To accommodate different reading styles and psychological preferences, MeteoSran features six distinct response modes:

![MeteoSran Chat Mode Selection](Meteosran-chat-mode-selection.png)

* **Default**: Deep, comprehensive meteorological explanations.
* **Concise**: Focused, high-impact bullet points for users on the move.
* **Short**: Minimalist summaries for instant updates.
* **Straight**: Direct, no-nonsense answers without conversational fluff.
* **Funny**: Humorous, light-hearted weather commentary with local flavor.
* **Einstein**: In-depth scientific breakdowns detailing atmospheric physics and thermodynamics.

---

## The Tech Stack: Engineering a Premium, Fluid UI

A premium application must look and feel fast, responsive, and tactile. MeteoSran achieves this through a combination of cutting-edge web technologies:

* **Core Structure**: React (v19.1.0) and TypeScript (v5.7.2) compiled via Vite (v6.2.0) to ensure static type-safety and lightning-fast build speeds.
* **Liquid Aura Streaming**: When the AI answers a query, the text does not jump in blocky segments. Instead, it streams using a custom fluid cursor effect that flows across the page with a stable, glowing trailing aura.
* **Apple-Style Chat Redesign**: User messages appear in sleek, dark-slate pill-shaped bubbles right-aligned against the viewport. AI responses sit cleanly and unboxed on a glassmorphic layout, using fluid responsive typography to maximize readability.
* **Animated Glassmorphic Orbs**: The background is an interactive, moving canvas of seven colorful gradient orbs. They merge and animate using an SVG color matrix goo filter, creating a soft, shifting backdrop.

```
MeteoSran PWA Architecture
├── Frontend (React + TypeScript)
│   ├── PWA Shell (Offline Caching)
│   ├── Interactive SVG Orb Canvas
│   └── Visual Viewport Manager
├── AI Service Layer (Multi-Models API Proxy)
│   └── Live WebSocket Audio Engine
└── Weather Service Layer (AccuWeather + Open-Meteo)
```

---

## Gemini 2.5 Live: Low-Latency Bidirectional Audio

One of the most advanced features of MeteoSran is its Live Session mode, allowing users to talk to their weather assistant in real time.

Using the Gemini 2.5 Live WebSocket API, the app establishes a bidirectional connection for raw 16kHz PCM audio streaming. On the frontend, custom AudioWorkletNode scripts manage low-latency voice capture and play back responses. A beautiful, pulsating glassmorphism overlay visualizes the speech waves, letting the user speak and listen naturally.

---

## Dynamic Climatology: 5-Year Climatological Norms

To make the AI truly intelligent, MeteoSran integrates a dynamic climatological analysis service. It queries the Open-Meteo Historical Archive data client-side to compile average temperatures, extreme records, and rain probabilities over the last 5 years for the current month for maximum understanding and accuracy.

When the model receives the real-time AccuWeather report, it also receives this historical context. MeteoSran can then explain: "At 33°C, today's heat in Abidjan is notably higher than the historical March average of 30.5°C over the last five years." This turns a simple forecast into an educational comparative insight.

---

## Contextual Memory and Mobile Viewport Intelligence

In the latest 1.6.6 beta release, MeteoSran introduced two critical UX breakthroughs:

### 1. Long-Term Contextual Memory
MeteoSran features a background summarization service. As you chat, the AI maintains a running summary of your preferences (e.g., your preferred unit systems, travel plans, or weather sensitivities) and updates them in Firestore. When you return to the chat, this memory is injected into the system instructions, giving the assistant instant recall of past conversations.

### 2. Visual Viewport & Keyboard Adaptability
Mobile browser layouts often deform when the virtual keyboard pops up, squeezing text fields and pushing inputs off-screen. MeteoSran uses the browser's Visual Viewport API to recalculate the viewport height dynamically. When typing, non-essential elements like suggestion cards and footers are smoothly hidden, and container paddings are adjusted to sit flush above the virtual keyboard.

---

## The Auto-Translation Resilience Fix

A common bug in mobile browsers (like Chrome or Safari on iOS) is that native page translation tools attempt to translate raw text nodes inside HTML elements. For icon fonts like Google's Material Symbols, which render icons using ligatures (e.g., writing the text close inside a span to render a close cross), this auto-translation breaks the layout. The translation tool converts close to fermer (French) or cerrar (Spanish), resulting in the word "fermer" appearing instead of the icon.

To solve this, MeteoSran systematically isolated every single icon element across the codebase:

```tsx
<span className="material-symbols-outlined notranslate" translate="no">close</span>
```

By applying both the CSS class notranslate and the HTML attribute translate="no", MeteoSran ensures that browser translation engines leave the ligatures intact, preserving the visual integrity of the app for international users.

---

## Offline Capability and PWA Installation

As a Progressive Web App, MeteoSran is built to be independent of app store barriers. It can be installed directly from any mobile or desktop browser. A custom service worker implements a stale-while-revalidate caching strategy, ensuring that core features and previous chat sessions remain accessible even when you lose internet connectivity. The native app version is currently under development.

*(Note: To support advanced real-time voice synthesis and high-accuracy weather data streams, a premium subscription model may be introduced in a forthcoming future version.)*

---

## Conclusion: The Future of Climatology

MeteoSran shows how localized weather data can be transformed into an engaging, beautiful, and educational experience. By blending technical performance, strict accessibility design, and premium animations, Marc Andréas Yao has built more than just a weather tracker: it is a smart, aesthetic companion.

Visit the MeteoSran repository, install the PWA on your home screen, and discover a more human way to understand the elements.

*Developed by Marc Andréas Yao. Connect with the creator on LinkedIn or explore the code on GitHub.*
