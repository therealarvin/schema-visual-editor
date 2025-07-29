// Types copied from onroad project for schema editing

export interface SchemaItem {
  unique_id: string;

  pdf_attributes?: {
    formType: string;               
    formfield: string | string[]; // PDF field name (no coordinates), string array for same value radio buttons
    linked_form_fields_text?: string[]; // continuation boxes (left‑to‑right)
    linked_form_fields_radio?: { radioField: string; displayName: string }[];
    linked_form_fields_checkbox?: { fromDatabase: string; pdfAttribute: string}[];
    linked_dates?: { dateFieldName: string }[];
  }[];
  
  /** Rendering, linking, and validation */
  display_attributes: {
    display_name?: string;
    input_type: "text" | "radio" | "checkbox" | "signature" | "fileUpload" | "info" | "text-area";
    description?: string; 
    order: number;                   // global, increments by 1
    attribute?: string;              // simple semantic tag ("address", "phone", etc.)
    block?: string;                  // optional grouping label
    block_style?: {

      title?: string;
      description?: string;
      icon?: string;                   
      color_theme?: 'blue' | 'green' | 'purple' | 'orange' | 'gray';
    }
    visibleIf?: {
      unique_id: string;
      operation: ">" | ">=" | "<" | "<=" | "==" | "!==" | "contains" | "doesNotContain";
      valueChecked: string;
    }[];
    validation?: {
      loopback?: {
        regex: string,
        message: string; // if rule not met display this message to user
      }[]
      crossField?: {
        rule: ">" | ">=" | "<" | "<=" | "==" | "!==" 
        unique_id: string; // the unique_id of the field to check against
        message?: string; // if rule not met display this message to user
      }[]
    };
    placeholder?: string;
    width?: number;                  // 12‑unit grid
    display_radio_options?: string[];
    checkbox_options?: {
      options: {display_name: string, databaseStored: string, linkedFields?: string[]}[];
      maxSelected?: number;
      minSelected?: number;
    }
    
    value: {
      type: "manual" | "resolved" | "reserved";
      output?: "string" | "SignatureInput__signer" | "SignatureInput__delegator";
      supabase?: {
        table: string;
        column: string;
        eqBy: { columnName: string; hardCodedValue?: string; variable?: "dealId" | "dealOptionId" | "userId" }[];
      }[];
      reserved?: "tenant_name_csv" | "realtor_name_spaced" 
    };

    breakBefore?: boolean; 

    /** Caching flag – set to true for realtor info */
    isCached?: boolean;  // true for fields such as realtor_name, realtor_number, realtor_phone, realtor_email, broker_firm_name
    isRequired?: boolean;
    isHidden?: boolean; 
    
    special_input?: {
      text?: {
        percentage?: boolean; //for text input
        phone?: boolean; //for text input
        date?: boolean; //for text input
        currency?: boolean; //for text input with currency formatting
        number?: boolean; //for text input with number-only validation
        email?: boolean; //for text input with email validation
        url?: boolean; //for text input with URL validation
      }
      checkbox?: {
        asRadio?: boolean; //for checkbox input
        horizontal?: number; //for checkbox input - number of columns
      },
      info?: {
        style?: 'default' | 'subtle' | 'minimal' | 'inline' | 'compact' | 'warning' | 'success' | 'error' | 'tip';
        icon?: boolean; //whether to show icon
        minimizable?: boolean; //whether user can minimize/collapse
      }
      radio?: {
        layout?: 'vertical' | 'horizontal' | 'grid';
        columns?: number; //for grid layout
      }
      signature?: {
        dateFormat?: string; //custom date format for signature dates
        showInitials?: boolean; //whether to show initials field
      }
      fileUpload?: {
        accept?: string; //file types to accept (e.g., ".pdf,.doc,.docx")
        maxSize?: number; //max file size in MB
        multiple?: boolean; //allow multiple files
      }
      textArea?: {
        minRows?: number; //minimum rows to display
        maxRows?: number; //maximum rows before scrolling
        autoResize?: boolean; //auto-resize based on content
      }
    }
  };
  
}

export type Schema = SchemaItem[];

// Form response types for preview
export type SignatureInput = {
  actionAs: "signer" | "delegator";
  email: string;
};

export type FileUpload = {
  files: string[]; // Array of file URLs or identifiers
  count: number; // Number of files uploaded
};

export type FormResponse = Record<string, string | string[] | SignatureInput | FileUpload>;