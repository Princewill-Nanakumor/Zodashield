// src/components/leads/leadDetailsPanel/Reminders.tsx
"use client";

import { FC, useState } from "react";
import {
  Loader2,
  Plus,
  Bell,
  Clock,
  Calendar as CalendarIcon,
  Trash2,
  Check,
  MoreVertical,
  AlertCircle,
  Phone,
  Mail,
  CheckSquare,
  Users,
  MessageSquare,
  Edit,
  Save,
  X as XIcon,
  Volume2,
  VolumeX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, isValid } from "date-fns";
import { Reminder } from "@/types/leads";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface RemindersProps {
  reminders: Reminder[];
  isLoading: boolean;
  leadId: string;
  onAddReminder: (reminder: {
    title: string;
    description?: string;
    reminderDate: string;
    reminderTime: string;
    type: string;
    soundEnabled: boolean;
  }) => void;
  onUpdateReminder: (reminderId: string, updates: Partial<Reminder>) => void;
  onDeleteReminder: (reminderId: string) => void;
  onCompleteReminder: (reminderId: string) => void;
  onSnoozeReminder: (reminderId: string, minutes: number) => void;
  isSaving: boolean;
}

const Reminders: FC<RemindersProps> = ({
  reminders,
  isLoading,
  onAddReminder,
  onUpdateReminder,
  onDeleteReminder,
  onCompleteReminder,
  onSnoozeReminder,
  isSaving,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    reminderDate: string;
    reminderTime: string;
    type: "CALL" | "EMAIL" | "TASK" | "MEETING" | "FOLLOW_UP";
    soundEnabled: boolean;
  }>({
    title: "",
    description: "",
    reminderDate: "",
    reminderTime: "",
    type: "TASK",
    soundEnabled: true,
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.reminderDate || !formData.reminderTime) {
      return;
    }

    if (editingId) {
      // Update existing reminder
      onUpdateReminder(editingId, formData);
      setEditingId(null);
    } else {
      // Create new reminder
      onAddReminder(formData);
    }

    setFormData({
      title: "",
      description: "",
      reminderDate: "",
      reminderTime: "",
      type: "TASK",
      soundEnabled: true,
    });
    setShowForm(false);
  };

  const handleEdit = (reminder: Reminder) => {
    // Format date to YYYY-MM-DD
    const dateObj = new Date(reminder.reminderDate);
    const formattedDate = dateObj.toISOString().split("T")[0];

    setFormData({
      title: reminder.title,
      description: reminder.description || "",
      reminderDate: formattedDate,
      reminderTime: reminder.reminderTime,
      type: reminder.type,
      soundEnabled: reminder.soundEnabled,
    });
    setEditingId(reminder._id);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      title: "",
      description: "",
      reminderDate: "",
      reminderTime: "",
      type: "TASK",
      soundEnabled: true,
    });
  };

  const handleToggleSound = (
    reminderId: string,
    currentSoundEnabled: boolean
  ) => {
    onUpdateReminder(reminderId, { soundEnabled: !currentSoundEnabled });
  };

  const formatDate = (dateString: string | Date) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return "Invalid date";
      return format(date, "d MMM, yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const getReminderIcon = (type: Reminder["type"]) => {
    const iconClass = "w-5 h-5";
    switch (type) {
      case "CALL":
        return <Phone className={iconClass} />;
      case "EMAIL":
        return <Mail className={iconClass} />;
      case "TASK":
        return <CheckSquare className={iconClass} />;
      case "MEETING":
        return <Users className={iconClass} />;
      case "FOLLOW_UP":
        return <MessageSquare className={iconClass} />;
      default:
        return <Bell className={iconClass} />;
    }
  };

  const getTypeColor = (type: Reminder["type"]) => {
    switch (type) {
      case "CALL":
        return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30";
      case "EMAIL":
        return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30";
      case "TASK":
        return "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30";
      case "MEETING":
        return "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30";
      case "FOLLOW_UP":
        return "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const pendingReminders = reminders.filter(
    (r) => r.status === "PENDING" || r.status === "SNOOZED"
  );
  const completedReminders = reminders.filter((r) => r.status === "COMPLETED");

  return (
    <div
      className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
      style={{ height: "100%" }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700 flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Reminders ({pendingReminders.length})
          </h3>
          {!showForm && (
            <Button
              onClick={() => setShowForm(!showForm)}
              size="sm"
              className="gap-2 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
            >
              <Plus className="w-4 h-4" />
              Add Reminder
            </Button>
          )}
        </div>

        {/* Add/Edit Reminder Form */}
        {showForm && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                {editingId ? "Edit Reminder" : "New Reminder"}
              </h4>
              <Button
                onClick={handleCancelEdit}
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
                      type: value as
                        | "CALL"
                        | "EMAIL"
                        | "TASK"
                        | "MEETING"
                        | "FOLLOW_UP",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TASK">Task</SelectItem>
                    <SelectItem value="CALL">Call</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="MEETING">Meeting</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
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
                  onClick={handleSubmit}
                  disabled={
                    isSaving ||
                    !formData.title ||
                    !formData.reminderDate ||
                    !formData.reminderTime
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
                <Button
                  onClick={handleCancelEdit}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Reminders List */}
        <div className="flex-1 min-h-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : reminders.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  No Reminders Set
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Click &ldquo;Add Reminder&rdquo; to create one
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#6366f1 #f3f4f6",
              }}
            >
              <style jsx>{`
                div::-webkit-scrollbar {
                  width: 8px;
                }
                div::-webkit-scrollbar-track {
                  background: #f3f4f6;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #6366f1;
                  border-radius: 4px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #4f46e5;
                }
                .dark div::-webkit-scrollbar-track {
                  background: #374151;
                }
                .dark div::-webkit-scrollbar-thumb {
                  background: #6366f1;
                }
                .dark div::-webkit-scrollbar-thumb:hover {
                  background: #4f46e5;
                }
              `}</style>

              {/* Pending Reminders */}
              {pendingReminders.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Upcoming
                  </h4>
                  {pendingReminders.map((reminder) => (
                    <div
                      key={reminder._id}
                      className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div
                            className={`p-2 rounded-lg ${getTypeColor(reminder.type)}`}
                          >
                            {getReminderIcon(reminder.type)}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1">
                              <h5 className="font-semibold text-gray-900 dark:text-gray-100">
                                {reminder.title}
                              </h5>
                            </div>
                            {reminder.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {reminder.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {formatDate(reminder.reminderDate)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {reminder.reminderTime}
                              </div>
                              {reminder.status === "SNOOZED" && (
                                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                                  <AlertCircle className="w-3 h-3" />
                                  Snoozed
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onCompleteReminder(reminder._id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/30"
                            title="Mark as complete"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(reminder)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            title="Edit reminder"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleToggleSound(
                                reminder._id,
                                reminder.soundEnabled
                              )
                            }
                            className={
                              reminder.soundEnabled
                                ? "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                            }
                            title={
                              reminder.soundEnabled
                                ? "Mute sound"
                                : "Enable sound"
                            }
                          >
                            {reminder.soundEnabled ? (
                              <Volume2 className="w-4 h-4" />
                            ) : (
                              <VolumeX className="w-4 h-4" />
                            )}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  onSnoozeReminder(reminder._id, 15)
                                }
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Snooze 15 min
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  onSnoozeReminder(reminder._id, 60)
                                }
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Snooze 1 hour
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  onSnoozeReminder(reminder._id, 1440)
                                }
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Snooze 1 day
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onDeleteReminder(reminder._id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Completed Reminders */}
              {completedReminders.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Completed
                  </h4>
                  {completedReminders.map((reminder) => (
                    <div
                      key={reminder._id}
                      className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-600 opacity-75"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                            <Check className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-700 dark:text-gray-300 line-through">
                              {reminder.title}
                            </h5>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                              <span>
                                Completed on{" "}
                                {reminder.completedAt &&
                                  formatDate(reminder.completedAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteReminder(reminder._id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reminders;
