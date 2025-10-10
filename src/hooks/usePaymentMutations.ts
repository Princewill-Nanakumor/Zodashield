// src/hooks/usePaymentMutations.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { billingKeys } from "./useBillingData";
import {
  Payment,
  CreatePaymentData,
  CreatePaymentResponse,
} from "@/types/payment.types";

/**
 * Mutation hook for creating a payment
 */
export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (
      paymentData: CreatePaymentData
    ): Promise<CreatePaymentResponse> => {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: billingKeys.payments() });

      // Snapshot the previous value
      const previousPayments = queryClient.getQueryData(
        billingKeys.payments(10)
      );

      // No optimistic update for payment creation (we need the server response with wallet address)

      return { previousPayments };
    },
    onSuccess: (data) => {
      // Invalidate and refetch payments
      queryClient.invalidateQueries({
        queryKey: billingKeys.payments(),
        exact: false,
      });

      // Invalidate summary
      queryClient.invalidateQueries({
        queryKey: billingKeys.summary(),
      });

      toast({
        title: "Payment Created!",
        description: `Payment request for ${data.payment.amount} ${data.payment.currency} created successfully`,
        variant: "success",
      });
    },
    onError: (error: Error, _variables, context) => {
      // Rollback if needed
      if (context?.previousPayments) {
        queryClient.setQueryData(
          billingKeys.payments(10),
          context.previousPayments
        );
      }

      toast({
        title: "Payment Failed",
        description: error.message || "Failed to create payment request",
        variant: "destructive",
      });
    },
  });
};

/**
 * Mutation hook for approving a payment (Super Admin only)
 */
export const useApprovePayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: string): Promise<CreatePaymentResponse> => {
      const response = await fetch(`/api/payments/${paymentId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to approve payment");
      }

      return response.json();
    },
    onMutate: async (paymentId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: billingKeys.payment(paymentId),
      });
      await queryClient.cancelQueries({ queryKey: billingKeys.payments() });

      // Snapshot the previous values
      const previousPayment = queryClient.getQueryData(
        billingKeys.payment(paymentId)
      );
      const previousPayments = queryClient.getQueryData(
        billingKeys.payments(10)
      );

      // Optimistically update the payment status
      queryClient.setQueryData<Payment>(
        billingKeys.payment(paymentId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            status: "COMPLETED",
            approvedAt: new Date().toISOString(),
          };
        }
      );

      return { previousPayment, previousPayments };
    },
    onSuccess: (data) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: billingKeys.payments(),
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: billingKeys.balance(),
      });

      queryClient.invalidateQueries({
        queryKey: billingKeys.summary(),
      });

      toast({
        title: "Payment Approved!",
        description: data.message || "Payment has been approved successfully",
        variant: "success",
      });
    },
    onError: (error: Error, paymentId, context) => {
      // Rollback optimistic updates
      if (context?.previousPayment) {
        queryClient.setQueryData(
          billingKeys.payment(paymentId),
          context.previousPayment
        );
      }

      if (context?.previousPayments) {
        queryClient.setQueryData(
          billingKeys.payments(10),
          context.previousPayments
        );
      }

      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve payment",
        variant: "destructive",
      });
    },
  });
};

/**
 * Mutation hook for rejecting a payment (Super Admin only)
 */
export const useRejectPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentId: string): Promise<CreatePaymentResponse> => {
      const response = await fetch(`/api/payments/${paymentId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject payment");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({
        queryKey: billingKeys.payments(),
        exact: false,
      });

      queryClient.invalidateQueries({
        queryKey: billingKeys.summary(),
      });

      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject payment",
        variant: "destructive",
      });
    },
  });
};
