# Design System Documentation

## Modern Card-Based UI with Gradient Accents

This document outlines the visual styling and design patterns used in this project. These patterns create a cohesive, modern, and professional look and feel that can be applied to other projects.

---

## 🎨 Design Philosophy

**Core Principles:**

- **Card-Based Layout**: Content is organized in distinct, elevated cards
- **Gradient Accents**: Subtle gradients add depth and visual interest
- **Smooth Micro-interactions**: Hover effects and transitions create engaging experiences
- **Layered Depth**: Shadows and borders create a sense of hierarchy
- **Consistent Spacing**: Uniform padding and margins throughout
- **Modern Aesthetics**: Rounded corners, soft shadows, and clean lines

---

## 📦 Card Design Pattern

### Base Card Structure

```tsx
<div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group relative overflow-hidden">
  {/* Background gradient overlay (optional) */}
  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  {/* Content */}
  <div className="relative z-10">{/* Card content here */}</div>
</div>
```

### Key Card Properties:

- **Padding**: `p-8` (32px) - generous padding for breathing room
- **Border Radius**: `rounded-2xl` (16px) - modern, soft corners
- **Shadow**: `shadow-lg` base, `hover:shadow-2xl` on hover
- **Border**: `border border-gray-100` - subtle definition
- **Hover Effect**: `hover:-translate-y-2` - lifts card on hover
- **Transition**: `transition-all duration-300` - smooth animations

---

## 🎯 Icon Design Pattern

### Gradient Icon Containers

```tsx
<div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
  <Icon className="w-6 h-6" />
</div>
```

### Icon Properties:

- **Size**: `w-12 h-12` (48px) - standard icon container
- **Border Radius**: `rounded-xl` (12px) - slightly less rounded than cards
- **Gradient**: `bg-gradient-to-br` (bottom-right gradient)
- **Shadow**: `shadow-lg` - adds depth
- **Hover**: `group-hover:scale-110 group-hover:rotate-3` - subtle scale and rotation
- **Icon Size**: `w-6 h-6` (24px) inside container

### Gradient Color Variations:

- Blue: `from-blue-500 to-blue-600`
- Green: `from-green-500 to-emerald-600`
- Orange: `from-orange-500 to-red-600`
- Purple: `from-purple-500 to-indigo-600`
- Yellow/Accent: `from-accent to-yellow-600`
- Teal: `from-teal-500 to-cyan-600`
- Pink: `from-pink-500 to-rose-600`

---

## 🌈 Gradient Usage Patterns

### 1. Background Overlays (Subtle)

```tsx
<div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
```

- **Opacity**: Very low (5%) for subtle effect
- **Reveal**: Appears on hover
- **Purpose**: Adds depth without overwhelming content

### 2. Icon Backgrounds (Bold)

```tsx
<div className="bg-gradient-to-br from-blue-500 to-blue-600" />
```

- **Opacity**: Full (100%)
- **Purpose**: Creates visual focal points
- **Direction**: Bottom-right (`to-br`) for natural light effect

### 3. Text Gradients

```tsx
<div className="bg-gradient-to-r from-accent to-yellow-600 bg-clip-text text-transparent">
  Text Content
</div>
```

- **Technique**: `bg-clip-text` with `text-transparent`
- **Purpose**: Eye-catching headings or numbers

---

## ✨ Hover Effects & Animations

### Card Hover Pattern

```tsx
className = "hover:shadow-2xl hover:-translate-y-2 transition-all duration-300";
```

- **Shadow**: Increases from `shadow-lg` to `shadow-2xl`
- **Transform**: Lifts up by 8px (`-translate-y-2`)
- **Duration**: 300ms for smooth feel

### Icon Hover Pattern

```tsx
className =
  "group-hover:scale-110 group-hover:rotate-3 transition-all duration-300";
```

- **Scale**: 110% (10% larger)
- **Rotation**: 3 degrees (subtle tilt)
- **Group**: Uses parent's hover state

### Button Hover Pattern

```tsx
className = "hover:shadow-xl hover:scale-105 transition-all duration-300";
```

- **Shadow**: Enhanced shadow
- **Scale**: 105% (5% larger)
- **Duration**: 300ms

---

## 📐 Spacing System

### Padding Scale:

- **Small**: `p-4` (16px) - compact components
- **Medium**: `p-6` (24px) - standard cards
- **Large**: `p-8` (32px) - main content cards (most common)

### Gap Scale:

- **Tight**: `gap-2` (8px) - related items
- **Standard**: `gap-4` (16px) - form fields, list items
- **Wide**: `gap-6` (24px) - card grids
- **Extra Wide**: `gap-8` (32px) - section spacing

### Margin Scale:

- **Section Spacing**: `py-16` (64px vertical) - between major sections
- **Subsection**: `mb-12` (48px) - between subsections
- **Element**: `mb-6` (24px) - between related elements
- **Tight**: `mb-3` (12px) - between closely related items

---

## 🎭 Shadow System

### Shadow Hierarchy:

1. **None**: `shadow-none` - flat elements
2. **Small**: `shadow-md` - subtle elevation
3. **Medium**: `shadow-lg` - standard cards (most common)
4. **Large**: `shadow-xl` - hover states, buttons
5. **Extra Large**: `shadow-2xl` - prominent hover states

### Shadow with Hover:

```tsx
className = "shadow-lg hover:shadow-2xl transition-shadow duration-300";
```

---

## 🔲 Border Radius System

### Radius Scale:

- **Small**: `rounded-md` (6px) - buttons, inputs
- **Medium**: `rounded-lg` (8px) - small cards, badges
- **Large**: `rounded-xl` (12px) - icon containers, medium cards
- **Extra Large**: `rounded-2xl` (16px) - main content cards (most common)
- **Full**: `rounded-full` - circular elements (avatars, dots)

---

## 📝 Typography Patterns

### Heading Hierarchy:

```tsx
// Page Title
className = "text-4xl md:text-5xl font-heading font-bold";

// Section Title
className = "text-3xl md:text-4xl font-heading font-bold";

// Subsection Title
className = "text-2xl font-heading font-bold";

// Card Title
className = "text-xl font-heading font-semibold";
```

### Text Sizes:

- **Large**: `text-lg` (18px) - important paragraphs
- **Base**: `text-base` (16px) - body text
- **Small**: `text-sm` (14px) - secondary text, captions
- **Extra Small**: `text-xs` (12px) - labels, metadata

### Text Colors:

- **Primary**: `text-primary` - main text
- **Muted**: `text-muted` - secondary text
- **Accent**: `text-accent` - highlights, links
- **White**: `text-white` - on dark backgrounds

---

## 🎬 Transition Patterns

### Standard Transitions:

```tsx
// All properties, smooth
className = "transition-all duration-300";

// Specific property
className = "transition-colors duration-300";
className = "transition-transform duration-300";
className = "transition-opacity duration-300";
className = "transition-shadow duration-300";
```

### Timing:

- **Fast**: `duration-200` (200ms) - quick feedback
- **Standard**: `duration-300` (300ms) - most common
- **Slow**: `duration-500` (500ms) - deliberate animations
- **Very Slow**: `duration-700` (700ms) - navbar transitions

### Easing:

- **Default**: `ease-in-out` - smooth start and end
- **Ease Out**: `ease-out` - quick start, slow end
- **Ease In**: `ease-in` - slow start, quick end

---

## 🎨 Color Usage Patterns

### Background Colors:

- **White**: `bg-white` - card backgrounds
- **Light Gray**: `bg-background` - section backgrounds
- **Gradient**: `bg-gradient-to-br from-X to-Y` - accents

### Border Colors:

- **Subtle**: `border-gray-100` - card borders
- **Accent**: `border-accent/20` - highlighted borders
- **White**: `border-white/20` - on dark backgrounds

### Text on Hover:

```tsx
className = "group-hover:text-accent transition-colors";
```

---

## 📱 Responsive Patterns

### Breakpoint Strategy:

- **Mobile First**: Base styles for mobile
- **Tablet**: `md:` prefix (768px+)
- **Desktop**: `lg:` prefix (1024px+)

### Common Responsive Patterns:

```tsx
// Grid columns
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

// Text sizes
className = "text-2xl md:text-3xl lg:text-4xl";

// Padding
className = "p-4 md:p-6 lg:p-8";

// Visibility
className = "hidden md:block"; // Hide on mobile, show on desktop
className = "block md:hidden"; // Show on mobile, hide on desktop
```

---

## 🎯 Component-Specific Patterns

### Service/Feature Cards:

- Icon with gradient background
- Title with hover color change
- Description text
- Full card hover lift effect

### Testimonial Cards:

- Quote icon in gradient container
- Client photo with ring border
- Quote text with proper line height
- Client info at bottom

### Project Cards:

- Image with hover scale effect
- Category badge
- Title with hover color change
- Location with icon
- Gradient overlay on hover

### Stats/Numbers:

- Large gradient text
- Animated counter (0 to target)
- Label below
- Card with hover effect

---

## 🔄 Animation Patterns

### Counter Animation:

- Uses `IntersectionObserver` to trigger
- `requestAnimationFrame` for smooth counting
- Ease-out easing function
- 2-second duration

### Scroll-Based Animations:

- Navbar transparency based on scroll position
- Smooth transitions over 200px scroll distance
- Progress calculation: `Math.min(scrollPosition / maxScroll, 1)`

### Carousel Animations:

- Transform-based sliding
- 700ms duration for smooth feel
- Auto-play with configurable interval

---

## 🎪 Layout Patterns

### Container Pattern:

```tsx
<div className="container mx-auto px-4">{/* Content */}</div>
```

### Section Pattern:

```tsx
<section className="py-16 bg-background">
  <div className="container mx-auto px-4">
    <h2 className="text-3xl font-heading font-bold text-center mb-12">
      Section Title
    </h2>
    {/* Content */}
  </div>
</section>
```

### Card Grid Pattern:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {/* Cards */}
</div>
```

---

## 💡 Best Practices

1. **Consistency**: Always use the same padding, border radius, and shadow values for similar components
2. **Group Hover**: Use `group` class on parent and `group-hover:` on children for coordinated effects
3. **Z-Index**: Use `relative z-10` for content above gradient overlays
4. **Overflow**: Use `overflow-hidden` on cards to contain rounded corners and hover effects
5. **Accessibility**: Maintain proper contrast ratios and focus states
6. **Performance**: Use `transition-all` sparingly; prefer specific properties
7. **Responsive**: Always test on mobile, tablet, and desktop breakpoints

---

## 🚀 Quick Reference

### Create a New Card:

```tsx
<div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
  <div className="relative z-10">{/* Your content */}</div>
</div>
```

### Create an Icon Container:

```tsx
<div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
  <Icon className="w-6 h-6" />
</div>
```

### Create a Button:

```tsx
<button className="bg-gradient-to-r from-accent to-yellow-600 text-primary px-8 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105">
  Button Text
</button>
```

---

## 📚 Summary

This design system creates a **modern, professional, and engaging** user interface through:

- **Elevated cards** with soft shadows and rounded corners
- **Gradient accents** for visual interest and depth
- **Smooth micro-interactions** that respond to user actions
- **Consistent spacing** that creates visual rhythm
- **Layered depth** through shadows and borders
- **Responsive design** that works on all devices

The key is **consistency** - using the same patterns, spacing, and effects throughout creates a cohesive and polished look and feel.
