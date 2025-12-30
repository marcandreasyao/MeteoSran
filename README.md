# MeteoSran - Ivorian Weather AI Assistant PWA

*MeteoSran: Your First advanced Ivorian Weather AI Assistant. Ask Anything. Discover Everything humanely.*

![MeteoSran Logo](Meteosran-logo.png)

## Overview

MeteoSran is a Progressive Web App (PWA) that merges modern AI with meteorological expertise to deliver engaging, accurate, and educational weather insights. Built with React and TypeScript, it works seamlessly across devices and can be installed for a native-like experience.

## 🌟 Features

- **AI-Powered Weather Analysis**: Real-time weather explanations using advanced AI models
- **Progressive Web App**: Installable on any device, works offline
- **Multi-Modal Input**: Support for text and image-based weather queries
- **Six Response Modes**: Default, Concise, Short, Straight, Funny, Scientific
- **Real-Time Weather Data**: Live weather information for Ivory Coast
- **PDF Export**: Export conversations as professional PDF reports
- **Dark/Light Theme**: Apple-inspired UI with theme switching
- **Accessibility**: WCAG 2.1 compliant interface design
- **Offline Support**: Core features available without internet connection
- **Analytics & Insights**: Privacy-focused usage analytics and performance monitoring

## 🚀 PWA Installation

### Desktop (Chrome, Edge, Firefox)
1. Visit the MeteoSran website
2. Look for the install icon in the address bar
3. Click "Install MeteoSran" when prompted
4. The app will be added to your desktop and start menu

### Mobile (Android/iOS)
1. Open MeteoSran in your mobile browser
2. For Android: Tap "Add to Home Screen" from the browser menu
3. For iOS: Tap the share button and select "Add to Home Screen"
4. The app icon will appear on your home screen

### Manual Installation
If you don't see the install prompt:
1. Look for the install banner at the bottom of the page
2. Click "Install" to add MeteoSran to your device
3. The app will work like any native weather app

## 🛠️ Development Setup

**Prerequisites:** Node.js 18+ and npm

### 1. Clone and Install
```bash
git clone https://github.com/marcandreasyao/MeteoSran.git
cd MeteoSran
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory:
```bash
AI_API_KEY=your_ai_api_key_here
ACCUWEATHER_API_KEY=your_accuweather_api_key_here
```

### 3. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
npm run preview
```

## 📱 PWA Development Features

### Service Worker
- **Caching Strategy**: Network-first for APIs, cache-first for static assets
- **Offline Support**: Basic functionality available without internet
- **Background Sync**: Handles offline message queuing
- **Push Notifications**: Weather alerts (planned feature)

### Manifest Features
- **App Shortcuts**: Quick access to weather queries and image analysis
- **Display Modes**: Standalone, fullscreen, minimal-ui support
- **Theme Integration**: Matches system theme preferences
- **Icon Maskable**: Adaptive icons for different platforms

### Performance Optimizations
- **Code Splitting**: Lazy loading for optimal performance
- **Bundle Analysis**: Optimized chunk sizes
- **Image Optimization**: Compressed assets and WebP support
- **Caching**: Smart caching strategies for fast loading

## 🎯 Usage

### Basic Weather Queries
- Ask natural language questions about weather
- Upload images of weather phenomena for analysis
- Get real-time weather data for Ivory Coast locations

### Response Modes
- **Default**: Comprehensive meteorological explanations
- **Concise**: Brief, focused responses
- **Short**: Minimal information
- **Straight**: Direct, no-nonsense answers
- **Funny**: Humorous weather explanations
- **Einstein**: Detailed scientific analysis

### PWA Features
- **Offline Mode**: Basic functionality when disconnected
- **App Shortcuts**: Quick access from home screen
- **Background Updates**: Automatic content refresh
- **Native Feel**: OS-integrated experience

## 🏗️ Architecture

```
MeteoSran PWA
├── Frontend (React + TypeScript)
│   ├── PWA Shell
│   ├── Service Worker
│   └── Offline Fallbacks
├── AI Service
│   ├── Natural Language Processing
│   ├── Image Analysis
│   └── Context Management
├── Weather Service (AccuWeather)
│   ├── Real-time Data
│   ├── Location Services
│   └── Forecast Integration
└── Export Services (PDF)
    ├── Conversation Export
    └── Educational Materials
```

## Analytics & Performance

MeteoSran includes privacy-focused analytics to improve user experience and monitor application performance.

### Analytics Features
- **User Behavior Tracking**: Theme preferences, feature usage, interaction patterns
- **Performance Monitoring**: Core Web Vitals, loading times, error rates
- **Privacy-First**: No personal data collection, GDPR compliant
- **Real-time Insights**: Live performance and usage metrics

### Tracked Events
- Theme toggle usage
- Message interactions (with image/text)
- Sample question clicks
- Response mode preferences
- Weather widget displays

For detailed analytics information, see [ANALYTICS.md](ANALYTICS.md).

## Configuration

### PWA Manifest
The app includes a comprehensive web app manifest with:
- Multiple icon sizes (48px to 512px)
- App shortcuts for quick actions
- Display mode preferences
- Theme color integration
- Protocol handlers

### Service Worker
Implements advanced caching strategies:
- **Static Assets**: Cached on install
- **API Responses**: Network-first with fallback
- **Dynamic Content**: Stale-while-revalidate
- **Offline Pages**: Custom offline experience

## 📊 Browser Support

| Browser | Install Support | Offline Support | Notifications |
|---------|----------------|-----------------|---------------|
| Chrome | ✅ Full | ✅ Full | ✅ Planned |
| Edge | ✅ Full | ✅ Full | ✅ Planned |
| Firefox | ⚠️ Limited | ✅ Full | ❌ No |
| Safari | ⚠️ Limited | ✅ Full | ❌ No |
| Mobile Chrome | ✅ Full | ✅ Full | ✅ Planned |
| Mobile Safari | ⚠️ Add to Home | ✅ Full | ❌ No |

## 🚀 Deployment

### Build Process
```bash
npm run build
```

### Deployment Checklist
- [ ] HTTPS enabled (required for PWA)
- [ ] Service worker served from root
- [ ] Manifest linked in HTML
- [ ] Icons optimized and compressed
- [ ] Offline page accessible
- [ ] Cache headers configured

### Hosting Recommendations
- **Vercel**: Automatic PWA optimization
- **Netlify**: Built-in service worker support
- **Firebase Hosting**: Google integration benefits
- **GitHub Pages**: Free hosting option

## 📈 Performance

### Lighthouse Scores (Target)
- **Performance**: 90+
- **Accessibility**: 95+
- **Best Practices**: 90+
- **SEO**: 90+
- **PWA**: 100

### Core Web Vitals
- **LCP**: < 2.5s
- **FID**: < 100ms
- **CLS**: < 0.1

## 🤝 Contributing

We welcome contributions to make MeteoSran better! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test PWA functionality
5. Submit a pull request

### PWA Testing
- Test installation flow on multiple devices
- Verify offline functionality
- Check service worker caching
- Validate manifest configuration

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**MeteoSran** was conceived, designed, and developed by **Marc Andréas Yao**. 

Connect with the creator:
- GitHub: [@marcandreasyao](https://github.com/marcandreasyao)
- Email: marc.andreas.yao@example.com

## 🙏 Acknowledgments

- AccuWeather for weather data
- React team for the excellent framework
- PWA community for best practices and guidelines

---

*Experience the future of weather apps with MeteoSran - your intelligent weather companion that works everywhere, online or offline.*