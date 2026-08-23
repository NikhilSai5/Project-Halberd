# Halberd UI Audit and Implementation Specification

## Scope

This document audits the current frontend implementation and defines a systematic implementation order for improving it without redesigning the product.

The existing Stitch design remains the visual source of truth. The implementation must preserve:

- The calm, light productivity-workspace identity
- The Inter-based typography direction
- The muted off-white, white, green, blue, and pastel accent palette
- The restrained card-based composition
- The floating navigation dock
- The existing page hierarchy and interaction concepts

This specification is limited to UI and UX quality. Application logic, APIs, state management, routing, and functionality should not be changed except where a small rendering correction is required for the UI to work as intended.

## Frontend Inventory

### Application shell

- `entrypoints/newtab/main.tsx` bootstraps the React application.
- `entrypoints/newtab/App.tsx` owns page switching through `currentPage` state.
- `components/Navbar.tsx` provides desktop top branding, mobile top branding, the fixed bottom navigation dock, time, weather, and pet affordances.
- `entrypoints/newtab/style.css` contains base styles, the glass-panel treatment, task checkbox styling, Pomodoro chart styles, pet animation, and duplicated typography utilities.
- `assets/tailwind.css` contains the Tailwind directives.
- `tailwind.config.js` defines the color palette, semantic font utilities, font sizes, radii, and intended spacing tokens.

### Pages

- Home: `entrypoints/newtab/pages/Home/Home.tsx`
- Pomodoro: `entrypoints/newtab/pages/Pomodoro/Pomodoro.tsx`
- Weekly Goal: `entrypoints/newtab/pages/WeeklyGoal/WeeklyGoal.tsx`
- Focus Mode: `entrypoints/newtab/pages/FocusMode/FocusMode.tsx`
- Tools: `entrypoints/newtab/pages/Tools/Tools.tsx`
- Settings: `entrypoints/newtab/pages/Settings/Settings.tsx`
- Calendar: `entrypoints/newtab/pages/Calendar/Calendar.tsx`

### Existing visual language

- Backgrounds are warm, nearly-white neutrals rather than pure gray.
- Primary color is muted green, supported by pale green containers.
- Secondary accents include pale blue, pink, purple, and orange.
- Cards use subtle borders, soft shadows, and moderate corner rounding.
- Text hierarchy is compact and functional rather than display-oriented.
- Material Symbols are used for navigation and action icons.
- The product favors centered workspaces with generous horizontal whitespace.

## Severity Audit

### CRITICAL

#### 1. Missing workspace shadow utility

`workspace-shadow` is used by Calendar and Tools but is not defined in the Tailwind configuration or stylesheet. Those panels therefore do not receive the intended visual elevation.

References:

- `entrypoints/newtab/pages/Calendar/Calendar.tsx:70`
- `entrypoints/newtab/pages/Tools/Tools.tsx:15`

Implementation requirement:

- Define one shared workspace shadow matching the existing subtle elevation language.
- Use the same shadow token consistently for major workspace panels.
- Do not introduce dramatic or highly decorative shadows.

#### 2. Invalid Pomodoro background-ring color reference

The inactive Pomodoro ring uses `var(--tw-colors-surface-container-high)`. Tailwind does not expose this value as a guaranteed CSS variable, so the inactive ring may not render with its intended color.

Reference:

- `entrypoints/newtab/style.css:34`

Implementation requirement:

- Use a valid shared CSS color or a generated Tailwind color class.
- Keep the inactive ring quiet and lower contrast than the active progress ring.

#### 3. Mobile navigation density risk

The bottom dock contains seven navigation controls, a live clock, weather, and a pet icon. On narrow screens, the fixed `95%` container is likely to become cramped or overflow.

Reference:

- `components/Navbar.tsx:63-95`

Implementation requirement:

- Preserve the dock concept and all existing destinations.
- Validate the dock at narrow mobile widths.
- Reduce nonessential side content or allow the navigation surface to breathe without changing the page model.
- Maintain minimum touch targets and avoid icons becoming visually compressed.

#### 4. Prominent controls with no visible behavior

Several controls look actionable but do not currently communicate whether they are intentionally unavailable or unfinished:

- Add task: `Home.tsx:83`
- History: `Pomodoro.tsx:74`
- Close controls: `Navbar.tsx:55`, `FocusMode.tsx:26`, `Tools.tsx:18`, `Settings.tsx:52`
- End Focus: `FocusMode.tsx:41`
- Organize Tabs: `Tools.tsx:28`
- File converters: `Tools.tsx:38`

Implementation requirement:

- Do not implement new functionality as part of the visual pass.
- Give unavailable or future actions a clear visual treatment, or preserve the existing action style only where the control is functional.
- Ensure disabled-looking controls are not styled as active primary actions.

### HIGH

#### 1. No shared component-level visual primitives

Cards, headings, buttons, icon buttons, list rows, and form controls are implemented independently on each page. This causes visual drift and makes Stitch-level consistency difficult to maintain.

Implementation requirement:

- Introduce shared visual rules before page-specific polishing.
- Prefer a small set of reusable primitives over a new design system:
  - Workspace container
  - Surface/card
  - Page header
  - Section heading
  - Primary and secondary buttons
  - Icon button
  - List row
  - Form control
- Keep the primitives visually equivalent to the current implementation.

#### 2. Inconsistent workspace widths

Current page widths vary between `max-w-md`, `max-w-lg`, `max-w-2xl`, `max-w-[720px]`, `max-w-[800px]`, and `max-w-4xl` without a documented relationship.

Implementation requirement:

- Define a small workspace width scale based on content density.
- Keep Home as the primary reading workspace.
- Keep Pomodoro, Focus Mode, and Weekly Goal narrow and focused.
- Keep Tools and Calendar wider because their content requires it.
- Keep Settings wider because it contains navigation and form controls.
- Align these widths to consistent outer margins and responsive padding.

#### 3. Inconsistent radii and shadows

The implementation mixes `rounded`, `rounded-lg`, `rounded-xl`, `rounded-2xl`, and `rounded-full`, with multiple shadow definitions and one missing shadow token.

Implementation requirement:

- Preserve rounded cards and pill controls.
- Define a limited radius scale for:
  - Workspace panels
  - Nested controls
  - Pills/circular controls
- Define separate elevation levels for workspace panels, nested cards, and hover states.

#### 4. Duplicated typography definitions

Typography is defined both in `tailwind.config.js` and manually in `entrypoints/newtab/style.css`. The semantic names currently all resolve to Inter, but the duplicate definitions can diverge.

Implementation requirement:

- Keep the existing semantic type names.
- Establish one source of truth for font family, size, line height, tracking, and weight.
- Retain the current compact scale unless Stitch reference material requires a measured adjustment.

#### 5. Dynamic Tailwind classes in Calendar

Calendar constructs classes such as `font-${...}` and `text-${...}` at runtime. These classes may not be emitted by Tailwind’s static scanner.

Reference:

- `entrypoints/newtab/pages/Calendar/Calendar.tsx:122`

Implementation requirement:

- Replace dynamic class construction with explicit class mappings or shared typography classes.
- Preserve the current event-specific hierarchy.

#### 6. Fixed-height Settings panel

Settings uses `h-[716px]` with a `min-h-[500px]`, while other screens use flexible viewport layouts. This can produce excessive scrolling or clipped content on short screens.

Reference:

- `entrypoints/newtab/pages/Settings/Settings.tsx:49`

Implementation requirement:

- Preserve the desktop split-panel composition.
- Make the panel fit available viewport height with safe top and bottom space for the navigation dock.
- Allow the content column to scroll without clipping the mobile header.

#### 7. Dark theme control does not visibly affect the UI

The Settings page changes the local radio selection but the application remains visually light. This makes the control appear unreliable.

Reference:

- `entrypoints/newtab/pages/Settings/Settings.tsx:104-119`

Implementation requirement:

- Do not expand theme functionality in this UI-only pass unless required.
- If behavior remains outside scope, visually distinguish the preview control from a live global theme control, or document it as a preview.

### MEDIUM

#### 1. Multiple background definitions

The body uses `#F7F7F5`, while Tailwind defines `background` as `#f9f9f7`, with additional surface variants. The difference is subtle but makes page-to-page transitions feel less unified.

References:

- `entrypoints/newtab/style.css:10-12`
- `tailwind.config.js:17,61`

Implementation requirement:

- Choose one application canvas color.
- Reserve white for elevated panels and use surface variants consistently for nested regions.

#### 2. Arbitrary spacing values bypass configured tokens

The Tailwind configuration defines `component-padding`, `section-gap`, `item-gap`, and `outer-margin`, but most pages use arbitrary pixel values instead.

Implementation requirement:

- Map repeated spacing values to a small scale.
- Keep intentional page-specific spacing where it supports the Stitch composition.
- Remove only redundant variation, not all visual nuance.

#### 3. Inconsistent page headers

Home uses a centered greeting, Pomodoro and Tools use panel headers, Calendar uses two stacked headers, and Focus Mode and Weekly Goal use card-local headings. These differences can remain structurally, but their typography, spacing, and close/action alignment should share common rules.

#### 4. Inconsistent button sizing

Button padding varies between `py-1.5`, `py-2`, `py-2.5`, and `py-3`, while circular controls use 48px. This makes action hierarchy less predictable.

Implementation requirement:

- Define compact, regular, and prominent action sizes.
- Preserve pill-shaped timer controls and rounded rectangular page actions.
- Keep touch targets at least 44px where practical.

#### 5. Incomplete keyboard focus styling

Many buttons use hover and active states but have no visible focus ring. This affects navigation, task checkboxes, settings controls, and calendar controls.

Implementation requirement:

- Add one restrained, palette-aligned focus treatment.
- Ensure focus is visible on both light surfaces and pale colored containers.

#### 6. Inconsistent icon sizing and labeling

Icons use arbitrary sizes, `text-sm`, or default Material Symbols sizing. Several icon-only controls lack explicit accessible labels.

Implementation requirement:

- Define icon sizes for navigation, inline actions, and icon buttons.
- Add labels to icon-only buttons without changing their appearance.

#### 7. Calendar event styling depends on event IDs

Event typography and metadata visibility are based on numeric IDs rather than event variants. This makes the visual rules fragile.

Reference:

- `entrypoints/newtab/pages/Calendar/Calendar.tsx:112-130`

Implementation requirement:

- Use explicit event visual variants.
- Keep the existing color association between event types and the current palette.

#### 8. Missing state treatments

No explicit loading, error, empty, or no-results states are present. Settings uses a generic “coming soon” state for most sections.

Implementation requirement:

- Define quiet empty and unavailable states using existing surfaces, typography, and icon language.
- Avoid introducing prominent illustrations or a new visual metaphor.

### LOW

#### 1. Duplicate Tailwind directives

Both `assets/tailwind.css` and `entrypoints/newtab/style.css` contain Tailwind directives. Keep the import structure intentional and avoid duplicate base generation.

#### 2. Redundant typography utility declarations

The manual `.font-*` utility layer repeats the Tailwind configuration. Remove duplication only after confirming generated class behavior.

#### 3. Redundant class declarations

Some elements repeat transition utilities or responsive typography declarations. Simplify these only when doing so does not alter the rendered result.

#### 4. Inconsistent list-row interaction surfaces

Home expands hover backgrounds beyond the card using negative margins, while Weekly Goal and Tools keep interaction surfaces contained. Standardize list-row behavior while preserving the current visual affordance.

#### 5. Local hardcoded settings colors

Settings defines accent colors directly in the component instead of referencing the shared palette. Keep the existing colors, but centralize their visual definitions.

#### 6. Static document title

`index.html` permanently uses `Halberd - Home` even when another page is displayed. This is a minor polish issue and should not drive the UI refactor.

## Page-by-Page Implementation Specification

## Shared Shell and Navigation

### Current implementation

`App.tsx` renders one page at a time beneath `Navbar`. `Navbar` renders fixed desktop branding, fixed mobile branding, and a fixed bottom dock.

### Implementation goals

- Preserve state-based page switching.
- Preserve the fixed bottom dock and existing seven destinations.
- Make the shell provide consistent page insets so each page does not independently guess how much space the header and dock require.
- Keep branding understated and aligned with the current Stitch direction.

### Required changes

- Establish shared horizontal page padding for mobile, tablet, and desktop.
- Establish shared top and bottom safe areas for fixed navigation.
- Normalize branding typography between desktop and mobile without changing the intended size difference.
- Normalize dock surface, border, blur, radius, and shadow.
- Give every navigation button a consistent touch target, icon size, active background, hover state, and focus state.
- Add accessible labels or tooltips for icon-only controls.
- Test the dock at narrow mobile widths, landscape mobile, tablet, and desktop.

### Acceptance criteria

- No horizontal overflow caused by the dock.
- Active navigation remains legible against the pale dock background.
- Clock, weather, and pet content do not collide with navigation controls.
- The dock does not cover primary page content or primary controls.
- Keyboard focus is visible on every navigation button.

## Home

Reference: `entrypoints/newtab/pages/Home/Home.tsx`

### Current composition

- Centered `720px` workspace
- Date metadata above a “Good morning.” heading
- White rounded task card with subtle border and shadow
- Four task rows with circular checkboxes
- Add task action below the list

### Audit observations

- This is the clearest expression of the product’s core visual identity and should be treated as the baseline for other pages.
- The card, row padding, checkbox, typography, and Add task action are locally defined.
- The row’s negative horizontal margins create a different interaction surface from other list pages.
- The Add task button appears functional but has no implementation.
- The date/greeting spacing is more open than the compact page headers used elsewhere.

### Implementation plan

1. Preserve the centered workspace and greeting hierarchy.
2. Make the Home workspace use the shared page container and safe bottom spacing.
3. Extract the task card surface and list row rules into reusable visual primitives.
4. Normalize card radius, border, shadow, and internal padding with the shared surface rule.
5. Keep the circular checkbox treatment, but standardize its size, border color, checked color, check icon size, and focus ring.
6. Keep completed-task strike-through and muted text behavior.
7. Standardize row hover/focus treatment so the full row receives a consistent surface change without extending unpredictably outside the card.
8. Preserve the Add task placement and green accent, but make its availability visually clear if it remains nonfunctional.
9. Validate the four task rows at narrow widths so text wraps without shifting checkbox alignment.

### Responsive behavior

- Mobile: retain centered date and greeting, use safe horizontal padding, and allow task text to wrap.
- Desktop: preserve the narrow, calm 720px reading column.
- Short viewport: ensure the bottom dock does not cover the final task or Add task action.

### Acceptance criteria

- Home establishes the reference card treatment used by other pages.
- Task rows align vertically and share one spacing rhythm.
- Checkbox focus and checked states are visible.
- No content is hidden behind fixed navigation.

## Pomodoro

Reference: `entrypoints/newtab/pages/Pomodoro/Pomodoro.tsx`

### Current composition

- Centered narrow panel
- Panel header with title and History action
- Large circular timer ring
- Timer value and “Focus Time” label
- Stop, Start/Pause, and Reset controls
- Four session indicator dots

### Audit observations

- The Pomodoro panel uses `rounded-2xl` and a custom shadow unlike the shared `rounded-xl` card style.
- The progress ring has a likely invalid inactive stroke color.
- Timer controls have a clear hierarchy, but button sizing is not represented elsewhere.
- History appears actionable but has no behavior.

### Implementation plan

1. Preserve the panel-centered timer composition and large ring.
2. Apply the shared workspace width, surface border, radius, and elevation rules.
3. Keep the timer display as the largest text element in the product, with the existing compact Inter direction.
4. Repair the inactive ring color using a valid shared color.
5. Keep the active ring in the existing pale green palette and preserve the progress animation.
6. Standardize the three control sizes and spacing while preserving the prominent pill-shaped Start/Pause button.
7. Add visible focus states to all timer controls.
8. Keep session dots visually subordinate and align them to the timer controls.
9. Make the History action visually distinguishable as secondary or unavailable if no behavior is being added.

### Responsive behavior

- Mobile: reduce panel and ring size fluidly without letting the timer become cramped.
- Desktop: preserve the centered panel and generous breathing room.
- Short viewport: reduce vertical gaps before reducing the timer’s legibility.

### Acceptance criteria

- Inactive and active ring strokes render correctly.
- Timer controls have a predictable size hierarchy.
- The panel remains fully visible above the dock.
- Start/Pause remains the clear primary action.

## Weekly Goal

Reference: `entrypoints/newtab/pages/WeeklyGoal/WeeklyGoal.tsx`

### Current composition

- Narrow centered card
- Small uppercase “Weekly Goal” label
- Goal title
- Large total time value
- Session history rows with time range, description, and link icon

### Audit observations

- The card is structurally similar to Focus Mode but has no shared card primitive.
- Session rows can become cramped because the time range, description, and link are all in one horizontal flex row.
- The time range and description do not have a responsive wrapping strategy.
- The link is an anchor with `href="#"`, which can create an unwanted jump.
- The decorative pet container is empty.

### Implementation plan

1. Preserve the narrow, focused goal-summary card.
2. Use shared card padding, radius, border, and shadow.
3. Keep the goal label, title, and large duration hierarchy.
4. Normalize the duration label spacing and metadata treatment with the rest of the product.
5. Convert session rows to a stable responsive layout: time metadata, flexible description, and a fixed trailing action area.
6. Keep row dividers subtle and use the same list-row rule as Home and Tools.
7. Give the link icon an accessible label and visible focus treatment.
8. Make the row content wrap gracefully on mobile without changing the information hierarchy.
9. Remove or correctly implement the empty decorative container rather than preserving an invisible layout artifact.

### Responsive behavior

- Mobile: allow the description to wrap below or beside the time range according to available width.
- Desktop: retain the compact horizontal session presentation.
- Ensure the last row and card bottom padding remain above the navigation dock.

### Acceptance criteria

- No session row overflows at narrow widths.
- Time metadata remains visually secondary but easy to scan.
- The card aligns with Focus Mode’s surface treatment.

## Focus Mode

Reference: `entrypoints/newtab/pages/FocusMode/FocusMode.tsx`

### Current composition

- Centered narrow card
- “Focus Mode” header with close icon
- Focus icon
- Current task title
- Countdown value
- Full-width End Focus action

### Audit observations

- Focus Mode shares a card structure with Weekly Goal but has separate markup and spacing.
- The close icon has no accessible label or behavior.
- The End Focus button looks like a primary action but does not currently communicate availability.
- `pt-24`, `pb-32`, and internal `py-8` create a large vertical stack that may be awkward on short screens.
- The decorative pet container is empty.

### Implementation plan

1. Preserve the centered focus card and its quiet, single-task composition.
2. Reuse shared page header and card rules from Weekly Goal.
3. Keep the focus icon muted so the task title and timer remain dominant.
4. Preserve the current task title accent color.
5. Normalize timer typography with Pomodoro while keeping the distinct focus context.
6. Keep End Focus full width, but align its height, radius, border, and hover/focus treatment with shared action sizes.
7. Add an accessible label to the close icon.
8. Reduce vertical spacing responsively on short viewports instead of changing the hierarchy.
9. Remove or properly define the empty decorative container.

### Responsive behavior

- Mobile: use safe top spacing below the mobile brand and safe bottom spacing above the dock.
- Desktop: preserve centered vertical composition.
- Short viewport: prevent the timer and End Focus action from being pushed below the visible area.

### Acceptance criteria

- Focus Mode and Weekly Goal visibly belong to the same card family.
- The task title and timer remain the focal elements.
- Close and End Focus controls have clear focus states.

## Tools

Reference: `entrypoints/newtab/pages/Tools/Tools.tsx`

### Current composition

- Wider centered workspace
- Header with Tools title and close icon
- Tab Organizer section with description and action
- Divider
- File Converters section with five bordered rows
- Decorative pet icon on larger screens

### Audit observations

- The panel uses `workspace-shadow`, which is currently undefined.
- The header background differs from the main panel and should be retained only if it matches the Stitch source consistently.
- The Tab Organizer and converter actions appear functional but have no behavior.
- Converter rows are a strong candidate for a shared list-row primitive.
- The chevron uses a border color as its default icon color, which may be too low contrast.

### Implementation plan

1. Preserve the wider utility workspace and two-section hierarchy.
2. Apply the shared workspace panel border, radius, and shadow.
3. Normalize header height, title alignment, close-button size, and header surface color.
4. Keep Tab Organizer as the first section and preserve its primary green action.
5. Standardize the divider against the global border token.
6. Extract converter rows into the shared list-row treatment.
7. Keep leading icons, labels, and trailing chevrons aligned to a fixed row height.
8. Improve default chevron contrast while preserving its secondary status.
9. Give all rows consistent hover and keyboard focus surfaces.
10. Make unavailable actions visually honest if functionality remains outside scope.
11. Define the pet decoration through the shared decorative-element rule or remove it.

### Responsive behavior

- Mobile: make the panel full-width within safe padding and allow utility text to wrap.
- Desktop: retain the wider panel and generous section spacing.
- Ensure the converter list does not become horizontally scrollable.

### Acceptance criteria

- Tools, Calendar, and Settings share a coherent major-panel treatment.
- Converter rows have consistent height, alignment, and state styling.
- Primary and secondary actions are visually distinct.

## Settings

Reference: `entrypoints/newtab/pages/Settings/Settings.tsx`

### Current composition

- Large split settings panel
- Desktop sidebar with eight categories
- Mobile header
- Appearance content section
- Theme previews
- Accent color choices
- Typography selects
- Interface effect sliders
- Generic “coming soon” content for other sections

### Audit observations

- Settings is the most complex page and has its own panel geometry, navigation, and form rules.
- The fixed `716px` height is not safe for all viewport sizes.
- Sidebar selected state, form controls, preview cards, and sliders each use separate local styling.
- The Dark option changes selection state without changing the application appearance.
- Selects rely on visually overlaid icons and need careful focus/contrast validation.

### Implementation plan

1. Preserve the desktop sidebar/content split and mobile header transformation.
2. Make the major panel height responsive to viewport space while maintaining an internal scroll region.
3. Reuse the global workspace panel surface and shadow.
4. Normalize sidebar width, navigation row height, icon size, selected background, and selected text color.
5. Keep Appearance as the primary implemented section.
6. Normalize section heading spacing and the 32px section rhythm.
7. Keep light/dark previews visually distinct, but ensure the controls clearly communicate whether they are previews or live theme changes.
8. Standardize accent swatch size, selected ring, ring offset, and keyboard focus.
9. Normalize select height, padding, border, radius, arrow placement, and focus treatment.
10. Preserve sliders but standardize track thickness, thumb visibility, value alignment, and focus state.
11. Keep “coming soon” sections quiet and structured, using the same icon, heading, body, and spacing hierarchy.
12. Remove the empty pet decoration or implement it consistently with the rest of the application.

### Responsive behavior

- Mobile: hide the sidebar as currently intended, retain the mobile settings header, and make content full width.
- Tablet: verify whether the split layout has enough width; collapse earlier if the content becomes cramped.
- Desktop: maintain the two-column settings workspace and internal content scrolling.
- Short viewport: avoid fixed-height clipping and keep the mobile/desktop panel above the dock.

### Acceptance criteria

- Sidebar and content align to a stable internal grid.
- All form controls share one visual language.
- The settings panel does not clip or hide content on short screens.
- Focus states are visible for radios, swatches, selects, sliders, and navigation buttons.

## Calendar

Reference: `entrypoints/newtab/pages/Calendar/Calendar.tsx`

### Current composition

- Bounded calendar workspace
- Calendar title header
- Date/navigation toolbar
- Scrollable time grid from 7:00 to 17:00
- Event blocks with color-coded borders and surfaces
- Current-time indicator
- Decorative pet icon on desktop

### Audit observations

- The calendar uses a distinctive larger workspace and should remain wider than the card pages.
- `workspace-shadow` is undefined.
- The desktop panel height and mobile `h-full` behavior need viewport testing.
- The toolbar can become crowded on narrow widths.
- Event styling is tied to numeric IDs and dynamic typography classes.
- The current-time line may be rendered outside the visible grid when the current time is outside the hardcoded range.
- The event border class is inconsistent: some events include `border` through the color string, while others rely on border color alone.

### Implementation plan

1. Preserve the bounded calendar panel and two-level header structure.
2. Apply the shared major workspace surface, border, radius, and shadow.
3. Normalize title header height and toolbar spacing.
4. Keep Today and previous/next controls as secondary compact actions.
5. Make toolbar controls wrap or compress predictably on mobile without losing labels or accessible names.
6. Define explicit event variants for green, blue, neutral, and purple events.
7. Replace dynamic Tailwind typography construction with explicit class mappings.
8. Standardize event block padding, radius, border width, title size, metadata size, and hover state.
9. Preserve the horizontal grid lines, time labels, and current-time indicator.
10. Ensure the current-time indicator is handled gracefully outside the visible schedule range.
11. Keep the scrollable grid and bottom safe area so the dock does not obscure events.
12. Define or remove the decorative pet treatment consistently.

### Responsive behavior

- Mobile: allow the calendar body to scroll horizontally or compress according to the Stitch reference, but never clip event labels unexpectedly.
- Desktop: retain the bounded centered panel with internal vertical scrolling.
- Short viewport: use available height rather than forcing an oversized panel.

### Acceptance criteria

- Event blocks render with reliable typography classes and consistent borders.
- Toolbar remains usable at mobile widths.
- The panel shadow and surface match Tools and Settings.
- Calendar content remains accessible above the fixed dock.

## Cross-Page Visual Rules

### Layout

- Use one shared outer page container.
- Use documented narrow, medium, and wide workspace widths.
- Use consistent horizontal padding at mobile and desktop breakpoints.
- Reserve explicit space for the fixed bottom dock.
- Avoid unrelated page-specific `pt-*` and `pb-*` values when a shared safe-area rule can express the same intent.

### Typography

- Keep Inter and the existing semantic font names.
- Preserve the current compact body size and metadata scale.
- Use one page-title style, one section-title style, one body style, one label style, and one caption style.
- Keep the timer value as the largest numeric display.
- Avoid introducing a new display font or a new typography direction.

### Color

- Use the warm off-white canvas consistently.
- Use white for elevated primary surfaces.
- Use pale surface variants for nested and selected regions.
- Use muted green as the primary action/accent.
- Preserve the existing pastel blue, pink, purple, and orange accents.
- Ensure metadata and low-emphasis labels remain readable against their surfaces.

### Borders and radii

- Use one subtle border color for most surfaces and dividers.
- Use a limited radius scale for workspace panels, nested controls, and pills.
- Keep circular controls circular and avoid mixing arbitrary radius values without a visual reason.

### Shadows

- Define one major workspace shadow.
- Define one restrained nested/hover shadow.
- Avoid adding heavy layered shadows that conflict with the existing quiet visual language.

### Interaction states

- Every interactive control needs default, hover, focus-visible, active, and disabled/unavailable states where applicable.
- Keep hover changes subtle: surface shift, accent shift, or modest shadow change.
- Keep active feedback compact and tactile, consistent with the existing `active:scale-95` language.
- Never rely on color alone to communicate selected or focused state.

### Accessibility

- Use accessible names for icon-only buttons.
- Preserve visible keyboard focus.
- Maintain readable contrast for body text, labels, borders, and controls.
- Keep touch targets at least 44px where practical.
- Ensure checkbox, radio, select, range, and button states are perceivable without hover.
- Respect reduced-motion preferences for the pet animation and transitions.

## Systematic Implementation Order

1. Confirm the Stitch reference at desktop and mobile sizes before changing visual values.
2. Record the current rendered baselines for all seven pages.
3. Consolidate global colors, typography, spacing, radii, borders, and shadows without changing the visual direction.
4. Create the shared surface, workspace, heading, button, icon-button, list-row, and form-control rules.
5. Fix critical rendering issues: missing shadow, Pomodoro ring color, dynamic Calendar classes, and mobile dock density.
6. Refactor the shared shell and navigation spacing.
7. Implement Home as the baseline page and verify it against the Stitch source.
8. Apply the shared card rules to Pomodoro, Weekly Goal, and Focus Mode.
9. Apply the shared major-panel and list-row rules to Tools and Calendar.
10. Refine Settings’ split layout and form controls.
11. Normalize responsive behavior across all pages.
12. Add focus, unavailable, empty, loading, and error visual states without expanding functionality.
13. Remove redundant CSS only after visual output is confirmed unchanged.
14. Run typecheck, lint if available, and production build verification.
15. Perform a final visual regression pass at narrow mobile, tablet, laptop, and wide desktop widths.

## Verification Checklist

### Desktop

- Home, Pomodoro, Weekly Goal, Focus Mode, Tools, Settings, and Calendar align to the same outer grid.
- Major panels share the intended border, radius, surface, and shadow.
- Typography hierarchy remains consistent across pages.
- Fixed navigation does not cover content.
- Hover and focus states are visible and restrained.

### Mobile

- No horizontal page overflow.
- Bottom dock remains usable and does not collide with clock/weather content.
- Cards and panels fit within the viewport with safe horizontal padding.
- Long task, goal, event, and converter labels wrap correctly.
- Settings content remains scrollable and does not clip.
- Calendar toolbar and event content remain usable.

### Rendering and code quality

- `workspace-shadow` renders where used.
- Pomodoro inactive ring has a valid visible stroke.
- Calendar typography is generated reliably by Tailwind.
- No empty decorative containers remain without an intentional visual role.
- Icon-only actions have accessible names.
- Focus-visible states are present.
- `npx tsc --noEmit` or the project’s equivalent typecheck passes.
- `npx wxt build` completes successfully.
