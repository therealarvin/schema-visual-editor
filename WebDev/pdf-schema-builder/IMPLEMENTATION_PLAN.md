# PDF Schema Builder Implementation Plan

## Project Overview
Build a comprehensive PDF schema builder that allows users to:
1. Upload and view PDFs with form fields
2. Select and group PDF fields
3. Auto-generate schema items based on grouped fields
4. Edit and manage schema items
5. Export schemas for use in form automation

## What I Learned from Analysis

### Schema Item Structure (from realtor.ts)
- **unique_id**: Unique identifier for each schema item
- **display_attributes**: Controls UI rendering, validation, and behavior
- **pdf_attributes**: Array mapping schema to PDF form fields
  - `formType`: The PDF form type
  - `formfield`: Single field or array for radio groups
  - `linked_form_fields_text`: Array for text continuation fields
  - `linked_form_fields_radio`: Array for radio button groups
  - `linked_form_fields_checkbox`: Array for checkbox groups

### Field Grouping Logic
1. **Text Fields**:
   - **Continuation Fields**: Multiple text boxes that continue a single value (e.g., long address)
     - Use first field's name as unique_id
     - Store all fields in `linked_form_fields_text` array
   - **Same Value Linked Fields**: Multiple fields that should have the same value
     - Create multiple `pdf_attributes` entries, one for each field

2. **Checkbox Groups**: 
   - Multiple checkboxes grouped together
   - Use `linked_form_fields_checkbox` with `fromDatabase` and `pdfAttribute` mapping

3. **Radio Groups**:
   - Single selection from multiple options
   - Use `linked_form_fields_radio` with field name and display name

## Architecture Plan

### 1. Data Store Structure
```typescript
// stores/schema.ts
interface SchemaStore {
  schemas: Map<projectId, SchemaItem[]>;
  selectedFields: Set<string>;
  groupingMode: 'text-continuation' | 'text-same-value' | 'checkbox' | 'radio' | null;
  
  // Actions
  addSchemaItem: (projectId: string, item: SchemaItem) => void;
  updateSchemaItem: (projectId: string, uniqueId: string, updates: Partial<SchemaItem>) => void;
  deleteSchemaItem: (projectId: string, uniqueId: string) => void;
  selectField: (fieldId: string) => void;
  createGroup: (fields: string[], type: string, options: any) => SchemaItem;
}
```

### 2. Component Structure

#### A. PDF Viewer Component (`components/PdfViewer.tsx`)
- Display PDF using react-pdf
- Overlay for highlighting form fields
- Click handler for field selection
- Visual feedback for selected fields
- Extract and display field metadata

#### B. Field Overlay Component (`components/FieldOverlay.tsx`)
- Absolute positioned divs over PDF
- Different colors for:
  - Unselected fields (gray)
  - Selected fields (blue)
  - Grouped fields (green)
  - Hover state (light blue)

#### C. Schema Editor Panel (`components/SchemaEditor.tsx`)
- List all schema items
- Collapsible sections for each item
- Edit properties:
  - Display name
  - Input type
  - Validation rules
  - PDF mappings
- Drag to reorder
- Delete functionality

#### D. Field Grouping Dialog (`components/FieldGroupingDialog.tsx`)
- Shows selected fields
- Options based on field types:
  - Text: Continuation vs Same Value
  - Checkbox: Group name and options
  - Radio: Group name and options
- Preview of generated schema

#### E. Schema Export (`components/SchemaExport.tsx`)
- Export as JSON
- Export as TypeScript
- Copy to clipboard
- Download file

### 3. PDF Processing Pipeline

```typescript
// lib/pdfProcessor.ts
interface PDFField {
  id: string;
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'signature';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  value?: string;
}

async function extractPDFFields(pdfData: ArrayBuffer): Promise<PDFField[]>
async function getFieldCoordinates(field: any, page: any): Promise<Coordinates>
```

### 4. Schema Generation Logic

```typescript
// lib/schemaGenerator.ts
function generateTextContinuationSchema(fields: PDFField[]): SchemaItem
function generateSameValueSchema(fields: PDFField[]): SchemaItem
function generateCheckboxGroupSchema(fields: PDFField[]): SchemaItem
function generateRadioGroupSchema(fields: PDFField[]): SchemaItem
function autoDetectFieldType(field: PDFField): string
function generateUniqueId(field: PDFField): string
```

## Implementation Steps

### Phase 1: PDF Viewer & Field Detection
1. ✅ Set up react-pdf with worker
2. ✅ Create PDF viewer component
3. ✅ Extract form fields from PDF
4. ✅ Display field overlays
5. ✅ Implement field selection

### Phase 2: Schema Generation
1. ✅ Create schema store
2. ✅ Implement field grouping dialog
3. ✅ Generate schema items from groups
4. ✅ Auto-populate pdf_attributes

### Phase 3: Schema Editor
1. ✅ Build schema editor panel
2. ✅ Implement field property editing
3. ✅ Add validation rule editor
4. ✅ Implement reordering

### Phase 4: Export & Integration
1. ✅ Export schema as JSON
2. ✅ Export as TypeScript
3. ✅ Save schemas to project
4. ✅ Load existing schemas

## File Structure
```
app/src/
├── components/
│   ├── PdfViewer.tsx
│   ├── FieldOverlay.tsx
│   ├── SchemaEditor.tsx
│   ├── FieldGroupingDialog.tsx
│   └── SchemaExport.tsx
├── lib/
│   ├── pdfProcessor.ts
│   ├── schemaGenerator.ts
│   └── schemaValidator.ts
├── stores/
│   ├── projects.ts (existing)
│   └── schema.ts (new)
└── types/
    └── schema.ts (SchemaItem interface)
```

## Key Decisions Needed

1. **Field Detection**: Should we auto-detect field relationships (e.g., fields with similar names)?
2. **Schema Validation**: What validation should we apply when generating schemas?
3. **PDF Storage**: Store PDF with schema or separately?
4. **Export Format**: Support multiple schema formats?
5. **Field Naming**: Auto-generate unique_ids or let user specify?