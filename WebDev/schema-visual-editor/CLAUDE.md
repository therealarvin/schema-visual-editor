# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Start development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Start production server:**
```bash
npm run start
```

**Lint code:**
```bash
npm run lint
```

## Project Architecture

This is a **Next.js 15** application using the **App Router** that provides a visual schema editor for OnRoad form schemas with live preview functionality.

### Core Components

- **SchemaEditor** (`src/components/SchemaEditor.tsx`): Main schema editing interface with drag-and-drop field management, expandable field cards, and comprehensive field configuration options
- **FormPreview** (`src/components/FormPreview.tsx`): Real-time form preview that renders fields according to schema configuration, with support for conditional visibility, block grouping, and responsive layouts
- **UI Components** (`src/components/ui/`): Shadcn/UI component library with Radix UI primitives for consistent, accessible interface elements

### Type System

All schema types are defined in `src/types/schema.ts` and mirror the OnRoad project's `SchemaItem` interface:

- **SchemaItem**: Core field definition with display attributes, PDF attributes, validation rules, and conditional logic
- **FormResponse**: Form data storage format supporting various field types (text, signature, file upload, etc.)
- Field types: `text`, `text-area`, `radio`, `checkbox`, `signature`, `fileUpload`, `info`

### Schema Features

- **Block Organization**: Group fields into themed blocks with custom styling, icons, and color themes
- **Grid Layout**: 12-column responsive grid system with customizable field widths
- **Conditional Visibility**: Show/hide fields based on other field values using `visibleIf` conditions
- **Field Validation**: Required fields, custom validation rules, and cross-field validation
- **Break Points**: Force new rows with the `breakBefore` option for layout control

### State Management

The application uses React's built-in state management:
- Local component state for form editing and preview
- Prop drilling for schema updates between editor and preview
- Memoization for performance optimization in complex renders

### Styling System

- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Radix UI**: Accessible component primitives for form controls
- **Theme Colors**: Predefined color themes (blue, green, purple, orange, gray) for block styling
- **Responsive Design**: 12-column grid system with breakpoint-aware layouts

### Integration with OnRoad

Schemas created in this editor are fully compatible with the OnRoad FormInput component. The editor maintains compatibility with:
- PDF form field mapping via `pdf_attributes`
- Supabase database integration via `value.supabase` configuration
- Signature handling with signer/delegator roles
- File upload and document management

### Sample Data

A sample schema is provided in `src/lib/utils.ts` demonstrating all field types and configuration options. Use this as a reference for proper schema structure.