// src/components/leads/leadDetailsPanel/CommentsAndActivities.tsx
"use client";

import React, { FC, useState, useEffect, useCallback, useRef } from "react";
import { Lead } from "@/types/leads";
import { Notebook, Activity as ActivityIcon, Loader2 } from "lucide-react";
import Comments from "./Comments";
import Activities from "./Activities";
import { useToast } from "@/components/ui/use-toast";

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

const CommentsAndActivities: FC<CommentsAndActivitiesProps> = ({ lead }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"comments" | "activity">(
    "comments"
  );
  const [commentContent, setCommentContent] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activitiesKey, setActivitiesKey] = useState(0);

  // Prevent duplicate fetches
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef<number>(0);
  const currentLeadIdRef = useRef<string | null>(null);

  // Store the latest toast function in a ref
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Memoized fetch function for comments
  const fetchComments = useCallback(async () => {
    if (!lead?._id) return;
    if (isFetchingRef.current || currentLeadIdRef.current === lead._id) return;
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 1000) return; // Debounce fetches

    isFetchingRef.current = true;
    currentLeadIdRef.current = lead._id;
    lastFetchTimeRef.current = now;
    setIsLoading(true);

    try {
      console.log("=== FETCHING COMMENTS ===");
      console.log("Lead ID:", lead._id);
      console.log("Fetch URL:", `/api/leads/${lead._id}/comments`);

      const commentsResponse = await fetch(`/api/leads/${lead._id}/comments`);
      console.log("Response status:", commentsResponse.status);
      console.log("Response ok:", commentsResponse.ok);

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        console.log("Raw comments data:", commentsData);
        console.log("Comments data type:", typeof commentsData);
        console.log("Is array:", Array.isArray(commentsData));

        const transformedComments = commentsData.map(transformComment);
        console.log("Transformed comments:", transformedComments);
        setComments(transformedComments);
      } else {
        console.log(
          "Comments response not ok, status:",
          commentsResponse.status
        );
        const errorText = await commentsResponse.text();
        console.log("Error response:", errorText);
        setComments([]);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
      toastRef.current({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      });
      setComments([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
      currentLeadIdRef.current = null;
    }
  }, [lead?._id]);

  useEffect(() => {
    if (lead?._id) {
      fetchComments();
    }
  }, [lead?._id, fetchComments]);

  const handleAddComment = useCallback(async () => {
    if (!commentContent.trim() || !lead?._id) return;
    setIsSaving(true);
    try {
      console.log("=== ADDING COMMENT ===");
      console.log("Lead ID:", lead._id);
      console.log("Content:", commentContent);

      const response = await fetch(`/api/leads/${lead._id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentContent }),
      });

      console.log("Add comment response status:", response.status);
      console.log("Add comment response ok:", response.ok);

      if (response.ok) {
        const newComment = await response.json();
        console.log("New comment response:", newComment);
        const transformedComment = transformComment(newComment);
        console.log("Transformed new comment:", transformedComment);

        setComments((prev) => {
          const updated = [transformedComment, ...prev];
          console.log("Updated comments array:", updated);
          return updated;
        });
        setCommentContent("");
        setActivitiesKey((prev) => prev + 1);

        toastRef.current({
          title: "Success",
          description: "Comment added successfully",
          variant: "success",
        });
      } else {
        const errorText = await response.text();
        console.log("Add comment error response:", errorText);
        throw new Error(`Failed to add comment: ${errorText}`);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toastRef.current({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }, [commentContent, lead]);

  const handleCommentDeleted = useCallback(
    async (commentId: string) => {
      try {
        console.log("=== DELETING COMMENT ===");
        console.log("Comment ID:", commentId);
        console.log("Lead ID:", lead._id);

        const response = await fetch(
          `/api/leads/${lead._id}/comments/${commentId}`,
          { method: "DELETE" }
        );

        console.log("Delete comment response status:", response.status);
        console.log("Delete comment response ok:", response.ok);

        if (response.ok) {
          setComments((prev) => {
            const updated = prev.filter((comment) => comment._id !== commentId);
            console.log("Comments after deletion:", updated);
            return updated;
          });
          setActivitiesKey((prev) => prev + 1);

          toastRef.current({
            title: "Success",
            description: "Comment deleted successfully",
            variant: "success",
          });
        } else {
          const errorText = await response.text();
          console.log("Delete comment error response:", errorText);
          throw new Error(`Failed to delete comment: ${errorText}`);
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        toastRef.current({
          title: "Error",
          description: "Failed to delete comment",
          variant: "destructive",
        });
      }
    },
    [lead._id]
  );

  const handleCommentEdited = useCallback(
    async (updatedComment: Comment) => {
      try {
        console.log("=== EDITING COMMENT ===");
        console.log("Comment ID:", updatedComment._id);
        console.log("Lead ID:", lead._id);
        console.log("New content:", updatedComment.content);

        const response = await fetch(
          `/api/leads/${lead._id}/comments/${updatedComment._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: updatedComment.content }),
          }
        );

        console.log("Edit comment response status:", response.status);
        console.log("Edit comment response ok:", response.ok);

        if (response.ok) {
          const savedComment = await response.json();
          console.log("Saved comment response:", savedComment);
          const transformedComment = transformComment(savedComment);
          console.log("Transformed saved comment:", transformedComment);

          setComments((prev) => {
            const updated = prev.map((comment) =>
              comment._id === updatedComment._id ? transformedComment : comment
            );
            console.log("Comments after edit:", updated);
            return updated;
          });
          setActivitiesKey((prev) => prev + 1);

          toastRef.current({
            title: "Success",
            description: "Comment updated successfully",
            variant: "success",
          });
        } else {
          const errorText = await response.text();
          console.log("Edit comment error response:", errorText);
          throw new Error(`Failed to update comment: ${errorText}`);
        }
      } catch (error) {
        console.error("Error updating comment:", error);
        toastRef.current({
          title: "Error",
          description: "Failed to update comment",
          variant: "destructive",
        });
      }
    },
    [lead._id]
  );

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
        </div>
      </div>

      {/* This is the scrollable/fill area */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
          </div>
        ) : (
          <>
            {activeTab === "comments" && (
              <Comments
                comments={comments}
                commentContent={commentContent}
                setCommentContent={setCommentContent}
                isSaving={isSaving}
                handleAddComment={handleAddComment}
                onCommentDeleted={handleCommentDeleted}
                onCommentEdited={handleCommentEdited}
              />
            )}
            {activeTab === "activity" && (
              <div className="flex-1 min-h-0 flex flex-col">
                <Activities
                  leadId={lead._id}
                  key={`${lead._id}-${activitiesKey}`}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

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

export default CommentsAndActivities;
