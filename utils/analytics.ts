import { getCLS, getFID, getLCP } from 'web-vitals';

export function reportWebVitals(metric: any) {
  console.log(metric);
  
  // Add your analytics service here
  // Example: Google Analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.value * 1000),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

export function initializeVitals() {
  getCLS(reportWebVitals);
  getFID(reportWebVitals);
  getLCP(reportWebVitals);
}