// ── Judge Q&A Mock Data ──

export type JudgeCategory =
  | 'traffic_flow'
  | 'signal_timing'
  | 'incident_response'
  | 'infrastructure'
  | 'policy'
  | 'enforcement';

export type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

export type AnswerStatus = 'answered' | 'pending' | 'under_review';

export interface JudgeQuestion {
  id: string;
  question: string;
  askedBy: string;
  designation: string;
  city: string;
  category: JudgeCategory;
  difficulty: DifficultyLevel;
  askedAt: string;
  status: AnswerStatus;
  upvotes: number;
  relatedRoad?: string;
  tags: string[];
}

export interface JudgeSolution {
  questionId: string;
  answer: string;
  keyMetrics: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  recommendations: string[];
  dataSources: string[];
  answeredBy: string;
  answeredAt: string;
  confidence: number; // 0–100
}

export const JUDGE_CATEGORY_CONFIG: Record<JudgeCategory, { label: string; icon: string; color: string }> = {
  traffic_flow: { label: 'Traffic Flow', icon: '🚗', color: 'cyan' },
  signal_timing: { label: 'Signal Timing', icon: '🚦', color: 'emerald' },
  incident_response: { label: 'Incident Response', icon: '🚨', color: 'amber' },
  infrastructure: { label: 'Infrastructure', icon: '🏗️', color: 'purple' },
  policy: { label: 'Policy & Regulation', icon: '📋', color: 'blue' },
  enforcement: { label: 'Enforcement', icon: '⚖️', color: 'red' },
};

export const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; badge: string }> = {
  basic: { label: 'Basic', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  intermediate: { label: 'Intermediate', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  advanced: { label: 'Advanced', badge: 'bg-red-500/20 text-red-300 border-red-500/30' },
};

export const STATUS_CONFIG_QA: Record<AnswerStatus, { label: string; badge: string }> = {
  answered: { label: 'Answered', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  pending: { label: 'Pending', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  under_review: { label: 'Under Review', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
};

export const MOCK_JUDGE_QUESTIONS: JudgeQuestion[] = [
  {
    id: 'jq-001',
    question: 'What is the maximum allowable congestion level before emergency protocol should be activated on a national highway passing through city limits?',
    askedBy: 'Hon. Justice Ramesh Mehta',
    designation: 'Traffic Court Judge — Bengaluru',
    city: 'Bengaluru',
    category: 'traffic_flow',
    difficulty: 'intermediate',
    askedAt: '2026-09-01 10:30',
    status: 'answered',
    upvotes: 14,
    relatedRoad: 'ORR South (Silk Board–Bellandur)',
    tags: ['congestion', 'emergency', 'highway'],
  },
  {
    id: 'jq-002',
    question: 'How does the signal timing optimization account for pedestrian crossing volume during school hours near educational institutions?',
    askedBy: 'Hon. Justice Priya Sharma',
    designation: 'Traffic Court Judge — Delhi-NCR',
    city: 'Delhi-NCR',
    category: 'signal_timing',
    difficulty: 'advanced',
    askedAt: '2026-09-02 14:15',
    status: 'answered',
    upvotes: 22,
    relatedRoad: 'Ring Road (AIIMS – Dhaula Kuan)',
    tags: ['pedestrian', 'school', 'signal', 'safety'],
  },
  {
    id: 'jq-003',
    question: 'What is the average response time for traffic police dispatch after an accident is reported via the emergency corridor system?',
    askedBy: 'Hon. Justice Arun Nair',
    designation: 'District Judge — Mumbai',
    city: 'Mumbai',
    category: 'incident_response',
    difficulty: 'basic',
    askedAt: '2026-09-02 09:00',
    status: 'answered',
    upvotes: 18,
    relatedRoad: 'Western Express Highway',
    tags: ['response_time', 'accident', 'dispatch'],
  },
  {
    id: 'jq-004',
    question: 'Is the current lane configuration on ORR East sufficient for the projected 30% increase in traffic volume by 2027, and what infrastructure modifications would be needed?',
    askedBy: 'Hon. Justice Kavitha Reddy',
    designation: 'Traffic Court Judge — Hyderabad',
    city: 'Hyderabad',
    category: 'infrastructure',
    difficulty: 'advanced',
    askedAt: '2026-09-03 11:45',
    status: 'under_review',
    upvotes: 31,
    relatedRoad: 'HITECH City Main Arterial',
    tags: ['capacity', 'future_planning', 'infrastructure'],
  },
  {
    id: 'jq-005',
    question: 'Does the traffic management system comply with the Motor Vehicles (Amendment) Act 2019 provisions for automated speed enforcement zones?',
    askedBy: 'Hon. Justice Vikram Desai',
    designation: 'High Court Judge — Bengaluru',
    city: 'Bengaluru',
    category: 'policy',
    difficulty: 'intermediate',
    askedAt: '2026-09-03 16:20',
    status: 'pending',
    upvotes: 9,
    tags: ['compliance', 'speed_enforcement', 'legal'],
  },
  {
    id: 'jq-006',
    question: 'What percentage of traffic violations captured by YOLO vision cameras result in successful prosecution, and what is the false positive rate?',
    askedBy: 'Hon. Justice Meera Joshi',
    designation: 'Traffic Court Judge — Delhi-NCR',
    city: 'Delhi-NCR',
    category: 'enforcement',
    difficulty: 'intermediate',
    askedAt: '2026-09-04 10:00',
    status: 'answered',
    upvotes: 25,
    tags: ['yolo', 'enforcement', 'prosecution', 'accuracy'],
  },
  {
    id: 'jq-007',
    question: 'How effective is the green wave signal coordination on Hosur Road Elevated in reducing overall commute time during peak hours?',
    askedBy: 'Hon. Justice Sunil Rao',
    designation: 'Traffic Court Judge — Bengaluru',
    city: 'Bengaluru',
    category: 'signal_timing',
    difficulty: 'basic',
    askedAt: '2026-09-04 13:30',
    status: 'answered',
    upvotes: 12,
    relatedRoad: 'Hosur Road Elevated',
    tags: ['green_wave', 'peak_hours', 'commute'],
  },
  {
    id: 'jq-008',
    question: 'What is the legal authority for diverting traffic during VIP movements, and how does it affect the average commuter\'s right to free movement under Article 19(1)(d)?',
    askedBy: 'Hon. Justice Deepa Menon',
    designation: 'High Court Judge — Mumbai',
    city: 'Mumbai',
    category: 'policy',
    difficulty: 'advanced',
    askedAt: '2026-09-05 09:15',
    status: 'pending',
    upvotes: 42,
    tags: ['VIP', 'constitutional', 'diversion', 'rights'],
  },
];

export const MOCK_JUDGE_SOLUTIONS: JudgeSolution[] = [
  {
    questionId: 'jq-001',
    answer: 'Based on the Bharat Traffic Intelligence System (BTIS) data, the emergency protocol threshold is set at 92% congestion index for national highways within city limits. Current monitoring shows ORR South peaks at 94–97% during evening rush (17:30–19:30), triggering automatic emergency signal coordination. The system has been calibrated against NHAI guidelines and local traffic commissioner orders.',
    keyMetrics: [
      { label: 'Current Peak Congestion', value: '94%', trend: 'up' },
      { label: 'Emergency Threshold', value: '92%', trend: 'neutral' },
      { label: 'Avg Recovery Time', value: '45 min', trend: 'down' },
      { label: 'Junctions Under Protocol', value: '12', trend: 'neutral' },
    ],
    recommendations: [
      'Lower threshold to 88% for monsoon season when accident risk increases by 40%',
      'Deploy additional traffic police units at Silk Board and Bellandur junctions during peak hours',
      'Integrate real-time CCTV feeds with BTIS for faster incident detection',
      'Activate citizen mobility advisory when congestion exceeds 85% to encourage route diversions',
    ],
    dataSources: ['BTIS Real-Time Dashboard', 'NHAI Highway Monitoring', 'Signal Coordination Logs'],
    answeredBy: 'AI Traffic Intelligence Engine — BTIS v3.2',
    answeredAt: '2026-09-01 11:45',
    confidence: 94,
  },
  {
    questionId: 'jq-002',
    answer: 'The signal optimization algorithm incorporates pedestrian phase calculations using a weighted model that increases crossing time by 60% during school hours (07:30–09:00 and 14:00–16:00). The system detects pedestrian volume through infrared sensors and YOLO vision cameras, adjusting the pedestrian green phase from the standard 25 seconds to 40 seconds near schools. Safety compliance is maintained at 99.2% across 28 school zones.',
    keyMetrics: [
      { label: 'Standard Pedestrian Phase', value: '25 sec', trend: 'neutral' },
      { label: 'School Hours Phase', value: '40 sec', trend: 'up' },
      { label: 'School Zones Covered', value: '28', trend: 'neutral' },
      { label: 'Safety Compliance', value: '99.2%', trend: 'up' },
    ],
    recommendations: [
      'Extend school zone coverage to all 45 identified educational institutions within city limits',
      'Install push-button pedestrian signals at 15 high-traffic school crossings',
      'Implement flashing amber beacons during school arrival/dismissal windows',
      'Deploy crossing guards at junctions without automated pedestrian detection',
    ],
    dataSources: ['Signal Optimization Engine', 'Pedestrian Sensor Network', 'YOLO Vision Analytics'],
    answeredBy: 'AI Traffic Intelligence Engine — BTIS v3.2',
    answeredAt: '2026-09-02 15:30',
    confidence: 91,
  },
  {
    questionId: 'jq-003',
    answer: 'The average emergency dispatch response time across Mumbai is 8.7 minutes for accidents reported through the emergency corridor system. Breaking this down: Western Express Highway corridor averages 7.2 minutes (best-in-class), Bandra-Worli Sea Link averages 9.8 minutes, and SCLR Flyover averages 10.5 minutes. The system has processed 1,247 accident dispatches in the past 30 days with a 96.3% resolution rate.',
    keyMetrics: [
      { label: 'Avg Dispatch Time', value: '8.7 min', trend: 'down' },
      { label: 'Best Corridor', value: '7.2 min', trend: 'down' },
      { label: 'Resolution Rate', value: '96.3%', trend: 'up' },
      { label: 'Monthly Dispatches', value: '1,247', trend: 'up' },
    ],
    recommendations: [
      'Deploy additional rapid response units at SCLR Flyover corridor to reduce response time below 8 minutes',
      'Pre-position ambulance at Bandra-Worli Sea Link midpoint station',
      'Implement automatic lane clearance protocol for emergency vehicles',
      'Add real-time traffic data sharing with hospital emergency departments',
    ],
    dataSources: ['Emergency Response Database', 'GPS Fleet Tracking', 'Incident Management System'],
    answeredBy: 'AI Traffic Intelligence Engine — BTIS v3.2',
    answeredAt: '2026-09-02 10:15',
    confidence: 96,
  },
  {
    questionId: 'jq-006',
    answer: 'YOLO vision camera enforcement has captured 34,520 violations in the past 90 days across Delhi-NCR. The system achieves a 94.7% accuracy rate with a false positive rate of 3.2%. Of confirmed violations, 78.4% have resulted in successful prosecution through the automated challan system. The remaining 21.6% were either contested and overturned (14.8%) or pending adjudication (6.8%).',
    keyMetrics: [
      { label: 'Violations Captured', value: '34,520', trend: 'up' },
      { label: 'System Accuracy', value: '94.7%', trend: 'up' },
      { label: 'False Positive Rate', value: '3.2%', trend: 'down' },
      { label: 'Prosecution Success', value: '78.4%', trend: 'up' },
    ],
    recommendations: [
      'Retrain YOLO model on the 14.8% overturned cases to reduce contest rate',
      'Implement dual-camera verification for speed violations above 100 km/h',
      'Add ANPR cross-referencing to improve vehicle identification accuracy',
      'Publish monthly accuracy reports for public transparency and judicial confidence',
    ],
    dataSources: ['YOLO Vision Analytics', 'Challan Processing System', 'Court Case Database'],
    answeredBy: 'AI Traffic Intelligence Engine — BTIS v3.2',
    answeredAt: '2026-09-04 11:20',
    confidence: 93,
  },
  {
    questionId: 'jq-007',
    answer: 'The green wave signal coordination on Hosur Road Elevated has demonstrated a 23% reduction in average commute time during peak hours (08:00–10:00 and 17:00–19:30). Average speed has improved from 28 km/h to 36 km/h since implementation. The system coordinates 14 sequential signals with adaptive offsets that adjust every 5 minutes based on real-time flow data. Off-peak improvements are more modest at 11%.',
    keyMetrics: [
      { label: 'Peak Commute Reduction', value: '23%', trend: 'up' },
      { label: 'Avg Speed (Peak)', value: '36 km/h', trend: 'up' },
      { label: 'Signals Coordinated', value: '14', trend: 'neutral' },
      { label: 'Off-Peak Improvement', value: '11%', trend: 'neutral' },
    ],
    recommendations: [
      'Extend green wave to connecting Koramangala 100ft Road for network-level optimization',
      'Implement queue detection cameras at 6 key junctions for better phase adjustment',
      'Test dynamic speed advisory signs to help drivers maintain optimal green wave timing',
      'Replicate the Hosur Road model on Mysore Road Elevated corridor',
    ],
    dataSources: ['Signal Coordination Engine', 'Flow Sensor Network', 'Speed Analytics Dashboard'],
    answeredBy: 'AI Traffic Intelligence Engine — BTIS v3.2',
    answeredAt: '2026-09-04 14:45',
    confidence: 97,
  },
];
