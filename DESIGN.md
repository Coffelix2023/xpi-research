---
version: alpha
name: Terminal Minimalist TUI
description: A restrained, high-density design system and visual baseline for terminal CLI tools, TUI components, status footers, and Pi Coding Agent extensions.
colors:
  canvas: "#1E1E1E"
  ink: "#D4D4D4"
  muted: "#808080"
  rule: "#3C3C3C"
  primary: "#3B82F6"
  accent: "#4D9375"
  on-accent: "#FFFFFF"
  success: "#4EC9B0"
  warning: "#CE9178"
  error: "#F44747"
typography:
  display:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1
spacing:
  xs: 1ch
  sm: 2ch
  md: 4ch
  lg: 8ch
  xl: 12ch
rounded:
  none: 0px
  sm: 1ch
  md: 2ch
components:
  footer:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    height: 1ch
  status-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    rounded: "{rounded.none}"
  badge:
    backgroundColor: "{colors.rule}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
  box:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
  modal:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    anchor: "center"
    preferredWidth: 78
    minWidth: 40
    marginBottom: 4
  key-value:
    textColor: "{colors.ink}"
    mutedColor: "{colors.muted}"
---

## Overview

Terminal Minimalist TUI treats every character cell in the terminal as an information-dense workbench. Designed specifically for terminal command-line interfaces (CLIs), text user interfaces (TUIs), status footers, and Pi Coding Agent extensions, it emphasizes immediate legibility, non-disruptive presence, and minimal cognitive overhead.

The visual style is restrained, predictable, and functional:
- **Footers & Status Bars**: Pinned, single-line, zero-flicker components designed to inform without stealing developer focus.
- **Modals & Inspectors**: Layered diagnostic panels with clean box-drawing boundaries, structured metrics grids, and predictable keyboard dismissals (`Esc`/`Enter`/`q`).
- **Dual-Track Presentation (Optional)**: In graphical environments where native companion webview/window tools (e.g., Glimpse) are available, detailed inspectors can open in a dedicated 800×600 frameless dark micro-window, while seamlessly degrading to a centered Pi TUI modal in headless or remote SSH environments.

## Colors

The color palette is built for terminal environments with graceful degradation from 24-bit TrueColor to 256-color and standard ANSI 16-color palettes.

- **Canvas (`{colors.canvas}`)**: The default terminal dark canvas background. Never assume pure black or force bright backgrounds.
- **Ink (`{colors.ink}`)**: Primary terminal foreground for regular text, output tables, and essential messages.
- **Muted (`{colors.muted}`)**: Dimmed text for timestamps, secondary metadata, borders, and hints.
- **Rule (`{colors.rule}`)**: Hairline separators, box drawing borders, and divider lines.
- **Primary (`{colors.primary}`)**: Highlighting primary selections, active states, and focused interactive options.
- **Accent (`{colors.accent}`)**: Brand identity and subtle state indicators.
- **On-accent (`{colors.on-accent}`)**: Inverted foreground text rendered on top of solid accent or highlight blocks.
- **Success (`{colors.success}`)**: Completed operations, passes, and positive states.
- **Warning (`{colors.warning}`)**: Warnings, recoverable issues, and attention-required indicators.
- **Error (`{colors.error}`)**: Fatal errors, validation failures, and blocking issues.

### Glimpse Panel Tokens

The dual-track Glimpse micro-window does not use the terminal palette above. It carries its own two semantic token sets, supplied as shadcn-style palettes and mapped onto the panel's CSS variables:

| Track | Selector | Palette |
| :--- | :--- | :--- |
| Light | `:root` | Warm neutral canvas with a green primary |
| Dark | `[data-theme="dark"]` | Warm dark canvas with an orange primary |

Two properties keep the two sets honest:

- **Dark only overrides tokens the light set already declares.** A dark-only token is a token nobody sees in light mode; the panel test enforces this.
- **Components reference tokens only.** The panel ships no color literals, so a theme swap cannot leave a stray color behind. The panel test rejects `#` and `rgb(` in the stylesheet.

Semantic mapping used by the panel:

| Token | Panel usage |
| :--- | :--- |
| `--background` | Content canvas behind cards and the step bar |
| `--popover` | Shell surface, composited with translucency |
| `--foreground` | Prompts, option labels, button text |
| `--muted` | Option cards, badges, inputs, skip hints |
| `--muted-foreground` | Descriptions, previews, meta counters |
| `--accent` | Hover and pressed feedback on flat controls |
| `--primary` | Current step, selected option, primary action |
| `--destructive` | Required-field errors and missing-bridge notice |
| `--border` / `--input` | Hairlines and field outlines |
| `--ring` | Keyboard focus ring |
| `--radius` | Derives `--radius-sm`/`-md`/`-lg` for the whole shell |

## Typography

Typography in the terminal is governed by monospaced cell grids. Hierarchy is established through ANSI text attributes (bold, dim, underline, reverse video) and font sizing where supported.

- **Display (`{typography.display}`)**: Used for header banners and high-level summary rows with bold text attribute.
- **Body (`{typography.body}`)**: Standard reading style for messages, prompt content, and tool outputs.
- **Code (`{typography.code}`)**: Literal commands, file paths, hashes, and parameter keys.
- **Label (`{typography.label}`)**: Compact uppercase or bracketed badges (e.g., `[INFO]`, `[ERROR]`, `DONE`) with bold or muted attributes.

Never rely solely on color or font style to convey critical status; always pair visual styling with explicit text labels or Unicode symbols.

### Glimpse Panel Fonts

The Glimpse panel declares its font tokens with the full fallback chain, and **loads no webfont**. The native window has no network access, so a webfont request would either stall the first paint or flash unstyled text. A named family that is not installed is expected, not a bug: the panel resolves to the platform UI font and to the platform monospace font.

- `--font-sans` carries the interface copy and question prompts.
- `--font-mono` carries option previews and keyboard hints, where column alignment matters.

Anyone tempted to "fix" a missing font by adding a hosted font link should treat that as a regression: it trades a cosmetic difference for a white flash on every open.

## Layout

Terminal layouts are structured around character columns and lines (typically 80 to 120 columns wide).

- **Character Width Safety**: Terminal strings containing ANSI escape codes, zero-width joiners, or East Asian full-width characters will break column alignment if measured with naive `string.length`. All column padding and truncation must use `@earendil-works/pi-tui` utilities (`truncateToWidth` / `visibleWidth`) to ensure right borders (`│`) align strictly on the same column.
- **Footer & Status Line Behavior**: Attached to the bottom edge of the view, updated in place without emitting extra newlines, flickering, or corrupting standard terminal scrollback history.
- **Modal & Overlay Placement**:
  - Center modals using `anchor: "center"`.
  - Maintain a bottom safety margin of at least 4 lines (`margin.bottom >= 4`) to strictly avoid encroaching on or obscuring the user's input prompt and prompt line.
  - Never anchor floating modals to `bottom-right` with negative offsets.
- **Tabular & Grid Alignment**: Align tabular outputs, key-value rows, and badges along shared column boundaries for instant scanning.

## Elevation & Depth

In terminal environments without drop shadows or glassmorphism, depth and layering are achieved through structural glyphs, inverse backgrounds, and contrast stepping:

- **Borders & Dividers**: Use standard Unicode Box Drawing characters (`─`, `│`, `┌`, `┐`, `└`, `┘`, `╭`, `╮`, `╰`, `╯`, `├`, `┤`) with `{colors.rule}`.
- **Surface Elevation**: Float modals or dropdown overlays using distinct background contrast or inverted video attributes.
- **Flat Rhythms**: Prefer inline horizontal dividers and structured indentations over deeply nested framed containers.

## Shapes

Shapes in the terminal are rendered via Unicode Box Drawing characters and framing conventions:

- **Sharp Rectangles (`{rounded.none}`)**: Standard box drawing frames (`┌─┐`, `└─┘`, `│`, `─`) for structured logs, diagnostics, and data grids.
- **Smooth / Rounded (`{rounded.sm}`)**: Rounded box drawing frames (`╭─╮`, `╰─╯`, `│`, `─`, `├`, `┤`) for cards, notification popups, floating modals, and status inspectors.
- **Bracketed Tags**: Enclosed square brackets `[ ... ]` or parentheses `( ... )` for compact status chips and shortcut prompts.

## Components

Terminal components provide standardized building blocks for CLI tools, TUI footers, and modal inspectors:

### 1. Footer (`{components.footer}`)
A compact 1-line status bar pinned to the bottom of the active session:
- Displays extension status, active model, token metrics, or operational mode.
- Rendered with muted metadata separators (`│` or `·`).
- Must operate non-destructively on terminal redraws.

### 2. Status Bar (`{components.status-bar}`)
Horizontal bar containing segmented key-value diagnostics:
- Divided into logical zones (Left: Identity/Status, Center: Context/Task, Right: Resource/Help).

### 3. Badge (`{components.badge}`)
Compact status indicator (e.g., `[PASS]`, `[FAIL]`, `[IDLE]`, `● on`):
- Pairs a semantic color (`success`, `warning`, `error`, `muted`) with concise text.

### 4. Box & Panel (`{components.box}`)
Framed content panel for grouped diagnostics, diff previews, or wizard cards.

### 5. Modal & Inspector (`{components.modal}`)
For comprehensive status inspections, follows a **4-tier vertical information architecture**:
1. **Header**: Title and status badge (e.g., `╭─ [Title: System Status] ──────────── [Badge: ● on] ─╮`).
2. **Key-Value Grid**: 2-column or 4-column high-priority operational metrics.
3. **Divider & Details**: Horizontal divider (`├──────┤`) with scrollable diagnostic rows.
4. **Footer / Navigation**: Bottom action hints (e.g., `╰─ ↑/↓ scroll · Esc / Enter close ────╯`).

### 6. Key-Value Row (`{components.key-value}`)
Aligned label-value pairs with dimmed muted keys and crisp ink values.


### 7. Questionnaire Panel (dual-track interactive window)

The Glimpse micro-window that collects research answers follows the modal architecture above and adds four rules:

- **Stepped by default.** One question per screen, with a step bar that carries the position counter, one activation dot per step plus the review step, and the answered count. A stacked layout that shows every question in one scroll is available, and both layouts share the same validation and submission behaviour.
- **Option cards, not lines.** Each option is a card whose title carries the label, whose sub-text carries the description, and whose monospace well carries the preview. Anything longer than a short phrase belongs in the description: a paragraph in the label renders as a wall of text.
- **A way out of every choice.** Each option question offers a custom entry that reveals a text input, exclusive for single questions and additive for multiple-choice ones.
- **A review step closes the panel.** It lists every step, marks unanswered questions, jumps back to any of them, and owns its own comment field, which travels outside the answer map.

The footer stays pinned while content scrolls, and its actions carry a hit area large enough to read at a glance. Keyboard contract: `Esc` cancels, `Enter` advances, `Cmd/Ctrl+Enter` submits, `Tab` and arrows work inside the option groups.
## Do's and Don'ts

### Do's (Mandatory Practices)
- **Do** use `truncateToWidth` / `visibleWidth` for all terminal line width calculations and border padding.
- **Do** enforce a bottom safety margin (`margin.bottom >= 4`) for centered overlays to keep the user prompt visible.
- **Do** support standard dismissal keys (`Esc`, `Enter`, `q`) for interactive dialogs and modal overlays.
- **Do** sanitize and escape all dynamic string interpolations when constructing HTML for native helper windows (e.g., Glimpse).
- **Do** respect terminal dimensions and adapt gracefully to varying column widths (min 40 cols, target 78-120 cols).
- **Do** support plain-text and ANSI 16-color fallbacks for resource-constrained or legacy terminal emulators.
- **Do** preserve terminal cursor position and avoid overwriting user scrollback history.

### Don'ts (Strict Prohibitions)
- **Don't** use raw `string.length` to calculate padding for lines containing ANSI escape sequences or multi-byte characters.
- **Don't** use `anchor: "bottom-right"` with negative offsets that risk covering input controls.
- **Don't** inject unescaped dynamic text directly into native window HTML templates.
- **Don't** use neon RGB flashes, heavy full-screen clearing, or excessive blinking text.
- **Don't** mix incompatible box-drawing character sets (e.g. mixing double-line `╔` with rounded `╭` in a single component).
- **Don't** hardcode absolute developer-machine file paths for assets or binaries.
- **Don't** write color or radius literals into native window templates; reference the panel tokens so both theme tracks stay intact.
- **Don't** load a hosted webfont or any remote asset into a native helper window.
- **Don't** put a paragraph in an option label; the label is a heading, the description is for prose.
