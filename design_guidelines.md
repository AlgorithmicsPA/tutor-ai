# Design Guidelines: Tutor IA MVP

## Design Approach: Material Design Foundation with Educational Adaptations

**Selected Approach:** Design System (Material Design) adapted for child-friendly educational experiences  
**Rationale:** Educational platforms prioritize clarity, accessibility, and consistent learning patterns over visual novelty. Material Design's emphasis on clear hierarchy, responsive layouts, and comprehensive component patterns aligns perfectly with learning-focused applications.

**Key Design Principles:**
1. **Clarity Over Decoration** - Every visual element supports learning goals
2. **Gentle Guidance** - Visual cues guide learners through content without overwhelming
3. **Encouraging Feedback** - Interactive elements provide clear, positive reinforcement
4. **Consistent Patterns** - Predictable layouts reduce cognitive load for young learners

---

## Typography System

**Font Families (Google Fonts CDN):**
- Primary: 'Inter' (clean, highly legible for UI elements and body text)
- Display: 'Fredoka' (friendly, rounded for headings and tutor messages - appropriate for children)

**Hierarchy:**
- **Lesson Titles:** text-3xl md:text-4xl, font-bold (Fredoka)
- **Section Headings:** text-xl md:text-2xl, font-semibold (Fredoka)
- **Tutor Messages:** text-lg, font-medium, leading-relaxed (Inter)
- **Questions/Prompts:** text-base md:text-lg, font-semibold (Inter)
- **Body Content:** text-base, leading-relaxed (Inter)
- **UI Labels:** text-sm, font-medium (Inter)
- **Metadata:** text-xs md:text-sm, opacity-75 (Inter)

---

## Layout System

**Spacing Primitives (Tailwind units):**
- **Core spacing set:** 2, 3, 4, 6, 8, 12, 16
- **Component padding:** p-4 for cards, p-6 for larger containers
- **Section spacing:** space-y-6 for tight groupings, space-y-8 for distinct sections
- **Page margins:** px-4 md:px-6 lg:px-8, max-w-4xl mx-auto for lesson content

**Layout Patterns:**

**Main Lesson Container:**
- max-w-4xl mx-auto (optimal reading width for educational content)
- px-4 md:px-6 (responsive horizontal padding)
- py-8 md:py-12 (vertical breathing room)

**Lesson Timeline Flow:**
- Vertical stack with space-y-6
- Each timeline item is a distinct card component
- Progressive disclosure: content reveals as learner scrolls

**Chat Interface:**
- Fixed or sticky positioning at bottom on mobile (space-y-3)
- Sidebar panel on desktop (w-80 md:w-96)
- Message bubbles with max-w-prose for readability

---

## Component Library

### Navigation & Header
**Top Navigation Bar:**
- h-16, sticky top-0, backdrop-blur-sm
- Flex layout: logo/title (left), provider selector (center), user menu (right)
- Provider selector: Compact dropdown with clear labels, p-2 rounded-lg
- No heavy branding - focus on functionality

### Lesson Content Components

**Tutor Message Card (tutor_say):**
- Rounded corners: rounded-2xl
- Padding: p-5 md:p-6
- Emoji/avatar on left (text-2xl), message on right (flex gap-3)
- Shadow: shadow-sm for gentle elevation
- Border: border-2 for friendly definition

**Image Display (show_image):**
- rounded-xl for softer edges
- shadow-md for depth
- w-full, max-h-96 object-cover (prevent distortion)
- Optional caption below with text-sm, text-center, pt-2

**Quiz Widget:**
- Container: rounded-2xl, p-6, space-y-4
- Question: font-semibold, mb-4
- Choice buttons: Full-width stack (space-y-2), rounded-xl, p-4, text-left
- Choice states: border-2 (default), selected state with scale transform
- Feedback panel: mt-4, rounded-lg, p-4 (shows after submission)
- Submit button: w-full, py-3, rounded-xl, font-semibold

**Interactive Widgets (OrderSteps):**
- Drag items: rounded-xl, p-4, cursor-move
- Drop zone indicators: dashed border, rounded-xl, min-h-16
- Drag handle: Visual indicator on left (⋮⋮)
- Active drag state: opacity-50, scale-105

**Reflection Prompt:**
- Bordered panel: border-l-4, pl-6, py-4
- Italic text for thoughtful tone
- Icon prefix (💭) for visual recognition
- Optional text area for responses: rounded-lg, p-3, w-full

### Chat Interface (Profe DANA)

**Chat Container:**
- rounded-2xl border panel
- Header: p-4, border-b, flex (avatar + name)
- Message area: p-4, space-y-3, max-h-96, overflow-y-auto
- Input area: p-3, border-t

**Message Bubbles:**
- User messages: ml-auto, max-w-xs md:max-w-md, rounded-2xl, p-3, text-sm
- Assistant messages: mr-auto, max-w-xs md:max-w-md, rounded-2xl, p-3, text-sm
- Time stamps: text-xs, opacity-60, mt-1

**Input Field:**
- rounded-xl, px-4, py-3, w-full
- Focus ring: ring-2, ring-offset-2
- Send button: Inline icon button on right

### Monaco Editor Integration
**Code Editor Widget:**
- rounded-xl overflow-hidden
- min-h-64, border-2
- Toolbar above: flex justify-between, p-2, gap-2 (language selector, run button)
- Output panel below: rounded-b-xl, p-4, space-y-2

### MathJax Display
**Math Expression Container:**
- Inline: No special container, inherit text styles
- Block: p-4, rounded-lg, my-4, overflow-x-auto

---

## Interactive Patterns

**Button States:**
- Primary actions: py-3, px-6, rounded-xl, font-semibold, transition-all duration-200
- Hover: scale-105 transform
- Active: scale-95
- Disabled: opacity-50, cursor-not-allowed

**Card Hover (Optional for lesson cards):**
- Default: shadow-sm
- Hover: shadow-lg, translate-y-[-2px]
- Transition: transition-all duration-300

**Loading States:**
- Skeleton screens for lesson content: animate-pulse, rounded-xl
- Spinner for AI responses: Centered, w-6 h-6, animate-spin

**Quiz Feedback:**
- Correct: Green checkmark icon, positive message, scale-in animation
- Incorrect: Gentle red cross, encouraging message, shake animation (subtle)
- Score display: Circular progress or simple fraction

---

## Accessibility

**Touch Targets:**
- Minimum 44px height for all interactive elements (py-3 ensures this)
- Gap between interactive elements: gap-2 minimum

**Focus States:**
- All interactive elements: ring-2, ring-offset-2 on focus
- Skip navigation link for keyboard users

**Contrast:**
- Ensure text passes WCAG AA (managed through color choices later)
- Icons paired with text labels where possible

**Screen Reader Support:**
- Semantic HTML (use button, nav, article, section tags)
- aria-labels for icon-only buttons
- Live regions for dynamic feedback (quiz results, chat messages)

---

## Animations

**Use Sparingly - Educational Focus:**
- Page transitions: None (avoid distraction)
- Card entrance: Gentle fade-in, stagger by 100ms for timeline items
- Quiz feedback: Scale-in for correct (scale-0 to scale-100), subtle shake for incorrect
- Drag-and-drop: Smooth transform on drag, spring animation on drop
- AI typing indicator: Subtle bounce on three dots

**No Animations For:**
- Background elements
- Decorative graphics
- Navigation transitions

---

## Images

**Hero Section (App Landing - if implemented):**
- Large hero image showing friendly educational setting or diverse children learning
- Image: w-full, h-64 md:h-96, object-cover, rounded-b-3xl
- Overlay gradient for text readability
- CTA buttons with backdrop-blur-md, bg-white/20 treatment

**Lesson Images:**
- Illustrative diagrams: rounded-xl, shadow-md, mx-auto, max-w-2xl
- Character avatars (Profe DANA): w-12 h-12, rounded-full for chat
- Widget icons: Inline SVG from Heroicons, w-5 h-5

**Image Descriptions:**
1. **Hero Image:** Bright, diverse classroom or children using tablets for learning - warm, inclusive atmosphere
2. **Profe DANA Avatar:** Friendly, approachable cartoon character or abstract colorful icon
3. **Lesson Illustrations:** Simple, clear diagrams supporting educational content (geometry, science concepts)

---

## Responsive Behavior

**Mobile-First Approach:**
- Base: Single column, stack all content
- md (768px): Two-column where appropriate (sidebar chat)
- lg (1024px): Full desktop layout with persistent chat panel

**Breakpoint Adjustments:**
- Chat: Bottom sheet (mobile) → Side panel (desktop)
- Quiz choices: Stack (mobile) → Optional grid for short answers (desktop)
- Monaco Editor: Full width (mobile) → Constrained width with toolbars (desktop)

This design system prioritizes learning effectiveness while maintaining a friendly, approachable aesthetic suitable for children and educators.