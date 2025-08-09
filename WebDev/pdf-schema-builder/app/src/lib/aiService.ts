import { PDFField, SchemaItem } from '@/types/schema';

export interface FieldAttributesInput {
  intent: string;
  fieldType: 'text' | 'checkbox' | 'radio' | 'signature' | 'fileUpload' | 'info' | 'text-area';
  screenshot?: string; // Deprecated - no longer used, kept for backward compatibility
  pdfContext: PDFField[];
  groupType: 'text-continuation' | 'text-same-value' | 'checkbox' | 'radio';
}

export interface GeneratedFieldAttributes {
  display_name: string;
  description?: string;
  width?: number;
  placeholder?: string;
  special_input?: {
    text?: {
      percentage?: boolean;
      phone?: boolean;
      date?: boolean;
      numbered_date?: boolean;
      month_year?: boolean;
      currency?: boolean;
      number?: boolean;
      email?: boolean;
      url?: boolean;
    };
    checkbox?: {
      asRadio?: boolean;
      horizontal?: number;
    };
    radio?: {
      layout?: 'vertical' | 'horizontal' | 'grid';
      columns?: number;
    };
  };
  checkbox_options?: {
    options: {
      display_name: string;
      value: string;
    }[];
  };
}

export async function generateFieldAttributes({
  intent,
  fieldType,
  screenshot,
  pdfContext,
  groupType
}: FieldAttributesInput): Promise<GeneratedFieldAttributes> {
  try {
    const response = await fetch('/api/generate-field-attributes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent,
        fieldType,
        screenshot,
        pdfContext,
        groupType
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const parsed = await response.json();
    
    // Validate and clean the response
    if (!parsed.display_name) {
      throw new Error('Invalid AI response: missing display_name');
    }

    // Remove empty optional fields
    if (parsed.description === '' || parsed.description === null) {
      delete parsed.description;
    }
    
    return parsed;
  } catch (error) {
    console.error('Error generating field attributes:', error);
    
    // Fallback to basic generation based on intent
    return {
      display_name: intent.length > 30 ? intent.substring(0, 30) + '...' : intent,
      width: 12
    };
  }
}

export async function captureScreenshot(elementId: string, fieldSelectors?: string[]): Promise<string> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const element = document.getElementById(elementId);
    
    if (!element) {
      throw new Error('Element not found');
    }

    // Wait longer for the PDF to fully render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if PDF is still loading
    const loadingIndicator = element.querySelector('[style*="Loading PDF"]');
    if (loadingIndicator && loadingIndicator.textContent?.includes('Loading')) {
      console.warn('PDF still loading, waiting more...');
      // Wait more for PDF to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // If field selectors are provided, highlight them directly without cropping
    if (fieldSelectors && fieldSelectors.length > 0) {
      // First, find ALL field overlays and temporarily reset their styles
      const allOverlays = element.querySelectorAll<HTMLElement>('[data-field-name]');
      const resetFields: { element: HTMLElement; originalStyles: any }[] = [];
      
      // Reset all field overlays to neutral state
      allOverlays.forEach(overlay => {
        const fieldName = overlay.getAttribute('data-field-name');
        const isTargetField = fieldSelectors.includes(fieldName || '');
        
        if (!isTargetField) {
          // Store original styles for non-target fields
          const originalStyles = {
            border: overlay.style.border,
            backgroundColor: overlay.style.backgroundColor,
            boxShadow: overlay.style.boxShadow,
            zIndex: overlay.style.zIndex
          };
          
          // Reset to neutral gray (remove purple grouped highlighting)
          overlay.style.border = '2px solid #9ca3af';
          overlay.style.backgroundColor = 'rgba(156, 163, 175, 0.1)';
          overlay.style.boxShadow = 'none';
          overlay.style.zIndex = 'auto';
          
          resetFields.push({ element: overlay, originalStyles });
        }
      });
      
      // Now highlight only the target fields
      const highlightedFields: { element: HTMLElement; originalStyles: any }[] = [];
      
      for (const selector of fieldSelectors) {
        // Look for ALL field overlays that match the field names
        const overlays = element.querySelectorAll<HTMLElement>(`[data-field-name="${selector}"]`);
        overlays.forEach(overlay => {
          // Store original styles
          const originalStyles = {
            border: overlay.style.border,
            backgroundColor: overlay.style.backgroundColor,
            boxShadow: overlay.style.boxShadow,
            zIndex: overlay.style.zIndex
          };
          
          // Apply highlight
          overlay.style.border = '3px solid #8b5cf6';
          overlay.style.backgroundColor = 'rgba(139, 92, 246, 0.4)';
          overlay.style.boxShadow = '0 0 15px rgba(139, 92, 246, 0.6)';
          overlay.style.zIndex = '9999';
          
          highlightedFields.push({ element: overlay, originalStyles });
        });
      }

      if (highlightedFields.length > 0) {
        // Calculate bounding box for all highlighted fields to determine crop area
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        highlightedFields.forEach(({ element: overlay }) => {
          const rect = overlay.getBoundingClientRect();
          const parentRect = element.getBoundingClientRect();
          
          const relativeTop = rect.top - parentRect.top;
          const relativeLeft = rect.left - parentRect.left;
          const relativeBottom = relativeTop + rect.height;
          const relativeRight = relativeLeft + rect.width;
          
          minX = Math.min(minX, relativeLeft);
          minY = Math.min(minY, relativeTop);
          maxX = Math.max(maxX, relativeRight);
          maxY = Math.max(maxY, relativeBottom);
        });

        // Add generous padding - more horizontal padding for better context
        const horizontalPadding = 150; // Much more horizontal padding
        const verticalPadding = 100;   // More vertical padding too
        
        minX = Math.max(0, minX - horizontalPadding);
        minY = Math.max(0, minY - verticalPadding);
        maxX = Math.min(element.offsetWidth, maxX + horizontalPadding);
        maxY = Math.min(element.offsetHeight, maxY + verticalPadding);

        // Ensure minimum dimensions for readability
        const width = maxX - minX;
        const height = maxY - minY;
        const minWidth = 600;
        const minHeight = 400;
        
        if (width < minWidth) {
          const extraWidth = (minWidth - width) / 2;
          minX = Math.max(0, minX - extraWidth);
          maxX = Math.min(element.offsetWidth, maxX + extraWidth);
        }
        
        if (height < minHeight) {
          const extraHeight = (minHeight - height) / 2;
          minY = Math.max(0, minY - extraHeight);
          maxY = Math.min(element.offsetHeight, maxY + extraHeight);
        }

        // Capture the screenshot with cropping
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 1,
          logging: false,
          useCORS: true,
          allowTaint: true,
          foreignObjectRendering: false,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight
        });


        // Restore original styles for highlighted fields
        highlightedFields.forEach(({ element: overlay, originalStyles }) => {
          overlay.style.border = originalStyles.border;
          overlay.style.backgroundColor = originalStyles.backgroundColor;
          overlay.style.boxShadow = originalStyles.boxShadow;
          overlay.style.zIndex = originalStyles.zIndex;
        });
        
        // Restore original styles for reset fields
        resetFields.forEach(({ element: overlay, originalStyles }) => {
          overlay.style.border = originalStyles.border;
          overlay.style.backgroundColor = originalStyles.backgroundColor;
          overlay.style.boxShadow = originalStyles.boxShadow;
          overlay.style.zIndex = originalStyles.zIndex;
        });

        // Return the full data URL (including prefix)
        const dataUrl = canvas.toDataURL('image/png');
        return dataUrl;
      }
    }

    // If no field selectors, capture the whole visible area
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 1,
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: false
    });

    // Return the full data URL (including prefix)
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    return '';
  }
}

export interface SchemaOrganizationInput {
  schema: SchemaItem[];
  formType?: string;
}

export interface OrganizedSchemaResponse {
  schema: SchemaItem[];
  blocks: {
    name: string;
    title: string;
    description: string;
    color_theme: string;
    item_count: number;
  }[];
  error?: string;
}

export async function organizeSchema({
  schema,
  formType
}: SchemaOrganizationInput): Promise<OrganizedSchemaResponse> {
  try {
    const response = await fetch('/api/organize-schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schema,
        formType
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error organizing schema:', error);
    
    // Return original schema on error
    return {
      schema,
      blocks: [],
      error: error instanceof Error ? error.message : 'Failed to organize schema'
    };
  }
}

export interface BeautificationInput {
  schema: SchemaItem[];
  blockName: string;
  formType?: string;
  iterationLimit?: number;
}

export interface BeautificationIteration {
  iteration: number;
  screenshot: string;
  changes: {
    unique_id: string;
    field: string;
    oldValue: any;
    newValue: any;
    reason: string;
  }[];
  reasoning: string;
  isComplete: boolean;
}

export interface BeautificationResponse {
  success: boolean;
  schema?: SchemaItem[];
  iterations?: BeautificationIteration[];
  summary?: {
    blockName: string;
    totalIterations: number;
    totalChanges: number;
    completed: boolean;
    duration: number;
  };
  error?: string;
}

export async function beautifySchemaBlock({
  schema,
  blockName,
  formType,
  iterationLimit = 3
}: BeautificationInput): Promise<BeautificationResponse> {
  try {
    const response = await fetch('/api/beautify-schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schema,
        blockName,
        formType,
        iterationLimit
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error beautifying schema:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to beautify schema'
    };
  }
}

export interface CheckboxLabelsInput {
  checkboxOptions: {
    fieldName: string;
    currentLabel?: string;
  }[];
  overallIntent: string;
  formType?: string;
}

export interface CheckboxLabelsResponse {
  labels: {
    fieldName: string;
    displayName: string;
    reasoning: string;
  }[];
  error?: string;
}

export async function generateCheckboxLabels({
  checkboxOptions,
  overallIntent,
  formType
}: CheckboxLabelsInput): Promise<CheckboxLabelsResponse> {
  try {
    const response = await fetch('/api/generate-checkbox-labels', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkboxOptions,
        overallIntent,
        formType
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating checkbox labels:', error);
    
    return {
      labels: [],
      error: error instanceof Error ? error.message : 'Failed to generate labels'
    };
  }
}

export interface SingleCheckboxLabelInput {
  fieldName: string;
  intent: string;
  formType?: string;
}

export interface SingleCheckboxLabelResponse {
  displayName: string;
  reasoning: string;
  error?: string;
}

export async function generateSingleCheckboxLabel({
  fieldName,
  intent,
  formType
}: SingleCheckboxLabelInput): Promise<SingleCheckboxLabelResponse> {
  try {
    const response = await fetch('/api/generate-single-checkbox-label', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fieldName,
        intent,
        formType
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error generating single checkbox label:', error);
    
    return {
      displayName: fieldName,
      reasoning: 'Error occurred, using original field name',
      error: error instanceof Error ? error.message : 'Failed to generate label'
    };
  }
}