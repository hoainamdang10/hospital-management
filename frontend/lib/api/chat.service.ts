import apiClient from './axios';

export interface ChatConversation {
  conversationId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: string;
  content: string;
  sent_at: string;
}

export interface ChatParticipantContext {
  patientId?: string | null;
  doctorId?: string | null;
}

function buildParticipantHeaders(context?: ChatParticipantContext) {
  const headers: Record<string, string> = {};
  if (context?.patientId) {
    headers['x-patient-id'] = context.patientId;
  }
  if (context?.doctorId) {
    headers['x-provider-id'] = context.doctorId;
  }
  return headers;
}

export const chatService = {
  async getOrCreateConversation(appointmentId: string, context?: ChatParticipantContext) {
    const res = await apiClient.get('/v1/chat/conversations', {
      params: { appointmentId },
      headers: buildParticipantHeaders(context),
    });
    return res.data as { success: boolean } & ChatConversation;
  },

  async getMessages(conversationId: string, context?: ChatParticipantContext) {
    const res = await apiClient.get(`/v1/chat/conversations/${conversationId}/messages`, {
      headers: buildParticipantHeaders(context),
    });
    return res.data as { success: boolean; messages: ChatMessage[] };
  },

  async sendMessage(conversationId: string, content: string, context?: ChatParticipantContext) {
    const res = await apiClient.post(
      '/v1/chat/messages',
      { conversationId, content },
      { headers: buildParticipantHeaders(context) }
    );
    return res.data as { success: boolean; message: ChatMessage };
  },
};
