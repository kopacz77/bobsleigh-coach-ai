"use client";

import { Button, Group, Modal, Textarea } from "@mantine/core";
import React, { useState } from "react";

interface RejectFeedbackModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
  loading?: boolean;
}

const RejectFeedbackModal = ({ opened, onClose, onSubmit, loading }: RejectFeedbackModalProps) => {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    const trimmed = notes.trim();
    if (trimmed.length < 10) {
      setError("Feedback must be at least 10 characters");
      return;
    }
    setError("");
    onSubmit(trimmed);
    setNotes("");
  };

  const handleClose = () => {
    setNotes("");
    setError("");
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Reject Plan - Feedback" size="md">
      <Textarea
        label="Rejection Notes"
        description="Describe what should change (e.g., 'too much volume', 'need more sprint work', 'reduce intensity'). This feedback helps the AI generate better plans."
        placeholder="What should be different in the next version..."
        value={notes}
        onChange={(e) => {
          setNotes(e.currentTarget.value);
          if (error) setError("");
        }}
        minRows={4}
        error={error}
        required
      />
      <Group justify="flex-end" mt="md">
        <Button variant="default" onClick={handleClose}>
          Cancel
        </Button>
        <Button color="red" onClick={handleSubmit} loading={loading}>
          Submit Rejection
        </Button>
      </Group>
    </Modal>
  );
};

export default RejectFeedbackModal;
