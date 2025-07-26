# MeteoSran Analytics Implementation

## Overview

MeteoSran now includes comprehensive analytics tracking using Vercel Analytics and Speed Insights. This implementation provides valuable insights into user behavior, performance metrics, and application usage patterns.

## Installed Packages

### 1. @vercel/analytics
- **Version**: ^1.5.0
- **Purpose**: Tracks page views, custom events, and user interactions
- **Features**: Privacy-focused, GDPR compliant, lightweight

### 2. @vercel/speed-insights
- **Version**: Latest
- **Purpose**: Monitors Core Web Vitals and performance metrics
- **Features**: Real User Monitoring (RUM), performance scoring

## Implementation Details

### Core Components Integration

#### index.tsx
```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

// Added to root render
<Analytics />
<SpeedInsights />
```

#### App.tsx
```tsx
import { track } from '@vercel/analytics';

// Custom event tracking throughout the application
```

## Tracked Events

### 1. Theme Toggle
- **Event**: `theme_toggle`
- **Data**: 
  - `from`: Previous theme (light/dark)
  - `to`: New theme (light/dark)
- **Purpose**: Track user preference patterns

### 2. Message Sending
- **Event**: `message_sent`
- **Data**:
  - `hasText`: Whether message contains text
  - `hasImage`: Whether message contains image
  - `mode`: Selected response mode
  - `messageLength`: Character count of message
- **Purpose**: Understand user interaction patterns

### 3. Weather Widget Display
- **Event**: `weather_widget_shown`
- **Data**:
  - `query`: Type of weather query (e.g., 'ivory_coast_weather')
- **Purpose**: Track regional weather interest

### 4. Sample Question Usage
- **Event**: `sample_question_clicked`
- **Data**:
  - `question`: First 50 characters of question (privacy-conscious)
  - `questionLength`: Full length of question
- **Purpose**: Identify popular starting points for users

### 5. Response Mode Changes
- **Event**: `response_mode_changed`
- **Data**:
  - `from`: Previous response mode
  - `to`: New response mode
- **Purpose**: Track feature usage and preferences

## Privacy Considerations

### Data Collection Principles
1. **Minimal Data**: Only collect essential metrics for improving user experience
2. **Anonymized**: No personally identifiable information is tracked
3. **Truncated Content**: Sample questions are truncated to 50 characters
4. **No Sensitive Data**: Weather queries and AI responses are not logged in full

### GDPR Compliance
- Vercel Analytics is GDPR compliant by design
- No cookies are stored without consent
- Data is processed according to Vercel's privacy policy
- Users can opt-out through browser settings

## Performance Impact

### Bundle Size
- **@vercel/analytics**: ~2KB gzipped
- **@vercel/speed-insights**: ~1KB gzipped
- **Total Impact**: Minimal (<3KB additional bundle size)

### Runtime Performance
- Non-blocking initialization
- Asynchronous event tracking
- No impact on Core Web Vitals
- Optimized for PWA performance

## Deployment Configuration

### Environment Variables
No additional environment variables required. Analytics will automatically activate when deployed to Vercel.

### Local Development
Analytics components work in development but data is not sent to production analytics unless deployed to Vercel.

## Monitoring Dashboard

### Access
1. Visit your Vercel dashboard
2. Navigate to your MeteoSran project
3. Click on the "Analytics" tab
4. View metrics in the "Speed Insights" section

### Key Metrics to Monitor

#### User Engagement
- Page views and unique visitors
- Session duration and bounce rate
- Feature usage patterns (theme toggle, response modes)
- Sample question popularity

#### Performance Metrics
- **Largest Contentful Paint (LCP)**: Loading performance
- **First Input Delay (FID)**: Interactivity
- **Cumulative Layout Shift (CLS)**: Visual stability
- **Time to First Byte (TTFB)**: Server response time

#### Custom Events Analysis
- Theme preference distribution
- Message interaction patterns
- Weather widget engagement
- Response mode preferences

## Code Maintenance

### Adding New Events
To track additional user interactions:

```tsx
import { track } from '@vercel/analytics';

// In your component or handler
const handleNewFeature = () => {
  track('new_feature_used', {
    feature: 'feature_name',
    context: 'additional_context'
  });
  
  // Your feature logic here
};
```

### Event Naming Convention
- Use snake_case for event names
- Be descriptive but concise
- Group related events with prefixes (e.g., `user_`, `weather_`, `ai_`)

### Data Types
- **Strings**: For categorical data
- **Numbers**: For metrics and counts
- **Booleans**: For feature flags and states
- **Objects**: Avoid complex nested objects

## Troubleshooting

### Common Issues

#### Analytics Not Showing Data
1. Ensure deployment is on Vercel
2. Check that Analytics is enabled in Vercel dashboard
3. Verify components are properly imported and rendered

#### Performance Issues
1. Verify bundle size hasn't increased significantly
2. Check that tracking calls are not in render loops
3. Ensure events are not fired too frequently

#### Privacy Concerns
1. Review tracked data to ensure no PII is included
2. Update privacy policy to mention analytics usage
3. Provide opt-out mechanisms if required

## Future Enhancements

### Potential Additions
1. **User Journey Tracking**: Track complete user flows
2. **Error Analytics**: Monitor and track application errors
3. **A/B Testing**: Implement feature flag analytics
4. **Conversion Tracking**: Track goal completions

### Advanced Features
1. **Cohort Analysis**: Group users by behavior
2. **Funnel Analysis**: Track multi-step processes
3. **Real-time Monitoring**: Set up alerts for anomalies
4. **Custom Dashboards**: Create specialized views

## Best Practices

### Data Quality
- Always validate event data before sending
- Use consistent naming conventions
- Document all tracked events
- Regular audit of tracked events

### Privacy
- Regularly review data collection practices
- Keep privacy policy updated
- Implement data retention policies
- Provide clear opt-out mechanisms

### Performance
- Batch events when possible
- Avoid tracking in performance-critical paths
- Monitor bundle size impact
- Test analytics impact on Core Web Vitals

## Support and Resources

### Documentation
- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Speed Insights Docs](https://vercel.com/docs/speed-insights)
- [React Integration Guide](https://vercel.com/docs/analytics/react)

### Community
- [Vercel Community](https://github.com/vercel/community)
- [Analytics Discussions](https://github.com/vercel/analytics/discussions)

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Maintainer**: MeteoSran Development Team
