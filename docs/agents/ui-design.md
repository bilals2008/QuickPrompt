# UI design rules

## Design slop indicators

Do not ship these — they are the tells of generic AI-generated UI:

- Tags (pill badges, label chips used as decoration)
- Italicized words
- Instrument Serif with negative kerning (or any "editorial" font pairing)
- Over-the-top detailed UI
- Dividers (decorative rules between sections)
- Many colour shades and opacities (keep one accent, one neutral ramp)
- Containers with borders (nested cards, bordered panels inside bordered panels)
- Diagrams (the more detailed, the worse)
- Code breadcrumbs (`provider / model / version` paths in UI copy)
- Section numbering (`01`, `02`, `03` labels)

## Design system

- Use semantic design tokens for colour, typography, spacing and borders.
  Never hardcode design values in components.
- Support multiple themes: theme switching must instantly update the entire
  UI (backgrounds, colours, borders, all tokens) through centralized CSS
  variables and theme configuration, without touching individual components.

## Reference links

- Design tokens: `src/index.css`
- shadcn/ui themes: https://ui.shadcn.com/themes
- tweakcn theme editor: https://tweakcn.com
- Tailwind CSS v4 theme variables: https://tailwindcss.com/docs/theme
- Radix Colors: https://www.radix-ui.com/colors
- Skill registry: https://skills.sh/
