# PDF Schema Builder - Project Documentation

## Project Overview
A React/Next.js application for extracting form fields from PDF documents and building structured schemas for form automation. The application allows users to upload PDFs, group related fields, and generate TypeScript schemas for use in form-filling applications.

## Technology Stack
- **Framework**: Next.js 15.4.6 with React
- **Language**: TypeScript
- **PDF Processing**: PDF.js (react-pdf)
- **State Management**: Zustand with persistence
- **Storage**: IndexedDB for PDF and schema storage
- **Build Tool**: Next.js with Turbopack
- **Testing**: Playwright for E2E testing
- **Styling**: Inline styles (no CSS framework)

## Project Structure
```
/Users/arvin/WebDev/pdf-schema-builder/app/
├── src/
│   ├── app/
│   │   ├── [projectId]/
│   │   │   └── page.tsx          # Main project page with PDF viewer and schema editor
│   │   ├── layout.tsx            # Root layout
│   │   └── page.tsx              # Home page with project list
│   ├── components/
│   │   ├── PdfViewer.tsx         # PDF display and field extraction
│   │   ├── SchemaEditor.tsx      # Schema item list and management
│   │   ├── SchemaItemEditor.tsx  # Individual schema item editing
│   │   ├── SchemaExport.tsx      # TypeScript export functionality
│   │   └── FieldGrouping.tsx     # Field grouping dialog
│   ├── lib/
│   │   ├── pdfStorage.ts         # IndexedDB operations for PDFs
│   │   └── schemaStorage.ts      # IndexedDB operations for schemas
│   ├── stores/
│   │   └── projects.ts           # Zustand store for project management
│   └── types/
│       └── schema.ts             # TypeScript type definitions
├── public/
│   ├── Animal_Agreement.pdf      # Test PDF document
│   └── pdf.worker.min.js         # PDF.js worker
└── package.json
```

## Key Features

### 1. PDF Field Extraction
- Uploads PDF files (max 20MB)
- Automatically extracts form fields using PDF.js
- Identifies field types: text, checkbox, radio, signature, button
- Displays interactive field overlays on PDF pages
- Multi-page PDF support with navigation

### 2. Field Grouping System
- **Text Continuation**: Links multiple text fields that continue across boxes
- **Text Same Value**: Groups fields that should have identical values
- **Checkbox Groups**: Combines related checkboxes into single schema item
- **Radio Groups**: Groups radio buttons for exclusive selection

### 3. Visual Field States
- **Default (Gray)**: Unselected fields (#9ca3af)
- **Selected (Blue)**: Currently selected fields (#2563eb)
- **Grouped (Purple)**: Fields that are part of a schema group (#8b5cf6)
- **Linkable (Green)**: Grouped fields available for linking in linking mode (#10b981)

### 4. Schema Editor
- Create, edit, and delete schema items
- Comprehensive property editing:
  - Basic: unique_id, display_name, order, input_type
  - Value configuration: manual, resolved (database), reserved
  - PDF attributes: form field mappings and linked fields
  - Display options: required, hidden, cached
  - Checkbox/Radio options with custom values
- Raw JSON editor for advanced users
- Collapsible sections for better organization

### 5. Linked Fields (Checkbox Feature)
- Checkbox options can link to other schema items
- Visual linking mode with color-coded feedback
- Click "Add Linked Field" button on checkbox option
- Select grouped field in PDF to create link
- Linked field IDs stored in `linkedFields` array

### 6. TypeScript Export
- Generates complete TypeScript schema definitions
- Includes all field properties and relationships
- Copy-to-clipboard functionality
- Properly typed for use in other applications

## Database Schema

### IndexedDB Stores

#### PDF Store (`psb_pdfs`)
```typescript
{
  projectId: string,
  pdfData: ArrayBuffer,
  timestamp: number
}
```

#### Schema Store (`psb_schemas`)
```typescript
{
  projectId: string,
  schema: SchemaItem[],
  timestamp: number
}
```

### Zustand Store (localStorage)
```typescript
{
  projects: [
    {
      id: string,
      name: string,
      formType: string
    }
  ]
}
```

## Schema Type Structure
```typescript
interface SchemaItem {
  unique_id: string;
  pdf_attributes?: {
    formType: string;
    formfield: string | string[];
    linked_form_fields_text?: string[];
    linked_form_fields_radio?: { radioField: string; displayName: string }[];
    linked_form_fields_checkbox?: { fromDatabase: string; pdfAttribute: string }[];
  }[];
  display_attributes: {
    display_name?: string;
    input_type: "text" | "radio" | "checkbox" | "signature" | "fileUpload" | "info" | "text-area";
    order: number;
    value: {
      type: "manual" | "resolved" | "reserved";
      supabase?: {...}[];
      reserved?: string;
    };
    checkbox_options?: {
      options: {
        display_name: string;
        databaseStored: string;
        linkedFields?: string[];  // References to other schema item unique_ids
      }[];
    };
    // ... additional properties
  };
}
```

## Workflow

### Creating a Schema
1. Create new project with name and form type
2. Upload PDF document
3. Select related fields by clicking on overlays
4. Click "Create Group" to group selected fields
5. Choose grouping type and provide display name
6. Edit schema items to refine properties
7. For checkboxes, use linking mode to connect to other fields
8. Export as TypeScript when complete

### Field Linking Process
1. Edit a checkbox schema item
2. Click "Add Linked Field" for specific checkbox option
3. Editor saves and enters linking mode
4. Grouped fields turn green in PDF viewer
5. Click a green field to link it
6. Linked field's unique_id added to checkbox option
7. Exit linking mode automatically or via cancel button

## Known Limitations
- Maximum PDF size: 20MB
- PDF must have extractable form fields
- Browser-based storage (IndexedDB has size limits)
- No backend/cloud storage
- No collaborative features
- No PDF generation/filling (only schema creation)

## Development Commands
```bash
# Install dependencies
npm install

# Run development server
npm run dev          # Default port 3000
PORT=3001 npm run dev # Custom port

# Build for production  
npm run build

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

## Testing
- Manual testing with Animal_Agreement.pdf
- Playwright E2E tests available (requires browser installation)
- Test files: `test-new-features.mjs`, `simple-test.mjs`

## Recent Enhancements (Current Session)
1. **Complete Schema Editor**: Full editing capabilities for all schema properties
2. **Grouped Field Colors**: Visual distinction with purple color for grouped fields
3. **Linked Fields Feature**: Checkbox options can reference other schema items
4. **Linking Mode UI**: Interactive field linking with visual feedback
5. **TypeScript Build Fixes**: Resolved all TypeScript/ESLint errors

## File Paths for Quick Reference
- Main page component: `src/app/[projectId]/page.tsx:119` (handleFieldClick function)
- Schema editor: `src/components/SchemaEditor.tsx:16` (main component)
- Item editor: `src/components/SchemaItemEditor.tsx:320` (linked fields section)
- PDF viewer: `src/components/PdfViewer.tsx:168` (color logic)
- Schema types: `src/types/schema.ts:1` (type definitions)

## Important Notes
- Always use absolute paths for file operations
- IndexedDB operations are async - handle promises properly
- PDF.js worker must be in public directory
- Field overlays use absolute positioning based on PDF coordinates
- Schema changes auto-save to IndexedDB
- Project metadata persists in localStorage via Zustand

## Browser Compatibility
- Chrome/Chromium: Full support
- Firefox: Full support  
- Safari: Partial (IndexedDB limitations)
- Edge: Full support

## Security Considerations
- Client-side only (no server-side processing)
- PDFs stored locally in browser
- No authentication/authorization
- No data transmission to external servers
- Suitable for non-sensitive documents only