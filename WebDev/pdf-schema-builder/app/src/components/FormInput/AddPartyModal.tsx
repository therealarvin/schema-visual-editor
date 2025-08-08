"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddPartyModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId?: string;
  dealOptionId?: string;
  dealSide?: string;
  dealOptionName?: string;
  onPartyAdded?: () => void;
}

// Simplified AddPartyModal - just a placeholder button
const AddPartyModal: React.FC<AddPartyModalProps> = ({
  isOpen,
  onClose,
  onPartyAdded,
}) => {
  // This is now just a placeholder - doesn't actually do anything
  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0, 0, 0, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50
    }}>
      <div style={{
        background: "white",
        borderRadius: "8px",
        padding: "24px",
        maxWidth: "400px",
        width: "90%"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
          Add Party
        </h3>
        <p style={{ color: "#6b7280", marginBottom: "16px" }}>
          Party management is not available in preview mode.
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPartyModal;