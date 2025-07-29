/* ----------------------------------------------------------------------
 * FormInput.tsx — fixed grid-width logic + nicer spacing
 * ------------------------------------------------------------------- */
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  Fragment,
} from "react";
import clsx from "clsx";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  Upload,
  X,
  Info,
  MapPin,
  Home,
  FileText,
  Calendar,
  CreditCard,
  Users,
  AlertCircle,
  CalendarIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarWidget } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  FormResponse,
  SchemaItem,
  SignatureInput,
  FileUpload,
} from "@/types/schema";

/* ------------------------------------------------------------------ */
/* Types and Icon/Theme Mapping                                       */
/* ------------------------------------------------------------------ */

type IconName =
  | "MapPin"
  | "Home"
  | "FileText"
  | "Calendar"
  | "CreditCard"
  | "Users"
  | "Info"
  | "AlertCircle";

type ThemeColor = "blue" | "green" | "purple" | "orange" | "gray";

type ThemeConfig = {
  border: string;
  bg: string;
  text: string;
  icon: string;
  header: string;
};

type GroupWithStyle = {
  id: string;
  name?: string;
  items: SchemaItem[];
  style?: {
    title?: string;
    description?: string;
    icon?: string;
    color_theme?: ThemeColor;
  };
};

//eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<IconName, React.ComponentType<any>> = {
  MapPin,
  Home,
  FileText,
  Calendar,
  CreditCard,
  Users,
  Info,
  AlertCircle,
};

const themeColors: Record<ThemeColor, ThemeConfig> = {
  blue: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "text-blue-600",
    header: "bg-blue-50",
  },
  green: {
    border: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: "text-green-600",
    header: "bg-green-50",
  },
  purple: {
    border: "border-l-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    icon: "text-purple-600",
    header: "bg-purple-50",
  },
  orange: {
    border: "border-l-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-700",
    icon: "text-orange-600",
    header: "bg-orange-50",
  },
  gray: {
    border: "border-l-gray-400",
    bg: "bg-gray-50",
    text: "text-gray-700",
    icon: "text-gray-600",
    header: "bg-gray-50",
  },
};

/* ------------------------------------------------------------------ */
/* Width helpers                                                      */
/* ------------------------------------------------------------------ */

const MAX_GRID = 12;

/** A static palette of span classes so Tailwind's scanner picks them up */
const SPAN_CLASSES = [
  "col-span-1",
  "col-span-2",
  "col-span-3",
  "col-span-4",
  "col-span-5",
  "col-span-6",
  "col-span-7",
  "col-span-8",
  "col-span-9",
  "col-span-10",
  "col-span-11",
  "col-span-12",
] as const;

/** Map a SchemaItem → grid span class (defaults to full width) */
const getSpanClass = (item: SchemaItem): string => {
  const gotWidth: number = item.display_attributes.width ?? MAX_GRID;
  return SPAN_CLASSES[gotWidth - 1];
};

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

interface FormInputProps {
  schema: SchemaItem[];
  formResponseUpdateByField?: (
    itemKey: string,
    newValue: string | string[] | SignatureInput
  ) => Promise<void>;
  initialFormResponses: FormResponse;
  can_edit: boolean;
  isLoading?: boolean;
  showProgress?: boolean;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  onPartyAdded?: () => void;
  handleFileUpload?: (file: File[], fieldId: string) => Promise<void>;
  clientIntakeWillSend?: string[]; //unique ids of fields that will be sent from client intakes
}

const FormInput: React.FC<FormInputProps> = ({
  schema,
  formResponseUpdateByField = async () => {},
  initialFormResponses,
  can_edit,
  isLoading = false,
  handleFileUpload,
  clientIntakeWillSend = [],
}) => {
  /* --------------------------- state & effects -------------------- */

  const [formResponses, setFormResponses] =
    useState<FormResponse>(initialFormResponses);
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());
  const [editedItems, setEditedItems] = useState<Set<string>>(new Set());
  // Local state for tracking file upload status per field
  const [uploadingFields, setUploadingFields] = useState<Set<string>>(
    new Set()
  );

  // State to track actual File objects per field for idempotent uploads
  const [fieldFiles, setFieldFiles] = useState<Record<string, File[]>>({});
  
  // State for date picker popover open/close state per field
  const [datePickerOpenStates, setDatePickerOpenStates] = useState<Record<string, boolean>>({});
  // State for date picker month view per field
  const [datePickerMonths, setDatePickerMonths] = useState<Record<string, Date>>({});
  // State for date picker input values per field
  const [datePickerValues] = useState<Record<string, string>>({});
  
  // State for minimized info items
  const [minimizedInfoItems, setMinimizedInfoItems] = useState<Set<string>>(new Set());

  // State to track which client intake fields are being edited
  const [editingClientIntakeFields, setEditingClientIntakeFields] = useState<
    Set<string>
  >(new Set());

  // --- label truncation state ---
  const labelRefs = React.useRef<Record<string, HTMLElement | null>>({});
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [truncatedLabels, setTruncatedLabels] = React.useState<
    Record<string, boolean>
  >({});
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Memoize the schema grouping to prevent recalculation on every render
  const groupedSchema = useMemo(() => {
    const groups: GroupWithStyle[] = [];
    const ungroupedItems: SchemaItem[] = [];
    let current: GroupWithStyle | null = null;

    // First, collect all linked field IDs
    const linkedFieldIds = new Set<string>();
    schema.forEach(schemaItem => {
      if (schemaItem.display_attributes.input_type === 'checkbox' && 
          schemaItem.display_attributes.checkbox_options?.options) {
        schemaItem.display_attributes.checkbox_options.options.forEach(option => {
          option.linkedFields?.forEach(fieldId => linkedFieldIds.add(fieldId));
        });
      }
    });

    schema.forEach((item) => {
      // Skip fields that are linked to checkboxes (they'll be rendered inside the checkbox)
      if (linkedFieldIds.has(item.unique_id)) {
        return;
      }
      
      // If item has no block, add it to ungrouped items
      if (!item.display_attributes.block) {
        ungroupedItems.push(item);
        return;
      }

      const blockId = `${item.display_attributes.block}__${groups.length}`;
      if (
        current &&
        item.display_attributes.block &&
        current.name === item.display_attributes.block
      ) {
        current.items.push(item);
      } else {
        current = {
          id: blockId,
          name: item.display_attributes.block,
          items: [item],
          style: item.display_attributes.block_style || {
            color_theme: "gray" as ThemeColor,
          },
        };
        groups.push(current);
      }
    });

    return { groups, ungroupedItems };
  }, [schema]);

  // Memoize the truncation check function
  const checkTruncation = useCallback(() => {
    const newTruncated: Record<string, boolean> = {};

    schema.forEach((item) => {
      const ref = labelRefs.current[item.unique_id];
      if (ref) {
        newTruncated[item.unique_id] = ref.scrollWidth > ref.clientWidth + 1;
      }
    });
    setTruncatedLabels(newTruncated);
  }, [schema]);

  // Batch observer setup
  useEffect(() => {
    if (!containerRef.current) return;

    let mutationObserver: MutationObserver | null = null;
    const resizeObservers = new Map();

    // Only set up observers if we have items to observe
    if (schema.length > 0) {
      mutationObserver = new MutationObserver((mutations) => {
        const shouldCheck = mutations.some((mutation) => {
          return Array.from(mutation.addedNodes).some((node) => {
            if (node instanceof HTMLElement) {
              return node.tagName === "LABEL" || node.querySelector("label");
            }
            return false;
          });
        });

        if (shouldCheck) {
          requestAnimationFrame(checkTruncation);
        }
      });

      mutationObserver.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      // Initial check
      requestAnimationFrame(checkTruncation);

      // Set up ResizeObserver for each label
      schema.forEach((item) => {
        const ref = labelRefs.current[item.unique_id];
        if (ref) {
          const resizeObserver = new ResizeObserver(() => {
            requestAnimationFrame(checkTruncation);
          });
          resizeObserver.observe(ref);
          resizeObservers.set(item.unique_id, resizeObserver);
        }
      });
    }

    return () => {
      mutationObserver?.disconnect();
      resizeObservers.forEach((observer) => observer.disconnect());
    };
  }, [checkTruncation, schema]);

  useEffect(() => {
    setFormResponses(initialFormResponses);
  }, [initialFormResponses]);

  /* --------------------------- handlers --------------------------- */
  const handleFieldChange = useCallback(
    (item: SchemaItem, newValue: string | string[] |  SignatureInput) => {
      if (!can_edit) return;
      setFormResponses((prev) => ({
        ...prev,
        [item.unique_id]: newValue,
      }));
      setEditedItems((prev) => new Set(prev).add(item.unique_id));
      setSavedItems((prev) => {
        const next = new Set(prev);
        next.delete(item.unique_id);
        return next;
      });
    },
    [can_edit]
  );

  const handleFieldBlur = useCallback(
    async (item: SchemaItem, newValue: string | string[] | SignatureInput) => {
      if (!can_edit || !editedItems.has(item.unique_id)) return;
      setSavingItems((prev) => new Set(prev).add(item.unique_id));
      try {
        await formResponseUpdateByField(item.unique_id, newValue);
        toast.success("Field updated successfully.");
        setSavedItems((prev) => new Set(prev).add(item.unique_id));
        setEditedItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
        // Clear client intake editing state if field has value now
        if (newValue && editingClientIntakeFields.has(item.unique_id)) {
          setEditingClientIntakeFields((prev) => {
            const updated = new Set(prev);
            updated.delete(item.unique_id);
            return updated;
          });
        }
      } catch (err) {
        toast.error("Failed to update field.");
        console.error("Save failed:", err);
      } finally {
        setSavingItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
      }
    },
    [
      can_edit,
      editedItems,
      formResponseUpdateByField,
      editingClientIntakeFields,
    ]
  );

  // Force save for dropdown selections - bypasses editedItems check
  const handleForceSave = useCallback(
    async (item: SchemaItem, newValue: string | string[] | SignatureInput) => {
      if (!can_edit) return;
      setSavingItems((prev) => new Set(prev).add(item.unique_id));
      try {
        await formResponseUpdateByField(item.unique_id, newValue);
        toast.success("Field updated successfully.");
        setSavedItems((prev) => new Set(prev).add(item.unique_id));
        setEditedItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
        // Clear client intake editing state if field has value now
        if (newValue && editingClientIntakeFields.has(item.unique_id)) {
          setEditingClientIntakeFields((prev) => {
            const updated = new Set(prev);
            updated.delete(item.unique_id);
            return updated;
          });
        }
      } catch (err) {
        toast.error("Failed to update field.");
        console.error("Save failed:", err);
      } finally {
        setSavingItems((prev) => {
          const updated = new Set(prev);
          updated.delete(item.unique_id);
          return updated;
        });
      }
    },
    [can_edit, formResponseUpdateByField, editingClientIntakeFields]
  );

  // Helper function to handle idempotent file uploads
  const handleFileChange = useCallback(
    async (fieldId: string, newFiles: File[]) => {
      if (!handleFileUpload) return;

      // Set uploading state
      setUploadingFields((prev) => new Set(prev).add(fieldId));

      try {
        // Send all files for this field (idempotent)
        await handleFileUpload(newFiles, fieldId);

        // Update local state
        setFieldFiles((prev) => ({
          ...prev,
          [fieldId]: newFiles,
        }));

        // Update form response for UI display
        const newFileUpload: FileUpload = {
          files: newFiles.map((f) => f.name),
          count: newFiles.length,
        };

        if (newFiles.length > 0) {
          setFormResponses((prev) => ({
            ...prev,
            [fieldId]: newFileUpload,
          }));
        } else {
          // Remove from form responses if no files
          setFormResponses((prev) => {
            const newResponses = { ...prev };
            delete newResponses[fieldId];
            return newResponses;
          });
        }

        toast.success(
          newFiles.length > 0
            ? "Files updated successfully"
            : "File removed successfully"
        );
      } catch (error) {
        console.error("File upload error:", error);
        toast.error("File operation failed");
      } finally {
        // Clear uploading state
        setUploadingFields((prev) => {
          const newSet = new Set(prev);
          newSet.delete(fieldId);
          return newSet;
        });
      }
    },
    [handleFileUpload]
  );

  // Helper function to add a file to a field
  const addFileToField = useCallback(
    async (fieldId: string, newFile: File) => {
      const currentFiles = fieldFiles[fieldId] || [];
      const updatedFiles = [...currentFiles, newFile];
      await handleFileChange(fieldId, updatedFiles);
    },
    [fieldFiles, handleFileChange]
  );

  // Helper function to remove a file from a field
  const removeFileFromField = useCallback(
    async (fieldId: string, fileIndex: number) => {
      const currentFiles = fieldFiles[fieldId] || [];
      const updatedFiles = currentFiles.filter(
        (_, index) => index !== fileIndex
      );
      await handleFileChange(fieldId, updatedFiles);
    },
    [fieldFiles, handleFileChange]
  );

  /* --------------------------- helpers ---------------------------- */

  const isFieldVisible = useCallback(
    (uniqueId: string, operation: string, valueChecked: string): boolean => {
      if (
        schema.find((item) => item.unique_id === uniqueId)?.display_attributes
          .isHidden
      )
        return false;

      const fieldValue = formResponses[uniqueId];
      if (typeof fieldValue !== "string" && !Array.isArray(fieldValue)) return false;
      const operators: Record<string, (a: string | string[], b: string) => boolean> = {
        ">": (a, b) => 
          {
            if (Array.isArray(a)) {
              return a.some((item) => parseInt(item) > parseInt(b));
            }
            return parseInt(a) > parseInt(b);
          },
        ">=": (a, b) => 
          {
            if (Array.isArray(a)) {
              return a.some((item) => parseInt(item) >= parseInt(b));
            }
            return parseInt(a) >= parseInt(b);
          },
        "<": (a, b) => 
          {
            if (Array.isArray(a)) {
              return a.some((item) => parseInt(item) < parseInt(b));
            }
            return parseInt(a) < parseInt(b);
          },
        "<=": (a, b) => 
          {
            if (Array.isArray(a)) {
              return a.some((item) => parseInt(item) <= parseInt(b));
            }
            return parseInt(a) <= parseInt(b);
          },
        "==": (a, b) => 
          {
            if (Array.isArray(a)) {
              return a.some((item) => item === b);
            }
            return a === b;
          },
        "!==": (a, b) => 
          {
            if (Array.isArray(a)) {
              return a.some((item) => item !== b);
            }
            return a !== b;
          },
        "contains": (a, b) => 
          {
            return a.includes(b);
          },
        "doesNotContain": (a, b) => {
          return !a.includes(b);
        }
      };
      const operatorFn = operators[operation];
      return operatorFn ? operatorFn(fieldValue, valueChecked) : false;
    },
    [formResponses, schema]
  );

  // Helper function to check if a specific field should be visible
  const checkFieldVisibility = useCallback(
    (item: SchemaItem): boolean => {
      // First check if the field is hidden
      if (item.display_attributes.isHidden) {
        return false;
      }

      // Then check visibleIf conditions
      return (
        !item.display_attributes.visibleIf ||
        item.display_attributes.visibleIf.length === 0 ||
        item.display_attributes.visibleIf.every(
          (cond) =>
            cond.unique_id &&
            cond.operation &&
            cond.valueChecked !== undefined &&
            cond.valueChecked !== null &&
            isFieldVisible(cond.unique_id, cond.operation, cond.valueChecked)
        )
      );
    },
    [isFieldVisible]
  );

  // Filter blocks to only show those with at least one visible field
  const visibleGroupedSchema = useMemo(() => {
    return groupedSchema.groups.filter((group) =>
      group.items.some((item) => checkFieldVisibility(item))
    );
  }, [groupedSchema, checkFieldVisibility]);

  /* ------------------------ group schema -------------------------- */

  const getBlockTheme = useCallback(
    (group: GroupWithStyle, index: number): ThemeConfig => {
      if (group.style?.color_theme && group.style.color_theme in themeColors) {
        return themeColors[group.style.color_theme];
      }
      // Fallback theme
      const themes: ThemeColor[] = ["blue", "green", "purple", "orange"];
      const themeName = themes[index % themes.length];
      return themeColors[themeName];
    },
    []
  );

  const formatBlockName = useCallback(
    (name: string) => name.replace(/_/g, " "),
    []
  );

  const getBlockIcon = useCallback(
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    (group: GroupWithStyle): React.ComponentType<any> => {
      if (group.style?.icon && group.style.icon in iconMap) {
        return iconMap[group.style.icon as IconName];
      }
      return FileText; // Default icon
    },
    []
  );

  /* --------------------------- renderers -------------------------- */
  const renderField = useCallback(
    (item: SchemaItem) => {
      const visible = checkFieldVisibility(item);
      if (!visible) return null;

      // Check if this is a client intake field
      const isClientIntakeField = clientIntakeWillSend.includes(item.unique_id);
      const hasExistingValue = !!formResponses[item.unique_id];
      const isEditingClientIntake = editingClientIntakeFields.has(
        item.unique_id
      );

      // Determine if field should be disabled for client intake
      const shouldDisableForClientIntake =
        can_edit &&
        isClientIntakeField &&
        !hasExistingValue &&
        !isEditingClientIntake;

      const StatusIcon = () => (
        <Fragment>
          {savingItems.has(item.unique_id) ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : savedItems.has(item.unique_id) && (item.display_attributes.input_type !== "checkbox") ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : null}
        </Fragment>
      );

      const containerClass = clsx(
        getSpanClass(item),
        "flex flex-col space-y-1.5 justify-start",
        item.display_attributes.breakBefore && "col-start-1"
      );

      const { input_type } = item.display_attributes;
      const specialInput = item.display_attributes.special_input;

      // Render different input types
      switch (input_type) {
        case "text":
          // Handle special text inputs
          if (specialInput?.text?.date) {
            const dateValue = formResponses[item.unique_id] as string || "";
            const datePickerValue = datePickerValues[item.unique_id] || "";
            const displayValue = dateValue || datePickerValue;
            
            return (
              <div key={item.unique_id} className={containerClass}>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <span>{item.display_attributes.display_name}</span>
                      {item.display_attributes.isRequired && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <StatusIcon />
                  </div>
                  {item.display_attributes.description && (
                    <p className="text-xs text-gray-600 leading-tight mt-0.5">
                      {item.display_attributes.description}
                    </p>
                  )}
                </div>
                <Popover 
                  open={datePickerOpenStates[item.unique_id] || false}
                  onOpenChange={(open) => {
                    setDatePickerOpenStates(prev => ({
                      ...prev,
                      [item.unique_id]: open
                    }));
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={clsx(
                        "w-full justify-start text-left font-normal",
                        !displayValue && "text-muted-foreground",
                        shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                      )}
                      disabled={!can_edit || shouldDisableForClientIntake}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {displayValue || item.display_attributes.placeholder || "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarWidget
                      mode="single"
                      selected={displayValue ? new Date(displayValue) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const formattedDate = date.toISOString().split('T')[0];
                          handleFieldChange(item, formattedDate);
                          handleFieldBlur(item, formattedDate);
                          setDatePickerOpenStates(prev => ({
                            ...prev,
                            [item.unique_id]: false
                          }));
                        }
                      }}
                      month={datePickerMonths[item.unique_id]}
                      onMonthChange={(month) => {
                        setDatePickerMonths(prev => ({
                          ...prev,
                          [item.unique_id]: month
                        }));
                      }}
                      disabled={!can_edit || shouldDisableForClientIntake}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            );
          }

          if (specialInput?.text?.phone) {
            return (
              <div key={item.unique_id} className={containerClass}>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <span>{item.display_attributes.display_name}</span>
                      {item.display_attributes.isRequired && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <StatusIcon />
                  </div>
                  {item.display_attributes.description && (
                    <p className="text-xs text-gray-600 leading-tight mt-0.5">
                      {item.display_attributes.description}
                    </p>
                  )}
                </div>
                <Input
                  type="text"
                  value={(formResponses[item.unique_id] as string) || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numericValue = value.replace(/\D/g, '');
                    let formattedValue = '';
                    if (numericValue.length > 0) {
                      if (numericValue.length <= 3) {
                        formattedValue = `(${numericValue}`;
                      } else if (numericValue.length <= 6) {
                        formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3)}`;
                      } else {
                        formattedValue = `(${numericValue.slice(0, 3)}) ${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
                      }
                    }
                    handleFieldChange(item, formattedValue);
                  }}
                  onBlur={(e) => handleFieldBlur(item, e.target.value)}
                  placeholder={item.display_attributes.placeholder || "(123) 456-7890"}
                  disabled={!can_edit || shouldDisableForClientIntake}
                  className={clsx(
                    "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
                    shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                  )}
                />
              </div>
            );
          }

          if (specialInput?.text?.currency) {
            return (
              <div key={item.unique_id} className={containerClass}>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <span>{item.display_attributes.display_name}</span>
                      {item.display_attributes.isRequired && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <StatusIcon />
                  </div>
                  {item.display_attributes.description && (
                    <p className="text-xs text-gray-600 leading-tight mt-0.5">
                      {item.display_attributes.description}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <Input
                    type="text"
                    value={(formResponses[item.unique_id] as string) || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) return;
                      if (parts[1] && parts[1].length > 2) return;
                      handleFieldChange(item, value);
                    }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value || '0').toFixed(2);
                      handleFieldChange(item, value);
                      handleFieldBlur(item, value);
                    }}
                    placeholder={item.display_attributes.placeholder || "0.00"}
                    disabled={!can_edit || shouldDisableForClientIntake}
                    className={clsx(
                      "pl-8 transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
                      shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                    )}
                  />
                </div>
              </div>
            );
          }

          if (specialInput?.text?.percentage) {
            return (
              <div key={item.unique_id} className={containerClass}>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                      <span>{item.display_attributes.display_name}</span>
                      {item.display_attributes.isRequired && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    <StatusIcon />
                  </div>
                  {item.display_attributes.description && (
                    <p className="text-xs text-gray-600 leading-tight mt-0.5">
                      {item.display_attributes.description}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type="text"
                    value={(formResponses[item.unique_id] as string) || ""}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d.]/g, '');
                      const parts = value.split('.');
                      if (parts.length > 2) return;
                      if (parts[1] && parts[1].length > 2) return;
                      const numValue = parseFloat(value);
                      if (numValue > 100) return;
                      handleFieldChange(item, value);
                    }}
                    onBlur={(e) => handleFieldBlur(item, e.target.value)}
                    placeholder={item.display_attributes.placeholder || "0"}
                    disabled={!can_edit || shouldDisableForClientIntake}
                    className={clsx(
                      "pr-8 transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
                      shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>
            );
          }

          // Default text input
          const inputType = specialInput?.text?.email ? 'email' :
                           specialInput?.text?.url ? 'url' :
                           specialInput?.text?.number ? 'number' : 'text';

          return (
            <div key={item.unique_id} className={containerClass}>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span>{item.display_attributes.display_name}</span>
                    {item.display_attributes.isRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <StatusIcon />
                </div>
                {item.display_attributes.description && (
                  <p className="text-xs text-gray-600 leading-tight mt-0.5">
                    {item.display_attributes.description}
                  </p>
                )}
              </div>
              <Input
                type={inputType}
                value={(formResponses[item.unique_id] as string) || ""}
                onChange={(e) => handleFieldChange(item, e.target.value)}
                onBlur={(e) => handleFieldBlur(item, e.target.value)}
                placeholder={item.display_attributes.placeholder}
                disabled={!can_edit || shouldDisableForClientIntake}
                className={clsx(
                  "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
                  shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                )}
              />
            </div>
          );

        case "text-area":
          const minRows = specialInput?.textArea?.minRows || 3;
          const maxRows = specialInput?.textArea?.maxRows || 10;
          const autoResize = specialInput?.textArea?.autoResize ?? true;

          return (
            <div key={item.unique_id} className={containerClass}>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span>{item.display_attributes.display_name}</span>
                    {item.display_attributes.isRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <StatusIcon />
                </div>
                {item.display_attributes.description && (
                  <p className="text-xs text-gray-600 leading-tight mt-0.5">
                    {item.display_attributes.description}
                  </p>
                )}
              </div>
              <Textarea
                value={(formResponses[item.unique_id] as string) || ""}
                onChange={(e) => handleFieldChange(item, e.target.value)}
                onBlur={(e) => handleFieldBlur(item, e.target.value)}
                placeholder={item.display_attributes.placeholder}
                disabled={!can_edit || shouldDisableForClientIntake}
                rows={minRows}
                className={clsx(
                  "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
                  autoResize && "resize-none",
                  shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                )}
                style={autoResize ? {
                  minHeight: `${minRows * 1.5}rem`,
                  maxHeight: `${maxRows * 1.5}rem`,
                  height: 'auto'
                } : undefined}
                onInput={(e) => {
                  if (autoResize) {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${Math.min(target.scrollHeight, maxRows * 1.5 * 16)}px`;
                  }
                }}
              />
            </div>
          );

        case "radio":
          const radioLayout = specialInput?.radio?.layout || 'vertical';
          const radioColumns = specialInput?.radio?.columns || 2;
          
          const radioOptions =
            item.display_attributes.display_radio_options?.map((opt) => ({
              displayName: opt,
              value: opt,
            })) ||
            item.pdf_attributes?.[0]?.linked_form_fields_radio?.map(
              (opt) => ({
                displayName: opt.displayName,
                value: opt.radioField,
              })
            );

          if (!radioOptions?.length) return null;
          
          const gridClass = (() => {
            if (radioLayout === 'horizontal') {
              return `flex flex-wrap gap-4`;
            } else if (radioLayout === 'grid') {
              return `grid grid-cols-${radioColumns} gap-2`;
            } else {
              return 'flex flex-col gap-2';
            }
          })();

          return (
            <div key={item.unique_id} className={containerClass}>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span>{item.display_attributes.display_name}</span>
                    {item.display_attributes.isRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <StatusIcon />
                </div>
                {item.display_attributes.description && (
                  <p className="text-xs text-gray-600 leading-tight mt-0.5">
                    {item.display_attributes.description}
                  </p>
                )}
              </div>
              <div className={gridClass}>
                {radioOptions.map((choice) => (
                  <label
                    key={choice.displayName}
                    className={clsx(
                      "flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors",
                      radioLayout === 'horizontal' ? 'flex-shrink-0' : '',
                      formResponses[item.unique_id] === choice.value
                        ? "border-blue-300 bg-blue-50 shadow-sm"
                        : "hover:bg-gray-50 border-gray-200",
                      shouldDisableForClientIntake &&
                        "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                    )}
                  >
                    <input
                      type="radio"
                      name={item.unique_id}
                      value={choice.value}
                      checked={formResponses[item.unique_id] === choice.value}
                      onChange={(e) =>
                        handleFieldChange(item, e.target.value)
                      }
                      onBlur={(e) => handleFieldBlur(item, e.target.value)}
                      disabled={!can_edit || shouldDisableForClientIntake}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium">
                      {choice.displayName}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );

        case "checkbox":
          const isRadioMode = specialInput?.checkbox?.asRadio;
          const horizontalColumns = specialInput?.checkbox?.horizontal || 1;
          const options = item.display_attributes.checkbox_options?.options || [];
          
          //eslint-disable-next-line @typescript-eslint/no-explicit-any
          const renderOption = (option: any, index: number, isHorizontal: boolean = false) => {
            const currentSelections = Array.isArray(formResponses[item.unique_id]) 
              ? formResponses[item.unique_id] as string[]
              : formResponses[item.unique_id] ? [formResponses[item.unique_id] as string] : [];
            const isChecked = currentSelections.includes(option.databaseStored);
            const maxSelected = item.display_attributes.checkbox_options?.maxSelected;
            const canSelect = !isChecked && (!maxSelected || currentSelections.length < maxSelected);

            return (
              <div 
                key={`${item.unique_id}-${index}`}
                className={clsx(
                  "border rounded-lg transition-all",
                  isHorizontal && "h-full flex flex-col",
                  isChecked
                    ? "border-blue-300 bg-blue-50 shadow-sm"
                    : canSelect
                    ? "hover:bg-gray-50 border-gray-200"
                    : "border-gray-200 bg-gray-50 opacity-50",
                  shouldDisableForClientIntake &&
                    "bg-blue-50 border-blue-200 opacity-70",
                  !can_edit && "opacity-70"
                )}
              >
                <label
                  className={clsx(
                    "relative flex items-center justify-between p-3 cursor-pointer",
                    isHorizontal && "flex-1"
                  )}
                >
                  <input
                    type={isRadioMode ? "radio" : "checkbox"}
                    name={isRadioMode ? item.unique_id : undefined}
                    checked={isChecked}
                    onChange={(e) => {
                      let newSelections: string[];
                      
                      if (isRadioMode) {
                        newSelections = e.target.checked ? [option.databaseStored] : [];
                      } else {
                        if (e.target.checked) {
                          if (maxSelected === 1) {
                            newSelections = [option.databaseStored];
                          } else if (!maxSelected || currentSelections.length < maxSelected) {
                            newSelections = [...currentSelections, option.databaseStored];
                          } else {
                            return;
                          }
                        } else {
                          newSelections = currentSelections.filter(val => val !== option.databaseStored);
                        }
                      }
                      
                      handleFieldChange(item, newSelections);
                    }}
                    onBlur={() => {
                      const currentSelections = Array.isArray(formResponses[item.unique_id]) 
                        ? formResponses[item.unique_id] as string[]
                        : formResponses[item.unique_id] ? [formResponses[item.unique_id] as string] : [];
                      handleFieldBlur(item, currentSelections);
                    }}
                    disabled={!can_edit || shouldDisableForClientIntake || (!isChecked && !canSelect && !isRadioMode)}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />

                  <div className="flex-1 min-w-0 pointer-events-none">
                    <span className={clsx(
                      "text-sm font-medium",
                      isChecked || canSelect || isRadioMode ? "text-gray-900" : "text-gray-400"
                    )}>
                      {option.display_name}
                    </span>
                  </div>

                  <span
                    className={clsx(
                      "ml-3 flex h-5 w-5 items-center justify-center transition-colors pointer-events-none flex-shrink-0",
                      isRadioMode
                        ? isChecked
                          ? "rounded-full bg-blue-600 border-2 border-blue-600"
                          : "rounded-full bg-white border-2 border-gray-400"
                        : isChecked
                          ? "rounded-sm bg-blue-600 border border-blue-600 text-white"
                          : "rounded-sm bg-white border border-gray-400 text-transparent"
                    )}
                  >
                    {isRadioMode ? (
                      isChecked && <span className="block w-2 h-2 bg-white rounded-full" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </span>
                </label>

                {/* Linked fields */}
                {isChecked && option.linkedFields && option.linkedFields.length > 0 && (
                  <div className="px-3 pb-3 -mt-1">
                    <div className="grid grid-cols-12 gap-x-3 gap-y-2">
                      {option.linkedFields.map((fieldId: string) => {
                        const linkedField = schema.find((schemaItem: SchemaItem) => schemaItem.unique_id === fieldId);
                        if (!linkedField) return null;
                        
                        return renderField(linkedField);
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          };

          return (
            <div key={item.unique_id} className={containerClass}>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span>{item.display_attributes.display_name}</span>
                    {item.display_attributes.isRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <StatusIcon />
                </div>
                {item.display_attributes.description && (
                  <p className="text-xs text-gray-600 leading-tight mt-0.5">
                    {item.display_attributes.description}
                  </p>
                )}
              </div>
              
              {horizontalColumns > 1 ? (
                <div 
                  className="grid gap-3"
                  style={{ 
                    gridTemplateColumns: `repeat(${horizontalColumns}, 1fr)`,
                    gridAutoRows: '1fr'
                  }}
                >
                  {options.map((option, idx) => renderOption(option, idx, true))}
                </div>
              ) : (
                <div className="space-y-2">
                  {options.map((option, idx) => renderOption(option, idx, false))}
                </div>
              )}
            </div>
          );

        case "signature":
          const signatureData = formResponses[item.unique_id] as SignatureInput;
          const showInitials = specialInput?.signature?.showInitials ?? false;
          const dateFormat = specialInput?.signature?.dateFormat || "MM/DD/YYYY";

          return (
            <div key={item.unique_id} className={containerClass}>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span>{item.display_attributes.display_name}</span>
                    {item.display_attributes.isRequired && (
                      <span className="text-red-500">*</span>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        className="max-w-xs text-center"
                      >
                        <p>
                          Dates will be automatically handled if a signer is
                          chosen.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                  <StatusIcon />
                </div>
                {item.display_attributes.description && (
                  <p className="text-xs text-gray-600 leading-tight mt-0.5">
                    {item.display_attributes.description}
                  </p>
                )}
              </div>
              
              <div className="space-y-3">
                <Select
                  value={signatureData?.actionAs || "signer"}
                  onValueChange={(value) => {
                    const newSignature: SignatureInput = {
                      actionAs: value as "signer" | "delegator",
                      email: signatureData?.email || ""
                    };
                    handleFieldChange(item, newSignature);
                    handleForceSave(item, newSignature);
                  }}
                  disabled={!can_edit || shouldDisableForClientIntake}
                >
                  <SelectTrigger className={clsx(
                    "w-full",
                    shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                  )}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signer">Sign as Signer</SelectItem>
                    <SelectItem value="delegator">Sign as Delegator</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="email"
                  value={signatureData?.email || ""}
                  onChange={(e) => {
                    const newSignature: SignatureInput = {
                      actionAs: signatureData?.actionAs || "signer",
                      email: e.target.value
                    };
                    handleFieldChange(item, newSignature);
                  }}
                  onBlur={(e) => {
                    const newSignature: SignatureInput = {
                      actionAs: signatureData?.actionAs || "signer",
                      email: e.target.value
                    };
                    handleFieldBlur(item, newSignature);
                  }}
                  placeholder="Email address"
                  disabled={!can_edit || shouldDisableForClientIntake}
                  className={clsx(
                    "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
                    shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                  )}
                />

                {showInitials && (
                  <Input
                    type="text"
                    placeholder="Initials"
                    disabled={!can_edit || shouldDisableForClientIntake}
                    className={clsx(
                      "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white",
                      shouldDisableForClientIntake && "bg-blue-50 border-blue-200 cursor-not-allowed opacity-70"
                    )}
                  />
                )}

                <div className="text-xs text-gray-500">
                  Date format: {dateFormat}
                </div>
              </div>
            </div>
          );

        case "fileUpload":
          const accept = specialInput?.fileUpload?.accept || "";
          const maxSize = specialInput?.fileUpload?.maxSize || 10;
          const multiple = specialInput?.fileUpload?.multiple ?? false;
          const files = fieldFiles[item.unique_id] || [];

          return (
            <div key={item.unique_id} className={containerClass}>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <span>{item.display_attributes.display_name}</span>
                    {item.display_attributes.isRequired && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <StatusIcon />
                </div>
                {item.display_attributes.description && (
                  <p className="text-xs text-gray-600 leading-tight mt-0.5">
                    {item.display_attributes.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm flex-1">{file.name}</span>
                    {can_edit && !shouldDisableForClientIntake && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFileFromField(item.unique_id, index)}
                        disabled={uploadingFields.has(item.unique_id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                {(multiple || files.length === 0) && (
                  <label className={clsx(
                    "flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer",
                    can_edit && !shouldDisableForClientIntake
                      ? "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                      : "border-gray-200 bg-gray-50 cursor-not-allowed opacity-50",
                    shouldDisableForClientIntake && "bg-blue-50 border-blue-200"
                  )}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {uploadingFields.has(item.unique_id) ? (
                          <>
                            <Loader2 className="inline h-4 w-4 animate-spin mr-1" />
                            Uploading...
                          </>
                        ) : (
                          <>Click to upload or drag and drop</>
                        )}
                      </p>
                      {accept && (
                        <p className="text-xs text-gray-400 mt-1">
                          {accept}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Max size: {maxSize}MB
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept={accept}
                      multiple={multiple}
                      disabled={!can_edit || shouldDisableForClientIntake || uploadingFields.has(item.unique_id)}
                      onChange={async (e) => {
                        const newFiles = Array.from(e.target.files || []);
                        for (const file of newFiles) {
                          if (file.size > maxSize * 1024 * 1024) {
                            toast.error(`File ${file.name} exceeds ${maxSize}MB limit`);
                            return;
                          }
                        }
                        if (multiple) {
                          await addFileToField(item.unique_id, newFiles[0]);
                        } else {
                          await handleFileChange(item.unique_id, newFiles);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          );

        case "info":
          const infoStyle = specialInput?.info?.style || 'default';
          const showIcon = specialInput?.info?.icon ?? true;
          const isMinimizable = specialInput?.info?.minimizable ?? false;
          const isMinimized = minimizedInfoItems.has(item.unique_id);

          const infoStyles = {
            default: "bg-blue-50 border-blue-200 text-blue-800",
            subtle: "bg-gray-50 border-gray-200 text-gray-700",
            minimal: "bg-gray-50 border-gray-100 text-gray-600",
            inline: "bg-transparent border-0 text-gray-600 p-0",
            compact: "bg-blue-50 border-blue-200 text-blue-700 p-2",
            warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
            success: "bg-green-50 border-green-200 text-green-800",
            error: "bg-red-50 border-red-200 text-red-800",
            tip: "bg-purple-50 border-purple-200 text-purple-800"
          };

          const InfoIcon = infoStyle === 'warning' ? AlertCircle :
                           infoStyle === 'success' ? Check :
                           infoStyle === 'error' ? X :
                           infoStyle === 'tip' ? Info : Info;

          return (
            <div key={item.unique_id} className={containerClass}>
              <div className={clsx(
                "border rounded-lg transition-all",
                infoStyles[infoStyle],
                infoStyle === 'inline' ? '' : 'p-4'
              )}>
                <div className="flex items-start gap-3">
                  {showIcon && infoStyle !== 'inline' && (
                    <InfoIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      {item.display_attributes.display_name && (
                        <h4 className="font-medium">
                          {item.display_attributes.display_name}
                        </h4>
                      )}
                      {isMinimizable && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setMinimizedInfoItems(prev => {
                              const newSet = new Set(prev);
                              if (isMinimized) {
                                newSet.delete(item.unique_id);
                              } else {
                                newSet.add(item.unique_id);
                              }
                              return newSet;
                            });
                          }}
                          className="h-6 w-6 p-0"
                        >
                          {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>
                    {!isMinimized && item.display_attributes.description && (
                      <p className={clsx(
                        "text-sm",
                        infoStyle === 'inline' ? '' : 'leading-relaxed'
                      )}>
                        {item.display_attributes.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    },
    [
      checkFieldVisibility,
      clientIntakeWillSend,
      formResponses,
      editingClientIntakeFields,
      can_edit,
      savingItems,
      savedItems,
      datePickerOpenStates,
      datePickerMonths,
      datePickerValues,
      minimizedInfoItems,
      fieldFiles,
      uploadingFields,
      schema,
      handleFieldChange,
      handleFieldBlur,
      handleForceSave,
      handleFileChange,
      addFileToField,
      removeFileFromField,
    ]
  );

  /* --------------------------- main render ------------------------ */

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-8">
      

      {/* Ungrouped items */}
      {groupedSchema.ungroupedItems.length > 0 && (
        <div className="grid grid-cols-12 gap-x-6 gap-y-4">
          {groupedSchema.ungroupedItems.map((item) => renderField(item))}
        </div>
      )}

      {/* Grouped items */}
      {visibleGroupedSchema.map((group, groupIndex) => {
        const theme = getBlockTheme(group, groupIndex);
        const Icon = getBlockIcon(group);
        const hasVisibleFields = group.items.some(item => checkFieldVisibility(item));

        if (!hasVisibleFields) return null;

        return (
          <Card
            key={group.id}
            className={clsx("overflow-hidden", theme.border, "border-l-4")}
          >
            {(group.style?.title || group.name) && (
              <div className={clsx("px-6 py-4", theme.header)}>
                <div className="flex items-center gap-3">
                  <Icon className={clsx("h-5 w-5", theme.icon)} />
                  <div>
                    <h3 className={clsx("text-lg font-semibold", theme.text)}>
                      {group.style?.title || formatBlockName(group.name || "")}
                    </h3>
                    {group.style?.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {group.style.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            <CardContent className="px-6 py-6">
              <div className="grid grid-cols-12 gap-x-6 gap-y-4">
                {group.items
                  .filter(item => checkFieldVisibility(item))
                  .map((item) => renderField(item))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FormInput;