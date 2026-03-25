# High-Tech Cartography: A Design System Document

## 1. Overview & Creative North Star: "The Digital Pathfinder"
The Creative North Star for this design system is **The Digital Pathfinder**. This system moves away from the cluttered, "gamey" aesthetics of traditional geography apps and instead adopts the persona of a high-end, orbital surveillance interface. 

It is characterized by **Technical Elegance**: an intentional blend of minimalist space and dense, data-rich overlays. We break the "template" look by using asymmetric layouts—where maps bleed off-canvas—and overlapping technical modules that feel like a head-up display (HUD). The experience should feel like a state-of-the-art tool for an elite explorer, where every pixel serves a tactical purpose.

---

## 2. Color & Surface Architecture
The palette is rooted in the depth of the cosmos, using varying tones of indigo to create a sense of infinite scale, punctuated by high-frequency electric accents.

### The "No-Line" Rule
To maintain a "state-of-the-art" feel, **1px solid borders are strictly prohibited** for sectioning. Structural definition must be achieved through:
- **Tonal Transitions:** Placing a `surface_container_low` card against a `surface` background.
- **Negative Space:** Using the Spacing Scale (specifically `8`, `10`, and `12`) to create breathing room that defines boundaries.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the surface-container tiers to create "nested" depth.
- **Base Level:** `surface` (#111225) for the primary application background.
- **Primary Modules:** `surface_container` (#1d1e32) for main gameplay panels.
- **Interactive Insets:** `surface_container_highest` (#323348) for high-priority interactive zones or nested data readouts.

### The "Glass & Gradient" Rule
For floating HUD elements (like coordinates or timers), use **Glassmorphism**. Apply a 20-40px `backdrop-blur` and set the background to `surface_container_low` at 70% opacity. 
- **Signature Textures:** Use a subtle linear gradient from `primary_container` (#3340ca) to `primary` (#bdc2ff) for high-impact CTAs to simulate the glow of a backlit instrument panel.

---

## 3. Typography: Technical Precision
**EXCLUSIVELY Space Grotesk** — no other font anywhere.

- **All text (Space Grotesk):** Headlines, body, labels, buttons, inputs, timers — everything. The geometric, slightly quirky letterforms give GeoCheckr its distinct high-tech identity.
- **Weights:** Regular (400), Medium (500), SemiBold (600), Bold (700).
- **Labels (Space Grotesk):** Mono-spaced-like appearance for coordinates (Lat/Long) and technical metadata.

*Director's Tip: Use `label_sm` in all caps with a tracking (letter-spacing) of 0.1rem for secondary technical data to mimic architectural blueprints.*

---

## 4. Elevation & Depth
Depth in this system is an atmospheric effect, not a structural one.

- **The Layering Principle:** Avoid shadows for static UI. Instead, "stack" surface tiers. A `surface_container_lowest` button on a `surface_container_high` panel creates a sophisticated "recessed" look.
- **Ambient Shadows:** Only use shadows for high-elevation floating modals. Use a blur of 32px, 0px offset, and 6% opacity using a color derived from `on_surface` to simulate a soft glow rather than a dark drop shadow.
- **The "Ghost Border" Fallback:** If a divider is essential for accessibility, use `outline_variant` (#454654) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons & Navigation
- **Primary Action:** Solid `primary_container` (#3340ca) with `on_primary_container` text. Use `DEFAULT` (0.25rem) roundedness for a sharp, technical feel.
- **Secondary Action:** Ghost style. No background, `outline` color for text, and a `Ghost Border` (15% opacity `outline_variant`) that becomes 40% on hover.
- **Success/Checked State:** For 'correct' guesses or 'checked' items, use `tertiary` (Electric Lime: #a6d700). This high-contrast pop against the indigo base provides instant dopamine.

### Input & Search
- **Input Fields:** Use `surface_container_lowest`. Forbid borders; use a 2px bottom-accent of `primary` only when the field is focused.
- **Data Chips:** Small, high-density tags using `surface_container_highest`. Use `label_sm` for content.

### Maps & Layouts
- **The HUD Card:** Game info cards should not have dividers. Use `Spacing 4` between data points and background shifts to group related information.
- **Progress Indicators:** Use thin (2px) lines with gradients from `primary` to `tertiary` to show journey progression.

### Compass & Orientation (Custom)
- A bespoke circular component using `outline` at 20% opacity. The needle should use a `primary` to `tertiary` gradient to indicate "True North."

---

## 6. Do's and Don'ts

### Do
- **Do** lean into asymmetry. A panel on the left doesn't always need a twin on the right.
- **Do** use the Spacing Scale rigorously. High-tech doesn't mean "cramped"; it means "organized."
- **Do** use `tertiary` (Electric Lime) sparingly. It is a precision tool for success states, not a decorative color.

### Don't
- **Don't** use standard #000000 shadows. It kills the "Deep Space" indigo atmosphere.
- **Don't** use rounded corners above `xl` (0.75rem). Stay within `sm` to `md` for most components to maintain a serious, technical edge.
- **Don't** use divider lines between list items. Use a background shift from `surface_container` to `surface_container_high` on hover to define the row.
- **Don't** use standard blue/red for success/error. Stick to the brand's `tertiary` for success and the defined `error` (#ffb4ab) for failures.