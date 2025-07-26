# Analytics Migration Guide

## Quick Start Migration

If you're adding analytics to an existing MeteoSran installation, follow these steps:

### 1. Install Dependencies
```bash
npm install @vercel/analytics @vercel/speed-insights
```

### 2. Update index.tsx
```tsx
// Add these imports at the top
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Add these components inside <React.StrictMode>
<Analytics />
<SpeedInsights />
```

### 3. Update App.tsx
```tsx
// Add this import at the top
import { track } from '@vercel/analytics';

// Add tracking to theme toggle function
const toggleTheme = () => {
  track('theme_toggle', { 
    from: theme, 
    to: theme === 'light' ? 'dark' : 'light' 
  });
  // ... rest of your function
};

// Add tracking to message sending
const handleSendMessage = async (text: string, imageFile?: File | null) => {
  if (!text.trim() && !imageFile) return;

  track('message_sent', { 
    hasText: !!text.trim(), 
    hasImage: !!imageFile,
    mode: selectedMode,
    messageLength: text.length 
  });
  // ... rest of your function
};
```

### 4. Deploy to Vercel
Analytics will only collect data when deployed to Vercel. Local development won't send data to production analytics.

## Verification
After deployment, check your Vercel dashboard's Analytics tab to confirm data collection is working.

## Privacy Note
All tracked events are anonymized and contain no personally identifiable information. Review the full ANALYTICS.md documentation for complete privacy details.
