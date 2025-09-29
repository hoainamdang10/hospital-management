"use client";

import { useMutation } from "@apollo/client";
import {
  CREATE_APPOINTMENT,
  UPDATE_APPOINTMENT,
  CONFIRM_APPOINTMENT,
  CANCEL_APPOINTMENT,
} from "../mutations/doctor";
import { GET_DOCTOR_DASHBOARD } from "../queries/doctor";
import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  Appointment,
} from "../types/generated";
import { toast } from "sonner";

interface UseAppointmentMutationsOptions {
  doctorId?: string;
  onSuccess?: (appointment: Appointment) => void;
  onError?: (error: any) => void;
}

export function useAppointmentMutations({
  doctorId,
  onSuccess,
  onError,
}: UseAppointmentMutationsOptions = {}) {
  // Create appointment mutation
  const [createAppointmentMutation, { loading: creating }] = useMutation(
    CREATE_APPOINTMENT,
    {
      refetchQueries: doctorId
        ? [{ query: GET_DOCTOR_DASHBOARD, variables: { doctorId } }]
        : [],
      onCompleted: (data) => {
        toast.success("Cuộc hẹn đã được tạo thành công!");
        onSuccess?.(data.createAppointment);
      },
      onError: (error) => {
        toast.error("Lỗi khi tạo cuộc hẹn: " + error.message);
        onError?.(error);
      },
    }
  );

  // Update appointment mutation
  const [updateAppointmentMutation, { loading: updating }] = useMutation(
    UPDATE_APPOINTMENT,
    {
      refetchQueries: doctorId
        ? [{ query: GET_DOCTOR_DASHBOARD, variables: { doctorId } }]
        : [],
      onCompleted: (data) => {
        toast.success("Cuộc hẹn đã được cập nhật thành công!");
        onSuccess?.(data.updateAppointment);
      },
      onError: (error) => {
        toast.error("Lỗi khi cập nhật cuộc hẹn: " + error.message);
        onError?.(error);
      },
    }
  );

  // Confirm appointment mutation
  const [confirmAppointmentMutation, { loading: confirming }] = useMutation(
    CONFIRM_APPOINTMENT,
    {
      refetchQueries: doctorId
        ? [{ query: GET_DOCTOR_DASHBOARD, variables: { doctorId } }]
        : [],
      onCompleted: (data) => {
        toast.success("Cuộc hẹn đã được xác nhận!");
        onSuccess?.(data.confirmAppointment);
      },
      onError: (error) => {
        toast.error("Lỗi khi xác nhận cuộc hẹn: " + error.message);
        onError?.(error);
      },
    }
  );

  // Cancel appointment mutation
  const [cancelAppointmentMutation, { loading: cancelling }] = useMutation(
    CANCEL_APPOINTMENT,
    {
      refetchQueries: doctorId
        ? [{ query: GET_DOCTOR_DASHBOARD, variables: { doctorId } }]
        : [],
      onCompleted: (data) => {
        toast.success("Cuộc hẹn đã được hủy!");
        onSuccess?.(data.cancelAppointment);
      },
      onError: (error) => {
        toast.error("Lỗi khi hủy cuộc hẹn: " + error.message);
        onError?.(error);
      },
    }
  );

  // Wrapper functions
  const createAppointment = async (input: CreateAppointmentInput) => {
    try {
      const result = await createAppointmentMutation({
        variables: { input },
      });
      return result.data?.createAppointment;
    } catch (error) {
      throw error;
    }
  };

  const updateAppointment = async (id: string, input: UpdateAppointmentInput) => {
    try {
      const result = await updateAppointmentMutation({
        variables: { id, input },
      });
      return result.data?.updateAppointment;
    } catch (error) {
      throw error;
    }
  };

  const confirmAppointment = async (id: string) => {
    try {
      const result = await confirmAppointmentMutation({
        variables: { id },
      });
      return result.data?.confirmAppointment;
    } catch (error) {
      throw error;
    }
  };

  const cancelAppointment = async (id: string, reason?: string) => {
    try {
      const result = await cancelAppointmentMutation({
        variables: { id, reason },
      });
      return result.data?.cancelAppointment;
    } catch (error) {
      throw error;
    }
  };

  return {
    createAppointment,
    updateAppointment,
    confirmAppointment,
    cancelAppointment,
    loading: creating || updating || confirming || cancelling,
    creating,
    updating,
    confirming,
    cancelling,
  };
}
