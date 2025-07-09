"use client";

import { FC, useState, useEffect, KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format, formatDistanceToNow, isValid } from "date-fns";
import { Comments as CommentType } from "@/types/leads";

interface CommentsProps {
  comments: CommentType[];
  commentContent: string;
  setCommentContent: (val: string) => void;
  isSaving: boolean;
  handleAddComment: () => void;
  onCommentDeleted?: (commentId: string) => void;
  onCommentEdited?: (updatedComment: CommentType) => void;
}

const LOCAL_STORAGE_KEY = "lead_comment_draft";

const Comments: FC<CommentsProps> = ({
  comments,
  commentContent,
  setCommentContent,
  isSaving,
  handleAddComment,
  onCommentDeleted,
  onCommentEdited,
}) => {
  const { data: session } = useSession();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const isAdmin = session?.user?.role === "ADMIN";

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved && !commentContent) {
      setCommentContent(saved);
    }
    // eslint-disable-next-line
  }, []);

  // Save draft to localStorage on change
  useEffect(() => {
    if (commentContent) {
      localStorage.setItem(LOCAL_STORAGE_KEY, commentContent);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [commentContent]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return "Invalid date";
      return format(date, "d MMM, yyyy 'at' h:mm a");
    } catch (error) {
      console.error("Error formatting date", error);
      return "";
    }
  };

  const formatRelative = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (!isValid(date)) return "";
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return "";
    }
  };

  const handleDelete = (commentId: string) => {
    if (deletingId === commentId || !onCommentDeleted) return;
    setDeletingId(commentId);
    Promise.resolve(onCommentDeleted(commentId)).finally(() =>
      setDeletingId(null)
    );
  };

  const handleEdit = (comment: CommentType) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (comment: CommentType) => {
    if (!onCommentEdited || !editContent.trim()) return;
    setSavingEdit(true);
    try {
      await onCommentEdited({
        ...comment,
        content: editContent,
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error updating comment:", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      if (!isSaving && commentContent.trim()) {
        e.preventDefault();
        handleAddComment();
      }
    }
  };

  return (
    <div
      className="flex-1 min-h-0 flex flex-col bg-gray-50 dark:bg-gray-800/50 p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
      style={{ height: "100%" }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 border border-gray-100 dark:border-gray-700 flex-1 min-h-0 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
          Add a comment
        </h3>
        <textarea
          placeholder="Write your thoughts about this lead... (Press Cmd/Ctrl + Enter to submit)"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 focus:border-indigo-400 dark:focus:border-indigo-500 resize-none min-h-[120px] text-gray-700 dark:text-gray-200 bg-transparent"
          rows={4}
          value={commentContent}
          onChange={(e) => setCommentContent(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="flex justify-end mt-3">
          <Button
            onClick={handleAddComment}
            disabled={isSaving || !commentContent.trim()}
            className="gap-2 bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Comment
              </>
            )}
          </Button>
        </div>

        <div className="mt-6 flex-1 min-h-0 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">
            Comments ({comments.length})
          </h3>

          {comments.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No comments yet. Be the first to comment!
                </p>
              </div>
            </div>
          ) : (
            <div
              className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4 border border-gray-200 dark:border-gray-700 shadow-inner"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#9333ea #f3f4f6",
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
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="p-4 rounded-md bg-gray-100 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={comment.createdBy?.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 text-indigo-800 dark:text-indigo-300">
                        {comment.createdBy?.firstName?.[0]}
                        {comment.createdBy?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-baseline flex-wrap gap-2">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                          {comment.createdBy?.firstName}{" "}
                          {comment.createdBy?.lastName}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatRelative(comment.createdAt)}
                        </span>
                      </div>

                      {editingId === comment._id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveEdit(comment)}
                              disabled={savingEdit || !editContent.trim()}
                              className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white"
                            >
                              {savingEdit ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              <span className="ml-2">Save</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-4 h-4" />
                              <span className="ml-2">Cancel</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">
                            {comment.content}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                      )}
                    </div>

                    {isAdmin && editingId !== comment._id && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400"
                          onClick={() => handleEdit(comment)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                          onClick={() => handleDelete(comment._id)}
                          disabled={deletingId === comment._id}
                        >
                          {deletingId === comment._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Comments;
