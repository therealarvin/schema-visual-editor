import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { Schema } from "@/types/schema";

// Generate unique ID for schema items
export function generateUniqueId(): string {
  return `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const sampleSchema: Schema = [
  {
    unique_id: "sample_text_field",
    display_attributes: {
      display_name: "Full Name",
      input_type: "text",
      description: "Enter your full legal name",
      order: 1,
      placeholder: "John Doe",
      width: 6,
      isRequired: true,
      value: {
        type: "manual"
      }
    }
  },
  {
    unique_id: "sample_radio_field",
    display_attributes: {
      display_name: "Property Type",
      input_type: "radio",
      description: "Select the type of property",
      order: 2,
      width: 6,
      display_radio_options: ["House", "Condo", "Townhouse", "Commercial"],
      isRequired: true,
      value: {
        type: "manual"
      }
    }
  },
  {
    unique_id: "sample_checkbox_field",
    display_attributes: {
      display_name: "Amenities",
      input_type: "checkbox",
      description: "Select available amenities",
      order: 3,
      width: 6,
      checkbox_options: {
        options: [
          { display_name: "Swimming Pool", databaseStored: "pool" },
          { display_name: "Garage", databaseStored: "garage" },
          { display_name: "Garden", databaseStored: "garden" },
          { display_name: "Balcony", databaseStored: "balcony" }
        ],
        maxSelected: 3,
        minSelected: 1
      },
      isRequired: true,
      value: {
        type: "manual"
      }
    }
  },
  {
    unique_id: "sample_block_field",
    display_attributes: {
      display_name: "Property Address",
      input_type: "text",
      description: "Street address of the property",
      order: 4,
      block: "Property Information",
      block_style: {
        title: "Property Details",
        description: "Information about the property location and details",
        icon: "Home",
        color_theme: "blue"
      },
      width: 12,
      placeholder: "123 Main St, City, State 12345",
      isRequired: true,
      value: {
        type: "manual"
      }
    }
  },
  {
    unique_id: "sample_signature_field",
    display_attributes: {
      display_name: "Buyer Signature",
      input_type: "signature",
      description: "Electronic signature of the buyer",
      order: 5,
      block: "Signatures",
      block_style: {
        title: "Required Signatures",
        description: "All parties must sign to complete the agreement",
        icon: "Users",
        color_theme: "green"
      },
      width: 6,
      isRequired: true,
      value: {
        type: "manual",
        output: "SignatureInput__signer"
      }
    }
  }
];