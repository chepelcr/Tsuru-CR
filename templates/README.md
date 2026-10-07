# BeautyMarket Templates

Multi-template e-commerce system with completely different designs for different industries.

## Available Templates

### 1. Tech Gadgets (Technology & Electronics)
**Status:** ✅ Complete
**Directory:** `templates/tech-gadgets/`
**Live URL:** https://tech-gadgets-example.tsuru.jcampos.dev
**Dev Port:** 3002

**Theme:**
- Primary: Dark Blue #1e3a8a
- Secondary: Cyan #06b6d4
- Accent: Electric Blue #3b82f6
- Background: Dark mode (Slate-900 #0f172a)
- Font: Roboto (geometric, tech)
- Style: Sleek, futuristic, high-contrast, minimal

**Features:**
- Dark mode by default
- Glow effects and gradients
- Grid patterns and scanlines
- Specification tables
- Tech-inspired iconography
- Futuristic animations

**Scripts:**
```bash
npm run dev:template:tech-gadgets
npm run build:template:tech-gadgets
```

---

## Template Structure

Each template follows this structure:

```
templates/{template-name}/
├── src/
│   ├── pages/              # Page components
│   ├── components/         # Shared components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities
│   ├── App.tsx             # Router setup
│   ├── main.tsx            # Entry point
│   ├── index.css           # Global styles
│   └── theme.ts            # Theme config
├── public/                 # Static assets
├── index.html              # HTML entry
├── package.json            # Dependencies
├── vite.config.ts          # Vite config
├── tailwind.config.ts      # Tailwind theme
├── tsconfig.json           # TypeScript config
├── postcss.config.js       # PostCSS config
└── README.md               # Template docs
```

## Build System

### Development
```bash
# Individual template
npm run dev:template:{template-name}

# Example
npm run dev:template:tech-gadgets
```

### Production Build
```bash
# Individual template
npm run build:template:{template-name}

# All templates
npm run build:templates
```

### Build Output
Each template builds to: `dist/templates/{template-name}/`

## Shared Dependencies

### Production
- React 18
- TypeScript
- Wouter (routing)
- TanStack Query
- Tailwind CSS
- Lucide React (icons)
- Radix UI (components)
- AWS Amplify (auth)
- Zustand (state)
- React Hook Form + Zod

### Dev Dependencies
- Vite
- Tailwind CSS + plugins
- PostCSS + Autoprefixer
- TypeScript

## Design Philosophy

### Complete Visual Differentiation
- Each template has unique color schemes
- Different typography choices
- Distinct component layouts
- Industry-specific aesthetics
- Unique user experiences

### Shared Architecture
- Common routing patterns
- Consistent build system
- Shared state management approach
- Unified API integration
- Similar component structures

### Performance
- Code splitting per template
- Vendor chunk optimization
- Lazy loading support
- Optimized builds
- Fast load times

## Deployment

### CloudFront + S3
Each template deploys to its own subdomain:
- `{template-name}-example.tsuru.jcampos.dev`

### SSL Certificate
Wildcard certificate: `*.tsuru.jcampos.dev`
ARN: `arn:aws:acm:us-east-1:938590657428:certificate/a18f46b0-b2b1-46d0-80c1-233ad9addf91`

### Deployment Process
1. Build template: `npm run build:template:{name}`
2. Output to: `dist/templates/{name}/`
3. Upload to S3 bucket: `{name}-example.tsuru.jcampos.dev`
4. Configure CloudFront distribution
5. Set up DNS (CNAME record)

## Adding New Templates

1. Create directory: `templates/{template-name}/`
2. Copy structure from existing template
3. Update package.json with template-specific dependencies
4. Customize vite.config.ts (port, output path)
5. Create unique tailwind.config.ts theme
6. Design theme.ts configuration
7. Build page components with template aesthetic
8. Add build scripts to root package.json
9. Test build and development server
10. Deploy to CloudFront + S3

## Documentation

- **Architecture:** `/MULTI_TEMPLATE_ARCHITECTURE.md`
- **Color Research:** `/TEMPLATE_COLOR_RESEARCH.md`
- **Frontend Standards:** `/FRONTEND_STANDARDS.md`
- **Implementation Guide:** `/templates/TECH_GADGETS_IMPLEMENTATION.md`

## Development Workflow

### Starting Development
```bash
# Install dependencies (first time)
cd templates/{template-name}
npm install

# Start dev server
npm run dev
```

### Building for Production
```bash
# From root
npm run build:template:{template-name}

# Or from template directory
cd templates/{template-name}
npm run build
```

### Preview Build
```bash
cd templates/{template-name}
npm run preview
```

## Template Versioning

Each template maintains its own version in package.json:
- Semantic versioning (1.0.0)
- Independent release cycles
- Template-specific changelogs

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- No IE11 support
- Modern ES2020+ features

## Accessibility

All templates follow WCAG 2.1 AA standards:
- Color contrast ratios
- Keyboard navigation
- Screen reader support
- Semantic HTML
- Focus indicators

## Future Templates (Planned)

2. **Vintage Fashion** - Sepia/burgundy theme
3. **Artisan Crafts** - Terracotta/earth tones
4. **Gourmet Foods** - Red/green/amber
5. **Fitness Hub** - Orange/lime/dark gray
6. **Pet Care** - Purple/blue/coral
7. **Tsuru Demo** - Pink/modern (reference)

## Contributing

When adding a new template:
1. Follow existing structure
2. Document theme decisions
3. Create comprehensive README
4. Add build scripts
5. Test thoroughly
6. Update this file

## License

Part of the BeautyMarket platform.
All templates are proprietary.

---

**Last Updated:** January 5, 2026
**Templates Completed:** 1/7
**Status:** Active Development
