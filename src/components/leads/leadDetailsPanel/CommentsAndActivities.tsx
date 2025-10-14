// src/components/leads/leadDetailsPanel/CommentsAndActivities.tsx
"use client";

import React, { FC, useState, useCallback } from "react";
import { Lead, Reminder } from "@/types/leads";
import {
  Notebook,
  Activity as ActivityIcon,
  Loader2,
  Bell,
} from "lucide-react";
import Comments from "./Comments";
import Activities from "./Activities";
import Reminders from "./Reminders";
import { useToast } from "@/components/ui/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface ApiComment {
  _id: string;
  content: string;
  createdAt: string;
  createdBy: {
    _id?: string;
    id?: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
}

interface CommentsAndActivitiesProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => Promise<boolean>;
}

function transformComment(apiComment: ApiComment): Comment {
  const userId = apiComment.createdBy._id || apiComment.createdBy.id || "";
  return {
    _id: apiComment._id,
    content: apiComment.content,
    createdAt: apiComment.createdAt,
    createdBy: {
      _id: userId,
      firstName: apiComment.createdBy.firstName,
      lastName: apiComment.createdBy.lastName,
      avatar: apiComment.createdBy.avatar,
    },
  };
}

const CommentsAndActivities: FC<CommentsAndActivitiesProps> = ({ lead }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<
    "comments" | "activity" | "reminders"
  >("comments");
  const [commentContent, setCommentContent] = useState("");

  // React Query for fetching comments
  const {
    data: comments = [],
    isLoading: isLoadingComments,
    error: commentsError,
  } = useQuery({
    queryKey: ["comments", lead._id],
    queryFn: async (): Promise<Comment[]> => {
      console.log("=== FETCHING COMMENTS WITH REACT QUERY ===");
      console.log("Lead ID:", lead._id);

      const response = await fetch(`/api/leads/${lead._id}/comments`);
      console.log("Response status:", response.status);

      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`);
      }

      const data = await response.json();
      console.log("Raw comments data:", data);

      const transformedComments = data.map(transformComment);
      console.log("Transformed comments:", transformedComments);

      return transformedComments;
    },
    enabled: !!lead._id,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      console.error("Comments fetch error:", error);
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      console.log("=== ADDING COMMENT WITH REACT QUERY ===");
      console.log("Lead ID:", lead._id);
      console.log("Content:", content);

      const response = await fetch(`/api/leads/${lead._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add comment: ${errorText}`);
      }

      const newComment = await response.json();
      return transformComment(newComment);
    },
    onSuccess: (newComment) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["comments", lead._id],
        (oldComments: Comment[] = []) => [newComment, ...oldComments]
      );

      // Invalidate activities to refresh them
      queryClient.invalidateQueries({ queryKey: ["activities", lead._id] });

      setCommentContent("");
      toast({
        title: "Success",
        description: "Comment added successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await fetch(
        `/api/leads/${lead._id}/comments/${commentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete comment: ${errorText}`);
      }

      return commentId;
    },
    onSuccess: (deletedCommentId) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["comments", lead._id],
        (oldComments: Comment[] = []) =>
          oldComments.filter((comment) => comment._id !== deletedCommentId)
      );

      // Invalidate activities to refresh them
      queryClient.invalidateQueries({ queryKey: ["activities", lead._id] });

      toast({
        title: "Success",
        description: "Comment deleted successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    },
  });

  // Edit comment mutation
  const editCommentMutation = useMutation({
    mutationFn: async ({
      commentId,
      content,
    }: {
      commentId: string;
      content: string;
    }) => {
      const response = await fetch(
        `/api/leads/${lead._id}/comments/${commentId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update comment: ${errorText}`);
      }

      const updatedComment = await response.json();
      return transformComment(updatedComment);
    },
    onSuccess: (updatedComment) => {
      // Optimistically update the cache
      queryClient.setQueryData(
        ["comments", lead._id],
        (oldComments: Comment[] = []) =>
          oldComments.map((comment) =>
            comment._id === updatedComment._id ? updatedComment : comment
          )
      );

      // Invalidate activities to refresh them
      queryClient.invalidateQueries({ queryKey: ["activities", lead._id] });

      toast({
        title: "Success",
        description: "Comment updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error updating comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive",
      });
    },
  });

  // Handle comment actions
  const handleAddComment = useCallback(async () => {
    if (!commentContent.trim()) return;
    addCommentMutation.mutate(commentContent);
  }, [commentContent, addCommentMutation]);

  const handleCommentDeleted = useCallback(
    async (commentId: string) => {
      deleteCommentMutation.mutate(commentId);
    },
    [deleteCommentMutation]
  );

  const handleCommentEdited = useCallback(
    async (updatedComment: Comment) => {
      editCommentMutation.mutate({
        commentId: updatedComment._id,
        content: updatedComment.content,
      });
    },
    [editCommentMutation]
  );

  // React Query for fetching reminders
  const { data: reminders = [], isLoading: isLoadingReminders } = useQuery({
    queryKey: ["reminders", lead._id],
    queryFn: async (): Promise<Reminder[]> => {
      const response = await fetch(`/api/leads/${lead._id}/reminders`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reminders: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!lead._id,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000, // Check every minute for updates
  });

  // Add reminder mutation
  const addReminderMutation = useMutation({
    mutationFn: async (reminderData: {
      title: string;
      description?: string;
      reminderDate: string;
      reminderTime: string;
      type: string;
      soundEnabled: boolean;
    }) => {
      const response = await fetch(`/api/leads/${lead._id}/reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reminderData),
      });
      if (!response.ok) throw new Error("Failed to create reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders", lead._id] });
      toast({
        title: "Success",
        description: "Reminder created successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to create reminder",
        variant: "destructive",
      });
    },
  });

  // Update reminder mutation
  const updateReminderMutation = useMutation({
    mutationFn: async ({
      reminderId,
      updates,
    }: {
      reminderId: string;
      updates: Partial<Reminder>;
    }) => {
      const response = await fetch(
        `/api/leads/${lead._id}/reminders/${reminderId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );
      if (!response.ok) throw new Error("Failed to update reminder");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders", lead._id] });
      toast({
        title: "Success",
        description: "Reminder updated successfully",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error updating reminder:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder",
        variant: "destructive",
      });
    },
  });

  // Delete reminder mutation
  const deleteReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const response = await fetch(
        `/api/leads/${lead._id}/reminders/${reminderId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Failed to delete reminder");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders", lead._id] });
      toast({
        title: "Success",
        description: "Reminder deleted",
        variant: "success",
      });
    },
    onError: (error) => {
      console.error("Error deleting reminder:", error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      });
    },
  });

  // Handler functions for reminders
  const handleAddReminder = useCallback(
    (reminderData: {
      title: string;
      description?: string;
      reminderDate: string;
      reminderTime: string;
      type: string;
      soundEnabled: boolean;
    }) => {
      addReminderMutation.mutate(reminderData);
    },
    [addReminderMutation]
  );

  const handleCompleteReminder = useCallback(
    (reminderId: string) => {
      updateReminderMutation.mutate({
        reminderId,
        updates: { status: "COMPLETED" },
      });
    },
    [updateReminderMutation]
  );

  const handleSnoozeReminder = useCallback(
    (reminderId: string, minutes: number) => {
      const snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
      updateReminderMutation.mutate({
        reminderId,
        updates: {
          status: "SNOOZED",
          snoozedUntil: snoozedUntil.toISOString(),
        },
      });
    },
    [updateReminderMutation]
  );

  const handleDeleteReminder = useCallback(
    (reminderId: string) => {
      deleteReminderMutation.mutate(reminderId);
    },
    [deleteReminderMutation]
  );

  // Handle errors
  React.useEffect(() => {
    if (commentsError) {
      console.error("Comments query error:", commentsError);
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      });
    }
  }, [commentsError, toast]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full min-h-0">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "comments"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
            }`}
          >
            <Notebook className="w-5 h-5" />
            Comments
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "activity"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
            }`}
          >
            <ActivityIcon className="w-5 h-5" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "reminders"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
            }`}
          >
            <Bell className="w-5 h-5" />
            Reminders
            {reminders.filter(
              (r) => r.status === "PENDING" || r.status === "SNOOZED"
            ).length > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {
                  reminders.filter(
                    (r) => r.status === "PENDING" || r.status === "SNOOZED"
                  ).length
                }
              </span>
            )}
          </button>
        </div>
      </div>

      {/* This is the scrollable/fill area */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoadingComments && activeTab === "comments" ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 dark:text-blue-400" />
          </div>
        ) : (
          <>
            {activeTab === "comments" && (
              <Comments
                comments={comments}
                commentContent={commentContent}
                setCommentContent={setCommentContent}
                isSaving={addCommentMutation.isPending}
                handleAddComment={handleAddComment}
                onCommentDeleted={handleCommentDeleted}
                onCommentEdited={handleCommentEdited}
                isDeleting={deleteCommentMutation.isPending}
                isEditing={editCommentMutation.isPending}
              />
            )}
            {activeTab === "activity" && (
              <div className="flex-1 min-h-0 flex flex-col">
                <Activities leadId={lead._id} />
              </div>
            )}
            {activeTab === "reminders" && (
              <Reminders
                reminders={reminders}
                isLoading={isLoadingReminders}
                leadId={lead._id}
                onAddReminder={handleAddReminder}
                onUpdateReminder={(id, updates) =>
                  updateReminderMutation.mutate({ reminderId: id, updates })
                }
                onDeleteReminder={handleDeleteReminder}
                onCompleteReminder={handleCompleteReminder}
                onSnoozeReminder={handleSnoozeReminder}
                isSaving={addReminderMutation.isPending}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentsAndActivities;
