# DriveRent design system

## Intent

An automotive marketplace built around finding a car and understanding the rental. A photo-led opening establishes the road-trip mood, followed by quiet product cards and practical forms. Original copy, wordmark and layouts were written for DriveRent; third-party project layouts were not copied.

## Palette

| Token           | Value     | Role                                  |
| --------------- | --------- | ------------------------------------- |
| Action orange   | `#e86a32` | Primary actions and active indicators |
| Charcoal        | `#242824` | Text, dark controls                   |
| White           | `#ffffff` | Main canvas, cards, forms             |
| Neutral surface | `#f6f7f4` | Secondary sections and tables         |
| Muted text      | `#717570` | Supporting copy                       |
| Border          | `#e5e7e3` | Quiet component boundaries            |

Orange is kept to actions and useful state. Body links use darker orange `#b34718`. Olive-tinted secondary illustrations and states connect to the landscape rather than introducing a second action color. Hero overlays serve image readability, not decorative effects.

## Type and space

Use the native Avenir Next/Avenir family where available, with Segoe UI and system sans-serif fallback. No remote font request is required. Headings use tight tracking and medium weight; body copy has a 1.65 line height. Headings scale with viewport size. Reading lines stay constrained by split layouts.

The spacing scale is based on 4px: 8, 12, 16, 20, 24, 32, 40, 48, 64, 80. Desktop content is at most 1344px wide with 48px side gutters; mobile uses 18px. Major sections have 43–75px top spacing depending on width.

## Components

- Buttons: 48px default height, 7px radius. Orange primary, charcoal secondary, bordered tertiary. Labels describe the result; no decorative arrows. Mobile icon actions are at least 44×44px.
- Inputs: visible labels, 48px height, thin neutral border and 6px radius; native date/time controls for reliable keyboard/device support.
- Cards: 10–12px corners, subtle borders, mostly no shadow. Photos use fixed-height crops and correct aspect behavior. Daily prices and important status are easy to scan.
- Search: a structured form immediately below the hero, with short/long-term tabs. Rental mode changes the proposed date range; actual duration determines the price.
- Feedback: inline validation, contextual notices, no fabricated success statistics. Booking confirmation clearly identifies the demo nature.
- Dialogs: Radix portals with overlay, accessible title/description, focus management, Escape dismissal and explicit confirmation for destructive actions.
- Navigation: active underline on desktop and collapsible mobile menu. Skip-to-content link and visible focus styles.

## Responsive layout

Breakpoints: 700px, 900px, 1190px, and 1600px. Fleet cards move from three/two columns to one. The catalog sidebar expands inline on mobile. Detail booking panels become a normal-flow section. Admin tables scroll within their own wrapper and admin navigation becomes a horizontal group. All six requested target widths are covered by automated checks.

## Motion and imagery

Use short color/hover feedback and a restrained image zoom on hover; no auto-playing motion. Respect `prefers-reduced-motion`. Hero image is eager and priority-loaded. Cards load lazily. All photography is stored locally and optimized to 900px card/1800px hero images; assets total roughly 1 MB. See `ASSETS.md` for licensing and limitations.

## References

Reviewed [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) for composition/performance guidance; [Anthropic frontend design](https://github.com/anthropics/skills/tree/main/skills/frontend-design) for deliberate visual decisions; [shadcn/ui](https://github.com/shadcn-ui/ui) for accessible, owned primitives; [Magic UI](https://github.com/magicuidesign/magicui) for interaction ideas; and [CarHive](https://github.com/eduamdev/carhive) as a rental product reference only. No CarHive source, backend stack or external auth/payment integration is included.

The Anthropic frontend-design skill was installed with Codex’s official skill installer after reviewing its documented method. No third-party installation shell script was executed. Magic UI and Vercel skill packages were not installed because they were unnecessary dependencies for this implementation.

Accessibility refinement: primary buttons use the darker action shade `#c8501f` with white text; brand accents remain `#e86a32`. Compound search/sort labels explicitly retain horizontal layout after generic form label styles.
