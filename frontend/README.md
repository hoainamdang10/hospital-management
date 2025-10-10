# Hospital Management V2 - Frontend

## Visual Variations

This homepage implements three distinct visual variations, all meeting WCAG 2.2 AA standards:

### 1. Clinical Minimal (Default - `/`)
- **Aesthetic**: Mostly white surfaces, thin dividers, blue hyperlinks
- **Accent**: Jade (#0E9F6E) only for primary CTAs
- **Typography**: Clean, spacious, plenty of white space
- **Best for**: Professional medical institutions prioritizing trust and clarity

### 2. Data-Forward (`/data-forward`)
- **Aesthetic**: Stronger cyan accents, prominent live data displays
- **Features**: Enhanced availability stats, wait-time sparklines, real-time indicators
- **Typography**: Monospace numbers, data-centric layout
- **Best for**: Tech-forward hospitals emphasizing efficiency and metrics

### 3. Warm Human (`/warm-human`)
- **Aesthetic**: Off-white surfaces (#F7FAFC), warmer color temperature
- **Features**: Photo-led sections, amber info banners, softer shadows
- **Typography**: Slightly larger base size, increased line-height
- **Best for**: Patient-first clinics emphasizing care and empathy

## Design System

### Color Palette
- **Primary (Jade)**: `#0E9F6E` - Actions, primary CTAs
- **Secondary (Royal Blue)**: `#1E4DD8` - Links, highlights
- **Neutrals**: `#0E1217` (900) to `#F7FAFC` (50)
- **Accents**: Cyan `#06B6D4`, Amber `#F59E0B`
- **States**: Success `#10B981`, Warning `#F59E0B`, Error `#F43F5E`

### Typography
- **Font**: Inter (body), ui-monospace (numbers/data)
- **Base Size**: 17px
- **Line Height**: 1.55
- **Headings**: 600-700 weight

### Spacing Scale
- 6px, 12px, 18px, 24px, 36px (custom tokens)

### Accessibility Features (WCAG 2.2 AA)
- ✅ Focus Not Obscured: All interactive elements have visible focus rings
- ✅ Target Size Minimum: All tap targets ≥44×44px
- ✅ Dragging Movements: Keyboard alternatives for all interactions
- ✅ Redundant Entry: Preserved user data, no unnecessary re-entry
- ✅ Keyboard Navigation: Full keyboard access via Tab/Shift+Tab/Enter/Space
- ✅ Reduced Motion: Respects `prefers-reduced-motion` media query

### Motion System
- **Fast**: 120ms (hover states)
- **Base**: 180ms (transitions)
- **Slow**: 260ms (complex animations)
- **Easing**: `cubic-bezier(.2,.8,.2,1)`

## Development

```bash
npm run dev     # Start development server on port 3000
npm run build   # Production build
npm run lint    # ESLint check
npm run typecheck # TypeScript check
```

## Components Architecture

```
components/
├── Header.tsx          # Sticky navigation with backdrop blur
├── Hero.tsx            # Asymmetric 7/5 layout with live availability
├── WaveEdge.tsx        # SVG wave/ECG motif
├── BenefitsGrid.tsx    # 4 staggered cards (measurable outcomes)
├── QuickActions.tsx    # 4 action tiles
├── FindDoctor.tsx      # Filterable doctor cards
├── DepartmentsGrid.tsx # Compact specialty list
├── Testimonials.tsx    # 2 short quotes
├── Insurance.tsx       # Accepted insurers + security note
├── CtaBand.tsx         # Wave-edged CTA section
└── Footer.tsx          # Mega footer with emergency band
```

## Mock Data

```
data/
├── doctors.json        # 6 sample doctors with specialties, languages, slots
└── specialties.json    # 8 medical departments
```

## Anti-Patterns Avoided

❌ Centered "3 equal feature cards" under hero  
❌ Multiple illustration styles  
❌ 3D clay or pastel blob graphics  
❌ Centered headings everywhere  
❌ Heavy shadows  
❌ Generic templates  

## Distinctive Design Choices

✅ Asymmetric 7/5 and 8/4 grids  
✅ One consistent wave/ECG edge SVG  
✅ Live availability data in hero  
✅ Staggered benefit cards (not equal)  
✅ Measurable metrics over platitudes  
✅ Left-aligned content hierarchy  
✅ Documentary-style approach  

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile: iOS Safari 14+, Chrome Android 90+

## License

Proprietary - Hospital Management System V2
