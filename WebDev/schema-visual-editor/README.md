# Schema Visual Editor

A visual editor for OnRoad form schemas with live preview functionality. This application allows you to create, edit, and preview form schemas that are compatible with the OnRoad FormInput component.

## Features

- **Visual Schema Editor**: Drag-and-drop interface for creating form fields with up/down arrows for easy reordering
- **Live Preview**: Real-time preview of your forms as you edit them
- **JSON Editor**: Direct editing of schema JSON with validation and change tracking
- **Schema Import/Export**: Import and export schemas as JSON files
- **Field Types Support**: 
  - Text Input
  - Text Area
  - Radio Buttons
  - Checkboxes
  - Signature Fields
  - File Upload
  - Info Display
- **Block Organization**: Group fields into themed blocks with custom styling
- **Conditional Logic**: Set field visibility conditions
- **Grid Layout**: Flexible 12-column grid system for responsive layouts

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone or download the project
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Creating a Schema

1. **Add Fields**: Click the "Add Field" button to create new form fields
2. **Configure Fields**: Expand field cards to edit properties like:
   - Display name and description
   - Input type (text, radio, checkbox, etc.)
   - Field order and width
   - Required/optional status
   - Block grouping and styling

3. **Reorder Fields**: Use the up/down arrow buttons or drag the grip handle to reorder fields
4. **Edit JSON Directly**: Switch to the "JSON Editor" tab to edit the schema JSON directly with validation
5. **Preview Changes**: Switch to the "Live Preview" tab to see your form in action
6. **Export Schema**: Use the "Export" button to download your schema as JSON

### Field Types

- **Text Input**: Single-line text fields with optional validation
- **Text Area**: Multi-line text input for longer content
- **Radio Buttons**: Single-select option groups
- **Checkboxes**: Boolean yes/no fields
- **Signature Fields**: Electronic signature collection
- **File Upload**: Document and image upload fields
- **Info Display**: Read-only information blocks

### Block Organization

Group related fields into visual blocks with:
- Custom titles and descriptions
- Color themes (blue, green, purple, orange, gray)
- Icons (Home, FileText, Users, etc.)
- Styled headers and borders

### Advanced Features

- **Conditional Visibility**: Show/hide fields based on other field values
- **Field Validation**: Set required fields and custom validation rules
- **Layout Control**: Use the 12-column grid system for responsive layouts
- **Break Points**: Force new rows with the "Break Before" option

## Schema Structure

The editor generates schemas compatible with the OnRoad `SchemaItem` interface:

```typescript
interface SchemaItem {
  unique_id: string;
  display_attributes: {
    display_name: string;
    input_type: "text" | "radio" | "checkbox" | "signature" | "fileUpload" | "info" | "text-area";
    description?: string;
    order: number;
    block?: string;
    block_style?: {
      title?: string;
      description?: string;
      icon?: string;
      color_theme?: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
    };
    // ... additional properties
  };
}
```

## Integration with OnRoad

The schemas created with this editor are fully compatible with the OnRoad FormInput component. Simply export your schema and use it in your OnRoad application:

```typescript
import FormInput from '@/components/files/realtor/FormInput';
import { myGeneratedSchema } from './path/to/schema.json';

// Use in your component
<FormInput
  schema={myGeneratedSchema}
  formResponseUpdateByField={handleFieldUpdate}
  initialFormResponses={{}}
  can_edit={true}
  isLoading={false}
/>
```

## Development

### Tech Stack

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component primitives
- **Shadcn/UI**: Pre-built component library
- **Lucide React**: Icon library

### Project Structure

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/           # Shadcn/UI components
│   ├── FormPreview.tsx
│   └── SchemaEditor.tsx
├── lib/
│   └── utils.ts      # Utility functions
└── types/
    └── schema.ts     # TypeScript interfaces
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the OnRoad platform and follows the same licensing terms.