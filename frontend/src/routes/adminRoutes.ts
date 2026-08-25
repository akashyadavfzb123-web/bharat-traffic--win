export interface RouteConfig {
  path: string;
  name: string;
}

export const ADMIN_ROUTES: RouteConfig[] = [
  { path: '/admin/overview', name: 'Overview' },
  { path: '/admin/live-traffic', name: 'Live Traffic' },
  { path: '/admin/digital-twin', name: 'Digital Twin' },
  { path: '/admin/predictions', name: 'Predictions' },
  { path: '/admin/signal-optimization', name: 'Signal Optimization' },
  { path: '/admin/what-if', name: 'What-If Scenarios' },
  { path: '/admin/emergency-corridor', name: 'Emergency Corridor' },
  { path: '/admin/incidents', name: 'Incident Management' },
  { path: '/admin/analytics', name: 'Analytics' },
  { path: '/admin/reports', name: 'Reports' },
  { path: '/admin/city-management', name: 'City Management' },
  { path: '/admin/settings', name: 'Settings' },
];
