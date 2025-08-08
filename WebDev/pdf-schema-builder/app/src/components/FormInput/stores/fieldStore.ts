import { create } from 'zustand';
import { FormResponse } from '../../types/realtor';

interface FieldState {
  // Core field data
  fields: Map<string, any>;
  
  // Field status tracking
  editedFields: Set<string>;
  savingFields: Set<string>;
  savedFields: Set<string>;
  
  // Error tracking
  fieldErrors: Map<string, string>;
  
  // Callback for field changes
  onFieldsChange?: (fields: Map<string, any>) => void;
  
  // Actions
  updateField: (fieldId: string, value: any) => void;
  batchUpdateFields: (updates: Record<string, any>) => void;
  getField: (fieldId: string) => any;
  setOnFieldsChange: (callback: (fields: Map<string, any>) => void) => void;
  
  // Status actions
  markFieldEdited: (fieldId: string) => void;
  markFieldSaving: (fieldId: string) => void;
  markFieldSaved: (fieldId: string) => void;
  clearFieldStatus: (fieldId: string) => void;
  
  // Error actions
  setFieldError: (fieldId: string, error: string) => void;
  clearFieldError: (fieldId: string) => void;
  
  // Bulk operations
  initializeFields: (formResponse: FormResponse) => void;
  reset: () => void;
  
  // Computed getters
  getFieldStatus: (fieldId: string) => 'idle' | 'edited' | 'saving' | 'saved' | 'error';
  hasUnsavedChanges: () => boolean;
  getUnsavedFields: () => string[];
}

export const useFieldStore = create<FieldState>()(
  (set, get) => ({
  // Initial state
  fields: new Map(),
  editedFields: new Set(),
  savingFields: new Set(),
  savedFields: new Set(),
  fieldErrors: new Map(),
  onFieldsChange: undefined,
  
  // Core field operations
  updateField: (fieldId: string, value: any) => {
    set((state) => {
      const newFields = new Map(state.fields);
      newFields.set(fieldId, value);
      
      const newEditedFields = new Set(state.editedFields);
      newEditedFields.add(fieldId);
      
      const newSavedFields = new Set(state.savedFields);
      // Keep field in savedFields - let priority system handle status display
      
      const newFieldErrors = new Map(state.fieldErrors);
      newFieldErrors.delete(fieldId); // Clear error when field is updated
      
      // Call the callback if it exists
      if (state.onFieldsChange) {
        state.onFieldsChange(newFields);
      }
      
      return {
        fields: newFields,
        editedFields: newEditedFields,
        savedFields: newSavedFields,
        fieldErrors: newFieldErrors,
      };
    });
  },
  
  setOnFieldsChange: (callback: (fields: Map<string, any>) => void) => {
    set({ onFieldsChange: callback });
  },
  
  batchUpdateFields: (updates: Record<string, any>) => {
    set((state) => {
      const newFields = new Map(state.fields);
      const newEditedFields = new Set(state.editedFields);
      const newSavedFields = new Set(state.savedFields);
      const newFieldErrors = new Map(state.fieldErrors);
      
      Object.entries(updates).forEach(([fieldId, value]) => {
        newFields.set(fieldId, value);
        newEditedFields.add(fieldId);
        // Keep field in savedFields - let priority system handle status display
        newFieldErrors.delete(fieldId);
      });
      
      // Call the callback if it exists
      if (state.onFieldsChange) {
        state.onFieldsChange(newFields);
      }
      
      return {
        fields: newFields,
        editedFields: newEditedFields,
        savedFields: newSavedFields,
        fieldErrors: newFieldErrors,
      };
    });
  },
  
  getField: (fieldId: string) => {
    return get().fields.get(fieldId);
  },
  
  // Status operations
  markFieldEdited: (fieldId: string) => {
    set((state) => ({
      editedFields: new Set(state.editedFields).add(fieldId),
      // Keep field in savedFields - let priority system handle status display
    }));
  },
  
  markFieldSaving: (fieldId: string) => {
    set((state) => {
      const newSavingFields = new Set(state.savingFields).add(fieldId);
      const newEditedFields = new Set([...state.editedFields].filter(id => id !== fieldId));
      
      
      return {
        savingFields: newSavingFields,
        editedFields: newEditedFields,
      };
    });
  },
  
  markFieldSaved: (fieldId: string) => {
    set((state) => {
      const newSavingFields = new Set([...state.savingFields].filter(id => id !== fieldId));
      const newSavedFields = new Set(state.savedFields).add(fieldId);
      
      
      return {
        savingFields: newSavingFields,
        savedFields: newSavedFields,
      };
    });
  },
  
  clearFieldStatus: (fieldId: string) => {
    set((state) => ({
      editedFields: new Set([...state.editedFields].filter(id => id !== fieldId)),
      savingFields: new Set([...state.savingFields].filter(id => id !== fieldId)),
      savedFields: new Set([...state.savedFields].filter(id => id !== fieldId)),
    }));
  },
  
  // Error operations
  setFieldError: (fieldId: string, error: string) => {
    set((state) => {
      const newFieldErrors = new Map(state.fieldErrors);
      newFieldErrors.set(fieldId, error);
      
      return {
        fieldErrors: newFieldErrors,
        savingFields: new Set([...state.savingFields].filter(id => id !== fieldId)),
      };
    });
  },
  
  clearFieldError: (fieldId: string) => {
    set((state) => {
      const newFieldErrors = new Map(state.fieldErrors);
      newFieldErrors.delete(fieldId);
      return { fieldErrors: newFieldErrors };
    });
  },
  
  // Bulk operations
  initializeFields: (formResponse: FormResponse) => {

    set((state) => {
      const newFields = new Map();
      Object.entries(formResponse).forEach(([fieldId, value]) => {
        newFields.set(fieldId, value);
      });
      
      // PRESERVE existing saved status instead of clearing it
      return {
        fields: newFields,
        editedFields: new Set(),
        savingFields: new Set(),
        savedFields: state.savedFields, // Keep existing saved status!
        fieldErrors: new Map(),
      };
    });
  },
  
  reset: () => {
    set({
      fields: new Map(),
      editedFields: new Set(),
      savingFields: new Set(),
      savedFields: new Set(),
      fieldErrors: new Map(),
    });
  },
  
  // Computed getters
  getFieldStatus: (fieldId: string) => {
    const state = get();
    
    const hasError = state.fieldErrors.has(fieldId);
    const isSaving = state.savingFields.has(fieldId);
    const isSaved = state.savedFields.has(fieldId);
    const isEdited = state.editedFields.has(fieldId);
    
    let status: 'idle' | 'edited' | 'saving' | 'saved' | 'error';
    
    if (hasError) status = 'error';
    else if (isSaving) status = 'saving';
    else if (isSaved) status = 'saved';
    else if (isEdited) status = 'edited';
    else status = 'idle';
    
    // Only log status checks for fields that have some status (not idle)

    
    return status;
  },
  
  hasUnsavedChanges: () => {
    const state = get();
    return state.editedFields.size > 0 || state.savingFields.size > 0;
  },
  
  getUnsavedFields: () => {
    const state = get();
    return [...state.editedFields, ...state.savingFields];
  },
}));

// Hook for field-specific operations
export const useField = (fieldId: string) => {
  const store = useFieldStore();
  
  return {
    value: store.getField(fieldId),
    status: store.getFieldStatus(fieldId),
    error: store.fieldErrors.get(fieldId),
    
    setValue: (value: any) => store.updateField(fieldId, value),
    markEdited: () => store.markFieldEdited(fieldId),
    markSaving: () => store.markFieldSaving(fieldId),
    markSaved: () => store.markFieldSaved(fieldId),
    setError: (error: string) => store.setFieldError(fieldId, error),
    clearError: () => store.clearFieldError(fieldId),
    clearStatus: () => store.clearFieldStatus(fieldId),
  };
};