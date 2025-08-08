import React, { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import clsx from "clsx";
import { SchemaItem } from "@/types/realtor";
import { toast } from "sonner";

interface TextFieldProps {
  schema: SchemaItem;
  value: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
  disabled?: boolean;
  shouldDisableForClientIntake?: boolean;
}

const TextField = React.memo<TextFieldProps>(
  ({
    schema,
    value,
    onChange,
    onBlur,
    disabled = false,
    shouldDisableForClientIntake = false,
  }) => {
    const [localValue, setLocalValue] = useState(value);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Handle immediate UI updates with debounced onChange
    const handleChange = useCallback(
      (newValue: string) => {
        setLocalValue(newValue);

        // Clear existing debounce
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Debounce the onChange callback
        debounceRef.current = setTimeout(() => {
          onChange(newValue);
        }, 300);
      },
      [onChange]
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const blurValue = e.target.value;

        // Clear debounce timer
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }

        // Don't call onChange on blur - let the parent handle it
        // This prevents double-saving and status conflicts
        onBlur(blurValue);
        onChange(blurValue);
      },
      [onBlur, onChange]
    );

    // No longer sync with prop changes during user interaction
    // TextField maintains its own state until user is done typing

    // Cleanup debounce on unmount
    React.useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    const { input_type, special_input, placeholder } =
      schema.display_attributes;

    // Text Area
    if (input_type === "text-area") {
      const minRows = special_input?.textArea?.minRows || 4;
      const maxRows = special_input?.textArea?.maxRows;
      const autoResize = special_input?.textArea?.autoResize;

      return (
        <div className="relative">
          <Textarea
            value={localValue}
            onChange={(e) => {
              handleChange(e.target.value);
              // Auto-resize functionality
              if (autoResize) {
                const textarea = e.target;
                textarea.style.height = "auto";
                const newHeight = Math.min(
                  textarea.scrollHeight,
                  maxRows ? maxRows * 24 : Infinity
                );
                textarea.style.height = `${newHeight}px`;
              }
            }}
            onBlur={handleBlur}
            placeholder={placeholder || ""}
            disabled={disabled || shouldDisableForClientIntake}
            rows={minRows}
            className={clsx(
              "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none",
              shouldDisableForClientIntake
                ? "bg-blue-50 border-blue-200 cursor-not-allowed"
                : "bg-white",
              autoResize && "overflow-hidden"
            )}
            style={{
              minHeight: `${minRows * 24}px`,
              maxHeight: maxRows ? `${maxRows * 24}px` : undefined,
            }}
          />
        </div>
      );
    }

    // Text Input variants
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      let processedValue = inputValue;

      // Phone formatting
      if (special_input?.text?.phone) {
        // Check if it starts with + for international format
        if (inputValue.startsWith('+')) {
          // Allow + and numbers only for international format
          processedValue = inputValue.replace(/[^\d+]/g, "");
          // Ensure only one + at the start
          if (processedValue.length > 1 && processedValue.indexOf('+', 1) !== -1) {
            processedValue = '+' + processedValue.replace(/\+/g, '');
          }
        } else {
          // Standard US phone format
          const numericValue = inputValue.replace(/\D/g, "");
          if (numericValue.length > 0) {
            if (numericValue.length <= 3) {
              processedValue = `(${numericValue}`;
            } else if (numericValue.length <= 6) {
              processedValue = `(${numericValue.slice(
                0,
                3
              )}) ${numericValue.slice(3)}`;
            } else {
              processedValue = `(${numericValue.slice(
                0,
                3
              )}) ${numericValue.slice(3, 6)}-${numericValue.slice(6, 10)}`;
            }
          }
        }
      }
      // Number formatting
      else if (special_input?.text?.number) {
        processedValue = inputValue.replace(/[^0-9.-]/g, "");
      }
      // Email validation (basic formatting)
      else if (special_input?.text?.email) {
        // Allow standard email characters
        processedValue = inputValue.replace(/[^a-zA-Z0-9@._-]/g, "");
      }
      // Currency formatting
      else if (special_input?.text?.currency) {
        const numericValue = inputValue.replace(/[^0-9.]/g, "");
        const parts = numericValue.split(".");
        let formattedValue = parts[0];

        if (parts[0]) {
          // Add commas for thousands
          formattedValue = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }

        if (parts.length > 1) {
          formattedValue += "." + parts[1].slice(0, 2); // Limit to 2 decimal places
        }

        processedValue = formattedValue;
      }
      // Percentage formatting
      else if (special_input?.text?.percentage) {
        let numericValue = inputValue.replace(/[^0-9.]/g, "");
        const parts = numericValue.split(".");
        let formattedValue = parts[0];

        if (parts.length > 1) {
          formattedValue += "." + parts[1].slice(0, 2);
        }

        if (formattedValue) {
          formattedValue += "%";
        }
        processedValue = formattedValue;
      }

      handleChange(processedValue);
    };

    const getInputType = () => {
      if (special_input?.text?.url) return "url";
      if (special_input?.text?.email) return "email";
      return "text";
    };

    const getPlaceholder = () => {
      if (special_input?.text?.phone) return placeholder || "(123) 456-7890 or +1234567890";
      if (special_input?.text?.number) return placeholder || "0";
      if (special_input?.text?.currency) return placeholder || "0.00";
      if (special_input?.text?.percentage) return placeholder || "0.00%";
      if (special_input?.text?.url) return placeholder || "https://example.com";
      if (special_input?.text?.email) return placeholder || "email@example.com";
      return placeholder || "";
    };

    return (
      <Input
        type={getInputType()}
        value={localValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        placeholder={getPlaceholder()}
        disabled={disabled || shouldDisableForClientIntake}
        className={clsx(
          "transition-all duration-200 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
          shouldDisableForClientIntake
            ? "bg-blue-50 border-blue-200 cursor-not-allowed"
            : "bg-white"
        )}
      />
    );
  }
);

TextField.displayName = "TextField";

export default TextField;
