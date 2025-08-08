"use client";

import React, {
  useEffect,
  useCallback,
  useMemo,
  useState,
  useRef,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Home,
  FileText,
  Calendar,
  CreditCard,
  Users,
  Info,
  AlertCircle as AlertCircleIcon,
} from "lucide-react";
import clsx from "clsx";

import { FormResponse, SchemaItem, SignatureInput } from "../types/realtor";
import { useFieldStore, useField } from "./stores/fieldStore";
import FieldRenderer from "./fields/FieldRenderer";
import AddPartyModal from "./AddPartyModal";
import {
  getDealPartiesByDealOptionId,
  getDealPartiesByDealId,
  getPartiesByDealId,
} from "@/app/actions/realtor/dealClient-actions";
 

// Types for party selection
interface PartyOption {
  id: string;
  type: "deal_party" | "deal_option_party";
  label: string;
  email: string;
  role?: string;
}

interface OptimizedFormInputProps {
  schema: SchemaItem[];
  initialFormResponses: FormResponse;
  formResponseUpdateByField: (fieldId: string, value: any) => Promise<void>;
  can_edit: boolean;
  onFormChange?: (formResponses: FormResponse) => void;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  onPartyAdded?: () => void;
  loading?: boolean;
}

// Icon mapping
type IconName =
  | "MapPin"
  | "Home"
  | "FileText"
  | "Calendar"
  | "CreditCard"
  | "Users"
  | "Info"
  | "AlertCircle";

const iconMap: Record<IconName, React.FC<{ className?: string }>> = {
  MapPin: MapPin,
  Home: Home,
  FileText: FileText,
  Calendar: Calendar,
  CreditCard: CreditCard,
  Users: Users,
  Info: Info,
  AlertCircle: AlertCircleIcon,
};

const getIcon = (iconName?: string) => {
  if (!iconName || !(iconName in iconMap)) return null;
  const Icon = iconMap[iconName as IconName];
  return Icon;
};

// Tailwind classes that need to be statically included
// col-span-1 col-span-2 col-span-3 col-span-4 col-span-5 col-span-6
// col-span-7 col-span-8 col-span-9 col-span-10 col-span-11 col-span-12
// grid-cols-1 grid-cols-2 grid-cols-3 grid-cols-4

// Individual field component with isolated re-renders
const FormField: React.FC<{
  schema: SchemaItem;
  formResponseUpdateByField: (fieldId: string, value: any) => Promise<void>;
  canEdit: boolean;
  allFormResponses: FormResponse;
  visible: boolean;
  allSchemaItems?: SchemaItem[];
  partyOptions?: PartyOption[];
  onPartySelection?: (item: SchemaItem, partyId: string) => void;
  onSignatureClear?: (item: SchemaItem) => void;
  loadingParties?: boolean;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  onAddPartyClick?: () => void;
}> = ({
    schema,
    formResponseUpdateByField,
    canEdit,
    allFormResponses,
    visible,
    allSchemaItems = [],
    partyOptions = [],
    onPartySelection,
    onSignatureClear,
    loadingParties = false,
    dealId,
    dealOptionId,
    dealSide,
    dealOptionName,
    onAddPartyClick,
  }) => {
    // Use the useField hook which should handle subscriptions better
    const field = useField(schema.unique_id);
    const fieldValue = field.value ?? "";
    const fieldStatus = field.status;
    const fieldError = field.error;
    
    
    const { updateField, markFieldSaving, markFieldSaved, setFieldError, markFieldEdited } =
      useFieldStore();
    const fields = useFieldStore((state) => state.fields);

    // Create rows based on width and breakBefore

    // Debounced save handler
    const debouncedSave = useCallback(
      async (value: any) => {
        if (!canEdit) return;


        const startTime = Date.now();
        const MIN_SAVING_DURATION = 1000; // Minimum 1 second of saving state

        try {
          markFieldSaving(schema.unique_id);
          await formResponseUpdateByField(schema.unique_id, value);
          
          // Calculate how much time has passed
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_SAVING_DURATION - elapsedTime);
          
          // Ensure saving state is shown for at least MIN_SAVING_DURATION
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          markFieldSaved(schema.unique_id);
          
        } catch (error) {
          console.error("Failed to save field:", error);
          
          // Also ensure minimum duration for error state
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_SAVING_DURATION - elapsedTime);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          // Set more specific error message based on error type
          let errorMessage = "Failed to save";
          if (error instanceof Error) {
            if (error.message.includes("internet connection") || error.message.includes("Network error")) {
              errorMessage = "No internet connection";
            } else if (error.message.includes("timed out")) {
              errorMessage = "Request timed out";
            } else {
              errorMessage = error.message || "Failed to save";
            }
          }
          setFieldError(schema.unique_id, errorMessage);
        }
      },
      [
        schema.unique_id,
        formResponseUpdateByField,
        canEdit,
        markFieldSaving,
        markFieldSaved,
        setFieldError,
        allSchemaItems,
        allFormResponses,
        updateField,
      ]
    );

    // Debounce timer ref
    const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

    const handleFieldChange = useCallback(
      (value: any) => {
        if (!canEdit) return;

        // Update field immediately for optimistic UI
        updateField(schema.unique_id, value);

        // Clear existing debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Mark field as edited immediately when changed
        // This provides immediate feedback while debouncing the actual save
        markFieldEdited(schema.unique_id);

        // For checkboxes and radio buttons, the component itself handles debouncing
        // For other inputs, debounce here
        const inputType = schema.display_attributes.input_type;
        
        if (inputType === 'checkbox' || inputType === 'radio') {
          // Checkbox/Radio component handles its own debouncing internally
          // Just call save directly when onChange is triggered
          debouncedSave(value);
        } else {
          // Debounce the save operation for other input types
          debounceRef.current = setTimeout(() => {
            debouncedSave(value);
          }, 300);
        }
      },
      [canEdit, updateField, schema.unique_id, debouncedSave, markFieldEdited]
    );

    const handleFieldBlur = useCallback(
      async (value: any) => {
        if (!canEdit) return;

        // Clear debounce timer but don't save immediately on blur
        // All fields now use debounced saving only
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      },
      [canEdit]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    // Debounced save handler for linked fields
    const debouncedLinkedFieldSave = useCallback(
      async (linkedFieldId: string, value: any) => {
        if (!canEdit) return;

        const startTime = Date.now();
        const MIN_SAVING_DURATION = 1000; // Minimum 1 second of saving state

        try {
          markFieldSaving(linkedFieldId);
          await formResponseUpdateByField(linkedFieldId, value);
          
          // Calculate how much time has passed
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_SAVING_DURATION - elapsedTime);
          
          // Ensure saving state is shown for at least MIN_SAVING_DURATION
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          markFieldSaved(linkedFieldId);
        } catch (error) {
          console.error("Failed to save linked field:", error);
          
          // Also ensure minimum duration for error state
          const elapsedTime = Date.now() - startTime;
          const remainingTime = Math.max(0, MIN_SAVING_DURATION - elapsedTime);
          
          if (remainingTime > 0) {
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
          
          // Set more specific error message based on error type
          let errorMessage = "Failed to save";
          if (error instanceof Error) {
            if (error.message.includes("internet connection") || error.message.includes("Network error")) {
              errorMessage = "No internet connection";
            } else if (error.message.includes("timed out")) {
              errorMessage = "Request timed out";
            } else {
              errorMessage = error.message || "Failed to save";
            }
          }
          setFieldError(linkedFieldId, errorMessage);
        }
      },
      [
        formResponseUpdateByField,
        canEdit,
        markFieldSaving,
        markFieldSaved,
        setFieldError,
      ]
    );

    // Debounce timer ref for linked fields
    const linkedFieldDebounceRef = React.useRef<Map<string, NodeJS.Timeout>>(
      new Map()
    );

    // Track which fields are currently saving to prevent double saves
    const savingInProgress = React.useRef<Set<string>>(new Set());

    // Handle linked field changes (for checkboxes with linked fields)
    const handleLinkedFieldChange = useCallback(
      (linkedFieldId: string, value: string) => {
        if (!canEdit) return;

        // Update field value immediately for optimistic UI
        updateField(linkedFieldId, value);

        // Clear existing debounce for this field
        const existingTimeout =
          linkedFieldDebounceRef.current.get(linkedFieldId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Save immediately for linked fields (which are typically from checkboxes)
        debouncedLinkedFieldSave(linkedFieldId, value);
      },
      [canEdit, updateField, debouncedLinkedFieldSave]
    );

    const handleLinkedFieldBlur = useCallback(
      async (linkedFieldId: string, value: string) => {
        if (!canEdit) return;

        // Check if there's a pending save and clear the debounce timer
        // All fields now use debounced saving only
        const existingTimeout =
          linkedFieldDebounceRef.current.get(linkedFieldId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          linkedFieldDebounceRef.current.delete(linkedFieldId);
        }
      },
      [canEdit]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        // Clear all linked field debounce timers
        linkedFieldDebounceRef.current.forEach((timeout) => {
          clearTimeout(timeout);
        });
        linkedFieldDebounceRef.current.clear();
      };
    }, []);

    // Custom hook to handle delayed checkmark display
    const useDelayedCheckmark = (fieldStatus: string, fieldId: string) => {
      const [showCheckmark, setShowCheckmark] = useState(false);
      
      useEffect(() => {
        if (fieldStatus === "saved") {
          // Show loader for 1 second, then show checkmark
          const timer = setTimeout(() => {
            setShowCheckmark(true);
          }, 1000);
          
          return () => clearTimeout(timer);
        } else {
          // Reset when status changes away from saved
          setShowCheckmark(false);
        }
      }, [fieldStatus, fieldId]);
      
      return showCheckmark;
    };

    const showCheckmark = useDelayedCheckmark(fieldStatus, schema.unique_id);

    const renderStatusIcon = () => {
      switch (fieldStatus) {
        case "saving":
          return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
        case "saved":
          return showCheckmark ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          );
        case "error":
          return <AlertCircle className="h-4 w-4 text-red-500" />;
        default:
          return null;
      }
    };

    if (!visible) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor={schema.unique_id}
            className={clsx(
              "text-sm font-medium select-text cursor-text",
              fieldError ? "text-red-700" : "text-gray-700"
            )}
          >
            {schema.display_attributes.display_name}
            {schema.display_attributes.isRequired && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </Label>
          {renderStatusIcon()}
        </div>

        {schema.display_attributes.description &&
          schema.display_attributes.input_type !== "info" && (
            <p className="text-xs text-gray-500 mb-1">
              {schema.display_attributes.description}
            </p>
          )}

        <div className="min-h-0">
          <FieldRenderer
            schemaItem={schema}
            value={fieldValue}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            disabled={!canEdit}
            formResponses={allFormResponses}
            onLinkedFieldChange={handleLinkedFieldChange}
            onLinkedFieldBlur={handleLinkedFieldBlur}
            allSchemaItems={allSchemaItems}
            partyOptions={partyOptions}
            onPartySelection={onPartySelection}
            onSignatureClear={onSignatureClear}
            loadingParties={loadingParties}
            dealId={dealId}
            dealOptionId={dealOptionId}
            dealSide={dealSide}
            dealOptionName={dealOptionName}
            onAddPartyClick={onAddPartyClick}
          />
        </div>

        {fieldError && <p className="text-sm text-red-600">{fieldError}</p>}
      </div>
    );
  };

// Loading skeleton component
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 w-full">
      {/* Skeleton for standalone info items */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-blue-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-blue-200 rounded w-1/2"></div>
      </div>

      {/* Skeleton for form groups */}
      {[1, 2, 3].map((groupIndex) => (
        <div key={groupIndex} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {/* Group header skeleton */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 bg-gray-300 rounded animate-pulse"></div>
                <div className="flex-1">
                  <div className="h-5 bg-gray-300 rounded w-32 mb-2 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 animate-pulse"></div>
                </div>
              </div>
              <div className="h-5 w-5 bg-gray-300 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Group content skeleton */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Row 1 - full width field */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Row 2 - two half-width fields */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>
                </div>
                <div className="col-span-6">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Row 3 - three fields */}
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>
                </div>
                <div className="col-span-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Main optimized form component
const OptimizedFormInput: React.FC<OptimizedFormInputProps> = ({
  schema,
  initialFormResponses,
  formResponseUpdateByField,
  can_edit,
  onFormChange,
  dealId,
  dealOptionId,
  dealSide,
  dealOptionName,
  onPartyAdded,
  loading = false,
}) => {
  // Debug logging for props
  const initializeFields = useFieldStore((state) => state.initializeFields);
  const fields = useFieldStore((state) => state.fields);
  const updateField = useFieldStore((state) => state.updateField);
  const setOnFieldsChange = useFieldStore((state) => state.setOnFieldsChange);
  const [collapsedBlocks, setCollapsedBlocks] = useState<Set<string>>(
    new Set()
  );

  // Add party modal state
  const [isAddPartyModalOpen, setIsAddPartyModalOpen] = useState(false);
  
  // Party selection state
  const [partyOptions, setPartyOptions] = useState<PartyOption[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);

  // Track previous checkbox selections to detect unchecking
  const previousCheckboxSelections = useRef<Map<string, string[]>>(new Map());

  // Helper function to get empty value for a field type
  const getEmptyValue = useCallback((schemaItem: SchemaItem): any => {
    const { input_type } = schemaItem.display_attributes;

    switch (input_type) {
      case "checkbox":
        return [];
      case "signature":
        return {};
      case "fileUpload":
        return null;
      default:
        return "";
    }
  }, []);

  // Load party options for signature fields
  const loadPartyOptions = useCallback(async () => {
    
    if (!dealId && !dealOptionId) {
      return;
    }

    setLoadingParties(true);
    try {
      const parties = [];

      // Load deal parties if dealId exists
      if (dealId) {
        const dealParties = await getDealPartiesByDealId(dealId);
        for (const dp of dealParties) {
          parties.push({
            id: `deal_party_${dp.id}`,
            type: "deal_party" as const,
            label: `${dp.party_email} (${dp.party_role})`,
            email: dp.party_email,
            role: dp.party_role,
          });
        }
      }

      // Load deal option parties if dealOptionId exists
      if (dealOptionId) {
        const dealOptionParties = await getDealPartiesByDealOptionId(dealOptionId);
        for (const dop of dealOptionParties) {
          parties.push({
            id: `deal_option_party_${dop.id}`,
            type: "deal_option_party" as const,
            label: `${dop.party_email} (${dop.party_role})`,
            email: dop.party_email,
            role: dop.party_role,
          });
        }
      }

      setPartyOptions(parties);
    } catch (error) {
      console.error("Failed to load parties:", error);
    } finally {
      setLoadingParties(false);
    }
  }, [dealId, dealOptionId]);

  // Load parties when component mounts or dependencies change
  useEffect(() => {
    loadPartyOptions();
  }, [loadPartyOptions]);

  // Initialize store with form data
  useEffect(() => {
    initializeFields(initialFormResponses);
  }, [initialFormResponses, initializeFields]);

  // Set up the fields change callback
  useEffect(() => {
    if (onFormChange) {
      setOnFieldsChange((fields) => {
        const responses: FormResponse = {};
        fields.forEach((value, key) => {
          responses[key] = value;
        });
        onFormChange(responses);
      });
    }
    
    // Cleanup
    return () => {
      setOnFieldsChange(() => {});
    };
  }, [onFormChange, setOnFieldsChange]);

  // Create form responses object from store fields
  const formResponses = useMemo(() => {
    const responses: FormResponse = {};
    fields.forEach((value, key) => {
      responses[key] = value;
    });
    return responses;
  }, [fields]);

  // Get all linked field IDs to hide them from main display
  const linkedFieldIds = useMemo(() => {
    const linkedIds = new Set<string>();
    
    schema.forEach((item) => {
      if (item.display_attributes.checkbox_options?.options) {
        item.display_attributes.checkbox_options.options.forEach((option) => {
          if (option.linkedFields) {
            option.linkedFields.forEach((linkedId) => linkedIds.add(linkedId));
          }
        });
      }
    });
    
    return linkedIds;
  }, [schema]);


  // Handle party selection for signature fields
  const handlePartySelection = useCallback(
    async (item: SchemaItem, partyId: string) => {
      if (partyId === "__none__") {
        updateField(item.unique_id, "");
        await formResponseUpdateByField(item.unique_id, "");
        return;
      }

      const selectedParty = partyOptions.find((p) => p.id === partyId);
      if (!selectedParty) return;

      const signatureInput: SignatureInput = {
        actionAs: "signer",
        email: selectedParty.email,
      };

      updateField(item.unique_id, signatureInput);
      await formResponseUpdateByField(item.unique_id, signatureInput);
    },
    [partyOptions, updateField, formResponseUpdateByField]
  );

  // Handle signature field clearing
  const handleSignatureClear = useCallback(
    async (item: SchemaItem) => {
      updateField(item.unique_id, {});
      await formResponseUpdateByField(item.unique_id, undefined);
    },
    [updateField, formResponseUpdateByField]
  );

  // Handle party added callback 
  const handlePartyAdded = useCallback(() => {
    loadPartyOptions();
    onPartyAdded?.();
  }, [loadPartyOptions, onPartyAdded]);

  // Check visibility conditions
  const checkVisibility = useCallback(
    (item: SchemaItem): boolean => {
      if (item.display_attributes.isHidden) return false;

      // Hide items that are linked checkbox fields (they appear inside their parent)
      if (linkedFieldIds.has(item.unique_id)) return false;

      if (
        !item.display_attributes.visibleIf ||
        item.display_attributes.visibleIf.length === 0
      )
        return true;

      // All conditions must be true
      return item.display_attributes.visibleIf.every((condition) => {
        const fieldValue = formResponses[condition.unique_id];
        const checkValue = condition.valueChecked;

        switch (condition.operation) {
          case "==":
            return String(fieldValue) === String(checkValue);
          case "!==":
            return String(fieldValue) !== String(checkValue);
          case ">":
            return Number(fieldValue) > Number(checkValue);
          case ">=":
            return Number(fieldValue) >= Number(checkValue);
          case "<":
            return Number(fieldValue) < Number(checkValue);
          case "<=":
            return Number(fieldValue) <= Number(checkValue);
          case "contains":
            // For checkbox arrays, check if the array contains the value
            if (Array.isArray(fieldValue)) {
              return fieldValue.includes(checkValue);
            } else {
              return String(fieldValue).includes(String(checkValue));
            }
          case "doesNotContain":
            // For checkbox arrays, check if the array does NOT contain the value
            if (Array.isArray(fieldValue)) {
              return !fieldValue.includes(checkValue);
            } else {
              return !String(fieldValue).includes(String(checkValue));
            }
          default:
            return true;
        }
      });
    },
    [formResponses, linkedFieldIds]
  );

  const toggleBlockCollapse = (blockTitle: string) => {
    setCollapsedBlocks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blockTitle)) {
        newSet.delete(blockTitle);
      } else {
        newSet.add(blockTitle);
      }
      return newSet;
    });
  };

  // Track visibility and clear hidden fields
  useEffect(() => {
    const visibilityMap = new Map<string, boolean>();

    // First, check all fields' visibility
    schema.forEach((item) => {
      const isVisible = checkVisibility(item);
      visibilityMap.set(item.unique_id, isVisible);
    });

    // Clear values for fields that are not visible (but skip linked checkbox fields)
    visibilityMap.forEach((isVisible, fieldId) => {
      if (!isVisible) {
        // Skip if this is a linked checkbox field - those are handled separately
        if (linkedFieldIds.has(fieldId)) {
          return;
        }

        const currentValue = fields.get(fieldId);
        const schemaItem = schema.find((s) => s.unique_id === fieldId);

        if (schemaItem && currentValue !== undefined && currentValue !== null) {
          const emptyValue = getEmptyValue(schemaItem);

          // Check if value is already empty
          const isEmpty =
            (Array.isArray(currentValue) && currentValue.length === 0) ||
            (typeof currentValue === "object" &&
              Object.keys(currentValue).length === 0) ||
            currentValue === "" ||
            currentValue === null;

          if (!isEmpty) {
            // Update field value to empty
            updateField(fieldId, emptyValue);

            // Also update in backend if we can edit
            if (can_edit) {
              formResponseUpdateByField(fieldId, emptyValue).catch((error) => {
                console.error(
                  `Failed to clear hidden field ${fieldId}:`,
                  error
                );
              });
            }
          }
        }
      }
    });

    // Also clear linked checkbox fields when parent is unchecked
    schema.forEach((item) => {
      if (item.display_attributes.checkbox_options?.options) {
        const currentValue = fields.get(item.unique_id) || [];
        const selectedOptions = Array.isArray(currentValue) ? currentValue : [];
        const previousSelections =
          previousCheckboxSelections.current.get(item.unique_id) || [];

        // Update the previous selections for next run
        previousCheckboxSelections.current.set(item.unique_id, [
          ...selectedOptions,
        ]);

        // Find options that were unchecked (were in previous but not in current)
        const uncheckedOptions = previousSelections.filter(
          (prevOption) => !selectedOptions.includes(prevOption)
        );

        // Only clear linked fields for options that were actually unchecked
        item.display_attributes.checkbox_options.options.forEach((option) => {
          if (
            option.linkedFields &&
            uncheckedOptions.includes(option.databaseStored)
          ) {
            // This option was just unchecked, clear its linked fields
            option.linkedFields.forEach((linkedFieldId) => {
              const linkedValue = fields.get(linkedFieldId);
              const linkedSchema = schema.find(
                (s) => s.unique_id === linkedFieldId
              );

              if (
                linkedSchema &&
                linkedValue !== undefined &&
                linkedValue !== null
              ) {
                const emptyValue = getEmptyValue(linkedSchema);

                // Check if value is already empty
                const isEmpty =
                  (Array.isArray(linkedValue) && linkedValue.length === 0) ||
                  (typeof linkedValue === "object" &&
                    Object.keys(linkedValue).length === 0) ||
                  linkedValue === "" ||
                  linkedValue === null;

                if (!isEmpty) {
                  updateField(linkedFieldId, emptyValue);

                  if (can_edit) {
                    formResponseUpdateByField(linkedFieldId, emptyValue).catch(
                      (error) => {
                        console.error(
                          `Failed to clear linked field ${linkedFieldId}:`,
                          error
                        );
                      }
                    );
                  }
                }
              }
            });
          }
        });
      }
    });
  }, [
    formResponses,
    schema,
    checkVisibility,
    fields,
    updateField,
    formResponseUpdateByField,
    can_edit,
    getEmptyValue,
    linkedFieldIds,
  ]);

  // Group schema items with rows for grid layout
  const groupedSchema = useMemo(() => {
    const createRows = (items: SchemaItem[]): SchemaItem[][] => {
      const rows: SchemaItem[][] = [];
      let currentRow: SchemaItem[] = [];
      let currentRowWidth = 0;

      items.forEach((item) => {
        const itemWidth = item.display_attributes.width || 12;
        const breakBefore = item.display_attributes.breakBefore || false;

        // Start new row if breakBefore is true or width exceeds 12
        if (breakBefore || currentRowWidth + itemWidth > 12) {
          if (currentRow.length > 0) {
            rows.push(currentRow);
          }
          currentRow = [item];
          currentRowWidth = itemWidth;
        } else {
          currentRow.push(item);
          currentRowWidth += itemWidth;
        }
      });

      if (currentRow.length > 0) {
        rows.push(currentRow);
      }

      return rows;
    };

    const groups: {
      title?: string;
      items: SchemaItem[];
      rows: SchemaItem[][];
      visibleItems: SchemaItem[];
      style?: {
        title?: string;
        description?: string;
        icon?: string;
        color_theme?: "blue" | "green" | "purple" | "orange" | "gray";
      };
    }[] = [];
    let currentGroup: {
      title?: string;
      items: SchemaItem[];
      rows: SchemaItem[][];
      visibleItems: SchemaItem[];
      style?: {
        title?: string;
        description?: string;
        icon?: string;
        color_theme?: "blue" | "green" | "purple" | "orange" | "gray";
      };
    } = { items: [], rows: [], visibleItems: [] };

    schema.forEach((item) => {
      // Skip standalone info items without blocks - they're rendered separately
      if (!item.display_attributes.block && item.display_attributes.input_type === "info") {
        return;
      }
      
      if (item.display_attributes.block) {
        // Check if this is a new block or continuation of current block
        if (currentGroup.title !== item.display_attributes.block) {
          // Start new group
          if (currentGroup.items.length > 0) {
            // Process rows for current group before pushing
            currentGroup.visibleItems = currentGroup.items.filter((item) =>
              checkVisibility(item)
            );
            if (currentGroup.visibleItems.length > 0) {
              currentGroup.rows = createRows(currentGroup.visibleItems);
              groups.push(currentGroup);
            }
          }
          currentGroup = {
            title: item.display_attributes.block,
            style: item.display_attributes.block_style,
            items: [item],
            rows: [],
            visibleItems: [],
          };
        } else {
          // Same block, add to current group
          currentGroup.items.push(item);
        }
      } else {
        currentGroup.items.push(item);
      }
    });

    if (currentGroup.items.length > 0) {
      currentGroup.visibleItems = currentGroup.items.filter((item) =>
        checkVisibility(item)
      );
      if (currentGroup.visibleItems.length > 0) {
        currentGroup.rows = createRows(currentGroup.visibleItems);
        groups.push(currentGroup);
      }
    }

    return groups;
  }, [schema, checkVisibility]);

  // Show form statistics for debugging (simplified to avoid infinite loops)
  const fieldCount = schema.length;

  // Show loading skeleton if loading
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-4 w-full">
      {/* Render standalone info items without blocks first */}
      {schema
        .filter((item) => 
          !item.display_attributes.block && 
          item.display_attributes.input_type === "info" &&
          checkVisibility(item)
        )
        .map((item) => (
          <FormField
            key={item.unique_id}
            schema={item}
            formResponseUpdateByField={formResponseUpdateByField}
            canEdit={can_edit}
            allFormResponses={formResponses}
            visible={true}
            allSchemaItems={schema}
            partyOptions={partyOptions}
            onPartySelection={handlePartySelection}
            onSignatureClear={handleSignatureClear}
            loadingParties={loadingParties}
            dealId={dealId}
            dealOptionId={dealOptionId}
            dealSide={dealSide}
            dealOptionName={dealOptionName}
            onAddPartyClick={() => setIsAddPartyModalOpen(true)}
          />
        ))}
      
      {groupedSchema.map((group, groupIndex) => {
        const getThemeClasses = (theme?: string) => {
          switch (theme) {
            case "blue":
              return "border-blue-200 bg-blue-50";
            case "green":
              return "border-green-200 bg-green-50";
            case "purple":
              return "border-purple-200 bg-purple-50";
            case "orange":
              return "border-orange-200 bg-orange-50";
            case "gray":
              return "border-gray-200 bg-gray-50";
            default:
              return "border-gray-200 bg-white";
          }
        };

        const getHeaderTextClass = (theme?: string) => {
          switch (theme) {
            case "blue":
              return "text-blue-900";
            case "green":
              return "text-green-900";
            case "purple":
              return "text-purple-900";
            case "orange":
              return "text-orange-900";
            case "gray":
              return "text-gray-900";
            default:
              return "text-gray-900";
          }
        };

        const blockKey =
          group.style?.title || group.title || `group-${groupIndex}`;
        const isCollapsed = collapsedBlocks.has(blockKey);
        const IconComponent = group.style?.icon
          ? getIcon(group.style.icon)
          : null;

        return (
          <Card
            key={groupIndex}
            className="shadow-sm bg-white border border-gray-200 overflow-hidden"
          >
            {(group.title || group.style?.title) && (
              <div
                className={clsx(
                  "px-6 py-4 border-b border-gray-200 cursor-pointer select-none transition-colors rounded-t-lg",
                  getThemeClasses(group.style?.color_theme),
                  "hover:opacity-90"
                )}
                onClick={() => toggleBlockCollapse(blockKey)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {IconComponent && <IconComponent className="h-6 w-6" />}
                    <div>
                      <h3
                        className={clsx(
                          "text-lg font-semibold",
                          getHeaderTextClass(group.style?.color_theme)
                        )}
                      >
                        {group.style?.title || group.title}
                      </h3>
                      {group.style?.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {group.style.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {isCollapsed ? (
                    <ChevronDown className="h-5 w-5 text-gray-700" />
                  ) : (
                    <ChevronUp className="h-5 w-5 text-gray-700" />
                  )}
                </div>
              </div>
            )}
            {!isCollapsed && (
              <CardContent className="p-6 bg-white">
                <div className="space-y-4 w-full overflow-hidden">
                  {group.rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="grid grid-cols-12 gap-4 w-full"
                    >
                      {row.map((item) => {
                        const itemWidth = item.display_attributes.width || 12;
                        // Use static classes for Tailwind to detect them
                        const getColSpanClass = (width: number) => {
                          switch (width) {
                            case 1:
                              return "col-span-1";
                            case 2:
                              return "col-span-2";
                            case 3:
                              return "col-span-3";
                            case 4:
                              return "col-span-4";
                            case 5:
                              return "col-span-5";
                            case 6:
                              return "col-span-6";
                            case 7:
                              return "col-span-7";
                            case 8:
                              return "col-span-8";
                            case 9:
                              return "col-span-9";
                            case 10:
                              return "col-span-10";
                            case 11:
                              return "col-span-11";
                            default:
                              return "col-span-12";
                          }
                        };
                        return (
                          <div
                            key={item.unique_id}
                            className={getColSpanClass(itemWidth)}
                          >
                            <FormField
                              schema={item}
                              formResponseUpdateByField={
                                formResponseUpdateByField
                              }
                              canEdit={can_edit}
                              allFormResponses={formResponses}
                              visible={true}
                              allSchemaItems={schema}
                              partyOptions={partyOptions}
                              onPartySelection={handlePartySelection}
                              onSignatureClear={handleSignatureClear}
                              loadingParties={loadingParties}
                              dealId={dealId}
                              dealOptionId={dealOptionId}
                              dealSide={dealSide}
                              dealOptionName={dealOptionName}
                              onAddPartyClick={() => setIsAddPartyModalOpen(true)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
      
      {/* Add Party Modal */}
      <AddPartyModal
        isOpen={isAddPartyModalOpen}
        onClose={() => setIsAddPartyModalOpen(false)}
        onPartyAdded={handlePartyAdded}
        dealId={dealId}
        dealOptionId={dealOptionId}
        dealSide={dealSide}
        dealOptionName={dealOptionName}
      />
    </div>
  );
};

export default OptimizedFormInput;
