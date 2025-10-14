// src/components/leads/leadDetailsPanel/ReminderForm.tsx
"use client";

import { FC } from "react";
import {
  Loader2,
  Plus,
  Save,
  X as XIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReminderFormData {
  title: string;
  description: string;
  reminderDate: string;
  reminderTime: string;
  type: "CALL" | "EMAIL" | "TASK" | "MEETING" | "";
  soundEnabled: boolean;
}

interface ReminderFormProps {
  editingId: string | null;
  formData: ReminderFormData;
  setFormData: (data: ReminderFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSaving: boolean;
}

export const ReminderForm: FC<ReminderFormProps> = ({
  editingId,
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isSaving,
}) => {
  return (
    <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
          {editingId ? "Edit Reminder" : "New Reminder"}
        </h4>
        <Button
          onClick={onCancel}
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
        >
          <XIcon className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
            Title *
          </label>
          <Input
            placeholder="e.g., Call client for follow-up"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
            Description
          </label>
          <Textarea
            placeholder="Additional details..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={2}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Date *
            </label>
            <Input
              type="date"
              value={formData.reminderDate}
              onChange={(e) =>
                setFormData({ ...formData, reminderDate: e.target.value })
              }
              min={new Date().toISOString().split("T")[0]}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
              Time *
            </label>
            <Input
              type="time"
              value={formData.reminderTime}
              onChange={(e) =>
                setFormData({ ...formData, reminderTime: e.target.value })
              }
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
            Type
          </label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                type: value as "CALL" | "EMAIL" | "TASK" | "MEETING",
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TASK">Task</SelectItem>
              <SelectItem value="CALL">Call</SelectItem>
              <SelectItem value="EMAIL">Email</SelectItem>
              <SelectItem value="MEETING">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700/30 rounded-lg">
          <div className="flex items-center gap-2">
            {formData.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notification Sound
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              setFormData({
                ...formData,
                soundEnabled: !formData.soundEnabled,
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.soundEnabled
                ? "bg-indigo-600"
                : "bg-gray-300 dark:bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.soundEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            onClick={onSubmit}
            disabled={
              isSaving ||
              !formData.title ||
              !formData.reminderDate ||
              !formData.reminderTime ||
              !formData.type
            }
            className="flex-1 bg-indigo-500 hover:bg-indigo-600"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : editingId ? (
              <Save className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span className="ml-2">
              {editingId ? "Update Reminder" : "Create Reminder"}
            </span>
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReminderForm;
