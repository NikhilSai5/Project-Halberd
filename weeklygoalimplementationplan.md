📋 Final Implementation Plan: Automatic Weekly Goal Tracking
Core Rules (Confirmed)
Rule	Behavior
Threshold	5 minutes continuous active time
Reset trigger	Tab switch / domain change / window blur > 30s
Grace period	30 seconds (quick tab peek doesn't reset)
Same-domain nav	Continues timer (YouTube video A → B)
Multi-tab	Each tab independent
Classification	Single extraction at 5-min mark, then track to end
Architecture
┌─────────────────────────────────────────────────────────────────┐
│  BACKGROUND SERVICE WORKER (entrypoints/background.ts)         │
├─────────────────────────────────────────────────────────────────┤
│  State:                                                          │
│  ├── currentSession: ActiveTabSession | null                   │
│  ├── gracePeriodTimer: NodeJS.Timeout | null                   │
│  ├── activeGoal: WeeklyGoal | null (from storage)              │
│  └── classificationCache: Map<url, ClassificationResult>       │
│                                                                 │
│  Listeners:                                                      │
│  ├── tabs.onActivated → switchSession()                        │
│  ├── tabs.onUpdated (url change) → handleNavigation()          │
│  ├── tabs.onRemoved → finalizeSession()                        │
│  ├── windows.onFocusChanged → handleWindowFocus()              │
│  ├── idle.onStateChanged → handleIdle()                        │
│  └── alarms.onAlarm (1s tick) → updateTimer()                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT SCRIPT (entrypoints/content.ts)                        │
├─────────────────────────────────────────────────────────────────┤
│  On-demand extraction via chrome.runtime.sendMessage:          │
│  ├── extractPageContent() → { title, headings, bodyText, ... } │
│  ├── Special handlers: YouTube, GitHub, Docs, etc.             │
│  └── Returns < 5KB text for classification                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLASSIFIER (lib/classifier.ts)                                 │
├─────────────────────────────────────────────────────────────────┤
│  classifyContent(content, goal) → { isProductive, confidence,  │
│                                      matchedKeywords, reasoning }│
│  Rules:                                                          │
│  1. Domain allowlist (productiveDomains) → productive           │
│  2. Domain blocklist (excludedDomains) → unproductive           │
│  3. Keyword matching (weighted by frequency × length)           │
│  4. Heuristics: docs/github=+, social=-, video=neutral         │
│  5. Cache results 24hr per URL                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  INDEXEDDB (lib/db.ts) - New store: productiveSessions         │
├─────────────────────────────────────────────────────────────────┤
│  { id, domain, url, title, startTime, endTime, durationMs,    │
│    isProductive, weeklyGoalId, contentSummary,                 │
│    matchedKeywords, confidence, createdAt }                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  WEEKLY GOAL PAGE (entrypoints/newtab/pages/WeeklyGoal/)       │
├─────────────────────────────────────────────────────────────────┤
│  Display:                                                        │
│  ├── Merge manual + auto sessions                              │
│  ├── 🤖 badge for auto-tracked                                 │
│  ├── Domain favicon + productivity badge (green/gray/red)      │
│  ├── Expandable: matched keywords, confidence                  │
│  ├── Manual override buttons (train classifier)                │
│  └── Weekly stats: productive hrs, top domains, daily breakdown│
└─────────────────────────────────────────────────────────────────┘
File Changes Required
New Files
File	Purpose
entrypoints/background.ts	Service worker - tab tracking + classification orchestration
entrypoints/content.ts	Content script - on-demand page content extraction
lib/classifier.ts	Classification engine (keyword + heuristic)
components/WeeklySessionRow.tsx	Enhanced session display component
components/ProductiveSessionCard.tsx	Auto-session card with override controls
Modified Files
File	Changes
lib/db.ts	Add productiveSessions store + CRUD functions
lib/SettingsContext.tsx	Extend WeeklyGoal with autoTracking config; add session queries
entrypoints/newtab/pages/WeeklyGoal/WeeklyGoal.tsx	Display auto sessions + stats
entrypoints/newtab/pages/Settings/Settings.tsx	Auto-tracking configuration UI
wxt.config.ts	Register background + content script entrypoints
Implementation Phases
Phase 1: Data Layer (Day 1-2)
- Extend db.ts with productiveSessions store
- Add autoTracking to WeeklyGoal type
- Add DB functions: getProductiveSessions, addProductiveSession, etc.
- Update SettingsContext with new types and methods
Phase 2: Background Tracker (Day 3-5)
- Create background.ts with WXT defineBackground
- Implement ActiveTabSession state machine
- Add listeners: onActivated, onUpdated, onRemoved, onFocusChanged, idle
- 1-second alarm for timer updates
- 30-second grace period logic
- Session finalization + IndexedDB persistence
Phase 3: Content Extraction (Day 5-6)
- Create content.ts with defineContentScript
- Implement extractPageContent() with site-specific handlers
- Message handler for EXTRACT_CONTENT request
Phase 4: Classifier (Day 6-7)
- Create classifier.ts
- Keyword matching (weighted)
- Domain allowlist/blocklist
- Heuristics for common site categories
- 24hr URL cache
Phase 5: Settings UI (Day 8)
- Add Auto-Tracking section to Settings page
- Keyword editor (add/remove chips)
- Domain allowlist/blocklist inputs
- Threshold slider (default 5 min, configurable)
- Grace period slider (default 30s)
Phase 6: WeeklyGoal Display (Day 9-11)
- Fetch auto sessions in WeeklyGoal.tsx
- Merge with manual sessions (sort by date)
- Build ProductiveSessionCard component
- Add productivity badge, favicon, expandable details
- Manual override: "Mark productive/unproductive" → re-classify
- Weekly summary stats cards
Phase 7: Polish (Day 12-14)
- Handle edge cases (crash recovery, goal changes, no active goal)
- Batch IndexedDB writes (every 10s)
- Permission handling (request <all_urls> on enable)
- Testing across site types (YouTube, GitHub, Docs, Social, etc.)
Key Technical Details
Background Session State Machine
IDLE → (tab activated) → TRACKING
TRACKING → (5 min reached) → CLASSIFYING → (result) → TRACKING
TRACKING → (tab switch/blur >30s) → IDLE (reset)
TRACKING → (tab close) → FINALIZING → IDLE (save)
Grace Period Implementation
// On tab switch away
gracePeriodTimer = setTimeout(() => {
  resetContinuousTimer(); // Only reset after 30s
}, 30_000);

// On tab switch back (within 30s)
clearTimeout(gracePeriodTimer); // Cancel reset
Classification at Threshold
async function onThresholdReached(session: ActiveTabSession) {
  session.hasClassified = true;
  
  const content = await chrome.tabs.sendMessage(session.tabId, {
    type: 'EXTRACT_CONTENT'
  });
  
  const result = classifyContent(content, activeGoal);
  
  // Retroactive: session started 5 min ago
  await saveProductiveSession({
    ...session,
    startTime: session.continuousStartTime,
    endTime: Date.now(),
    durationMs: 300_000, // First 5 min
    isProductive: result.isProductive,
    matchedKeywords: result.matchedKeywords,
    confidence: result.confidence,
    contentSummary: content.title.slice(0, 100)
  });
}
Configuration Schema (User-Facing)
interface AutoTrackingConfig {
  enabled: boolean;                    // Default: false
  keywords: string[];                  // Goal-relevant terms
  classificationThresholdMs: number;   // Default: 300,000 (5 min)
  gracePeriodMs: number;               // Default: 30,000 (30 sec)
  excludedDomains: string[];           // Always unproductive
  productiveDomains: string[];         // Always productive
  minSessionDurationMs: number;        // Default: 60,000 (1 min) - min to save
}
Permissions Required (wxt.config.ts)
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ['tabs', 'activeTab', 'idle', 'storage', 'alarms'],
    host_permissions: ['<all_urls>'],  // For content script injection
    background: {
      service_worker: 'background.ts',
      type: 'module'
    },
    content_scripts: [{
      matches: ['<all_urls>'],
      js: ['content.ts'],
      run_at: 'document_idle'
    }]
  }
});