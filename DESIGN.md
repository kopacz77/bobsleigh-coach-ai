---
version: alpha
name: "Bobsleigh Coach AI"
description: "Performance-focused design system for AI-powered athletic coaching"

colors:
  primary: "#1971C2"
  secondary: "#2B8A3E"
  tertiary: "#E8590C"
  neutral: "#F8F9FA"
  surface: "#FFFFFF"
  on-surface: "#212529"
  error: "#E03131"

typography:
  headline-display:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 36px
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 30px
    fontWeight: 600
    lineHeight: 1.2
  headline-md:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.3
  body-lg:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
  label-lg:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.02em
  label-md:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif
    fontSize: 10px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.04em

rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px

components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.md}"
    padding: 12px
  button-primary-hover:
    backgroundColor: "#1864AB"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 20px
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 12px
    height: 44px
---

## Overview

Bobsleigh Coach AI is a professional athletic coaching tool designed for real-world gym and training environments. The design system prioritizes:

- **Readability at distance**: Athletes check their phone mid-set, often at arm's length with sweaty hands. Text must be large enough to read at 50-80cm. Touch targets must be generous.
- **Data clarity**: Training load charts, readiness scores, and performance metrics are the core of the product. Data visualization uses clear color coding with sufficient contrast.
- **Professional authority**: Coaches trust tools that look professional. The aesthetic is clean, confident, and utilitarian -- not playful or decorative.
- **All-hours usability**: Athletes train at 5 AM and 10 PM. Dark mode follows system preference to reduce eye strain in low-light environments.

The visual direction draws from professional sports analytics tools: think Catapult, Polar Flow, and TrainingPeaks. Clean layouts, purposeful color, restrained use of decoration.

## Colors

The palette is built around three functional roles:

**Primary -- Steel Blue (#1971C2)**: A confident, athletic blue that conveys precision and trust. Used for navigation, primary actions, and active states. Blue is the most universally trusted color in professional software and avoids gender or team-color bias in a coaching context.

**Secondary -- Forest Green (#2B8A3E)**: Represents positive outcomes: good readiness, completed workouts, met targets. Green is universally understood as "good" in training contexts.

**Tertiary -- Burnt Orange (#E8590C)**: Used for warnings, elevated attention states, and high-intensity indicators. Orange sits between green (good) and red (danger) on the alert spectrum.

**Semantic colors for training context**:
- Readiness: Green (#2B8A3E) for fresh/recovered, Yellow (#E8590C) for moderate fatigue, Red (#E03131) for high fatigue or concern
- TSB thresholds: Green (TSB > 0), Yellow (TSB -10 to 0), Red (TSB < -10)
- Injury risk: Green (< 0.3), Yellow (0.3-0.6), Red (>= 0.6)

**Dark mode**: The neutral and surface colors invert. Surface becomes #1A1B1E, on-surface becomes #C1C2C5. Primary, secondary, and tertiary colors lighten slightly for legibility on dark backgrounds. Mantine handles this automatically via its color scheme system.

## Typography

Inter is the primary typeface, falling back to the system font stack. Inter was designed specifically for computer screens and has excellent legibility at small sizes -- critical when athletes glance at their phone between sets.

**Scale rationale**:
- Display (36px): Page titles only, used sparingly
- H1 (30px): Section headers
- H2 (24px): Card headers, major sections
- Body (16px): Primary reading size, comfortable at arm's length
- Small (14px): Secondary information, labels, metadata

**Gym-distance rule**: No text smaller than 14px in workout-active views. Athletes cannot read 10-12px text when their phone is propped up during a set. The 14px minimum applies to exercise names, set/rep counts, and weight values.

## Layout

Mobile-first, single-column layout for the primary workout experience. Desktop adds a persistent sidebar for navigation.

**Touch targets**: Minimum 44px height for all interactive elements in workout views. This follows Apple HIG and WCAG 2.5.8 target size guidelines. Buttons in the workout logger are even larger (48-56px) because athletes interact with wet or gloved hands.

**Spacing scale**: Uses a 4px base unit. The most common spacing values are 8px (tight grouping), 16px (standard separation), and 24px (section separation). Cards use 20px internal padding for breathing room.

**Responsive breakpoints** (Mantine defaults):
- xs: 576px (large phones)
- sm: 768px (tablets -- navbar becomes persistent)
- md: 992px (small laptops)
- lg: 1200px (desktops)

The navigation sidebar collapses to a hamburger menu below the sm breakpoint. On mobile, the full viewport width is used for content.

## Elevation & Depth

Minimal elevation hierarchy. Flat design with subtle shadows to distinguish layers:

- **Level 0**: Page background (no shadow)
- **Level 1**: Cards and content containers (0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1))
- **Level 2**: Dropdown menus, popovers (0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06))
- **Level 3**: Modals and dialogs (0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05))

In dark mode, shadows are less visible. Elevation is supplemented by subtle border (1px solid rgba(255,255,255,0.06)) on Level 1 and Level 2 elements.

## Shapes

Border radius follows a purpose-driven scale:

- **Buttons**: 8px (md) -- professional, not too rounded
- **Cards**: 12px (lg) -- soft enough to feel modern, sharp enough to feel serious
- **Inputs**: 8px (md) -- matching buttons for visual consistency
- **Badges/pills**: 9999px (full) -- fully rounded for status indicators
- **Modals**: 12px (lg) -- matching cards

The overall feel is "rounded but not bubbly." Sports coaching software should feel authoritative, not playful.

## Components

### Cards
Cards are the primary content container. Every dashboard widget, workout day, exercise detail, and metric display lives in a card.
- Default padding: 20px
- Default radius: 12px (lg)
- Default shadow: Level 1 (subtle)
- No borders in light mode; subtle border in dark mode

### Buttons
- Primary: Steel blue background, white text. Used for main actions (Start Workout, Generate Plan, Approve)
- Secondary: Transparent with blue text and subtle border. Used for secondary actions (Cancel, View Details)
- Danger: Red background for destructive actions (Reject Plan, Remove Athlete)
- Size: Default "md" for desktop, "lg" for mobile workout views
- Minimum height: 44px in all contexts

### Inputs
- Height: 44px minimum (generous for mobile)
- Radius: 8px
- Clear labels above inputs (not floating labels -- harder to read at distance)
- Error states use red border and helper text below

### Data Tables
- Alternating row backgrounds for scan-ability
- Sticky headers on scroll
- Minimum row height: 44px
- Sortable columns indicated by subtle icon

### Charts (Recharts)
- PMC chart uses: Blue for CTL (fitness), Orange for ATL (fatigue), Green for TSB (form)
- Consistent axis formatting with Intl.DateTimeFormat
- Tooltip on hover/touch with exact values
- Responsive: full width, height scales with viewport

## Do's and Don'ts

**Do:**
- Use the semantic color system for readiness/risk indicators (green/yellow/red)
- Maintain 44px minimum touch targets in workout views
- Keep text at 14px or larger in workout-active screens
- Use cards to group related information
- Provide visual feedback for all interactions (hover, active, loading states)
- Use the spacing scale consistently (multiples of 4px)

**Don't:**
- Use decorative illustrations or animations in data views
- Mix semantic colors (do not use green for a warning or red for a positive state)
- Use thin fonts (below weight 400) for any text an athlete reads mid-workout
- Add unnecessary borders or dividers when spacing provides sufficient separation
- Use more than 3 levels of elevation on a single screen
- Override Mantine's built-in dark mode color handling with manual color values
