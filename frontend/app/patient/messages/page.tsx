"use client"

import { useState, useEffect, useRef } from "react"
import {
  MessageCircle,
  Send,
  Search,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Image,
  File,
  Clock,
  CheckCheck,
  User,
  Stethoscope,
  Calendar,
  AlertCircle,
  Star,
  Plus,
  Filter
} from "lucide-react"
import { PatientLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { toast } from "sonner"

interface Message {
  message_id: string
  conversation_id: string
  sender_id: string
  sender_type: 'patient' | 'doctor'
  content: string
  message_type: 'text' | 'image' | 'file' | 'appointment'
  timestamp: string
  read: boolean
  attachment_url?: string
  attachment_name?: string
}

interface Conversation {
  conversation_id: string
  doctor_id: string
  doctor_name: string
  doctor_specialization: string
  doctor_avatar?: string
  last_message: string
  last_message_time: string
  unread_count: number
  status: 'active' | 'archived'
  priority: 'normal' | 'urgent'
}

// Mock data
const mockConversations: Conversation[] = [
  {
    conversation_id: "1",
    doctor_id: "1",
    doctor_name: "BS. Nguyễn Văn An",
    doctor_specialization: "Tim mạch",
    last_message: "Kết quả xét nghiệm của bạn đã có. Mọi chỉ số đều bình thường.",
    last_message_time: "2025-01-03T14:30:00",
    unread_count: 2,
    status: "active",
    priority: "normal"
  },
  {
    conversation_id: "2",
    doctor_id: "2",
    doctor_name: "BS. Trần Thị Bình",
    doctor_specialization: "Nhi khoa",
    last_message: "Cảm ơn bạn đã gửi ảnh. Tôi sẽ xem và phản hồi sớm.",
    last_message_time: "2025-01-02T16:45:00",
    unread_count: 0,
    status: "active",
    priority: "urgent"
  }
]

const mockMessages: Message[] = [
  {
    message_id: "1",
    conversation_id: "1",
    sender_id: "patient",
    sender_type: "patient",
    content: "Chào bác sĩ, em muốn hỏi về kết quả xét nghiệm hôm trước ạ.",
    message_type: "text",
    timestamp: "2025-01-03T10:00:00",
    read: true
  },
  {
    message_id: "2",
    conversation_id: "1",
    sender_id: "doctor",
    sender_type: "doctor",
    content: "Chào em! Bác sĩ đã xem kết quả xét nghiệm của em rồi. Tất cả các chỉ số đều trong giới hạn bình thường.",
    message_type: "text",
    timestamp: "2025-01-03T10:15:00",
    read: true
  },
  {
    message_id: "3",
    conversation_id: "1",
    sender_id: "doctor",
    sender_type: "doctor",
    content: "Em có thể tiếp tục duy trì chế độ ăn uống và tập luyện như hiện tại. Nếu có bất kỳ triệu chứng bất thường nào, hãy liên hệ ngay với bác sĩ nhé.",
    message_type: "text",
    timestamp: "2025-01-03T10:16:00",
    read: true
  },
  {
    message_id: "4",
    conversation_id: "1",
    sender_id: "patient",
    sender_type: "patient",
    content: "Cảm ơn bác sĩ rất nhiều! Em yên tâm rồi ạ.",
    message_type: "text",
    timestamp: "2025-01-03T10:30:00",
    read: true
  },
  {
    message_id: "5",
    conversation_id: "1",
    sender_id: "doctor",
    sender_type: "doctor",
    content: "Kết quả xét nghiệm của bạn đã có. Mọi chỉ số đều bình thường.",
    message_type: "text",
    timestamp: "2025-01-03T14:30:00",
    read: false
  }
]

export default function MessagesPage() {
  const { user, loading } = useEnhancedAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string>("")
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // In real app, fetch from API
        await new Promise(resolve => setTimeout(resolve, 1000))
        setConversations(mockConversations)
        setMessages(mockMessages)
        if (mockConversations.length > 0) {
          setSelectedConversation(mockConversations[0].conversation_id)
        }
      } catch (error) {
        console.error('Error fetching messages:', error)
        setConversations(mockConversations)
        setMessages(mockMessages)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, selectedConversation])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const filteredConversations = conversations.filter(conv =>
    conv.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.doctor_specialization.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const currentConversation = conversations.find(c => c.conversation_id === selectedConversation)
  const conversationMessages = messages.filter(m => m.conversation_id === selectedConversation)

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      const message: Message = {
        message_id: Date.now().toString(),
        conversation_id: selectedConversation,
        sender_id: user?.id || "patient",
        sender_type: "patient",
        content: newMessage,
        message_type: "text",
        timestamp: new Date().toISOString(),
        read: true
      }

      setMessages(prev => [...prev, message])
      setNewMessage("")

      // Update last message in conversation
      setConversations(prev => prev.map(conv => 
        conv.conversation_id === selectedConversation 
          ? { ...conv, last_message: newMessage, last_message_time: new Date().toISOString() }
          : conv
      ))

      // In real app, send to API
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      toast.error("Không thể gửi tin nhắn")
    } finally {
      setIsSending(false)
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 48) {
      return 'Hôm qua'
    } else {
      return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'numeric' })
    }
  }

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading || isLoading) {
    return (
      <PatientLayout title="Tin nhắn" activePage="messages">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            <div className="bg-gray-200 rounded-lg"></div>
            <div className="md:col-span-2 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </PatientLayout>
    )
  }

  return (
    <PatientLayout title="Tin nhắn với bác sĩ" activePage="messages">
      <div className="grid md:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tin nhắn</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Mới
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Tìm kiếm bác sĩ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="space-y-1">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.conversation_id}
                  onClick={() => setSelectedConversation(conversation.conversation_id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors ${
                    selectedConversation === conversation.conversation_id
                      ? 'bg-blue-50 border-l-blue-500'
                      : 'border-l-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={conversation.doctor_avatar} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.doctor_name}
                        </h4>
                        <div className="flex items-center gap-1">
                          {conversation.priority === 'urgent' && (
                            <AlertCircle className="w-3 h-3 text-red-500" />
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {conversation.doctor_specialization}
                      </p>
                      <p className="text-sm text-gray-700 truncate">
                        {conversation.last_message}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="mt-2 bg-blue-600 text-white text-xs">
                          {conversation.unread_count} tin nhắn mới
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="md:col-span-2 flex flex-col">
          {currentConversation ? (
            <>
              {/* Chat Header */}
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentConversation.doctor_avatar} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{currentConversation.doctor_name}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        {currentConversation.doctor_specialization}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.map((message) => (
                  <div
                    key={message.message_id}
                    className={`flex ${message.sender_type === 'patient' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender_type === 'patient' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender_type === 'patient'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${
                        message.sender_type === 'patient' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {message.sender_type === 'patient' && (
                          <CheckCheck className={`w-3 h-3 ${message.read ? 'text-blue-500' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </div>
                    {message.sender_type === 'doctor' && (
                      <Avatar className="w-8 h-8 order-1 mr-2">
                        <AvatarImage src={currentConversation.doctor_avatar} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-end gap-2">
                  <Button size="sm" variant="outline">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Image className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Nhập tin nhắn..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      rows={1}
                      className="resize-none"
                    />
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Nhấn Enter để gửi, Shift + Enter để xuống dòng
                </p>
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Chọn cuộc trò chuyện
                </h3>
                <p className="text-gray-500">
                  Chọn một bác sĩ để bắt đầu trò chuyện
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Hành động nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Đặt lịch khám</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Video className="w-6 h-6 text-green-600" />
              <span className="text-sm">Tư vấn từ xa</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <File className="w-6 h-6 text-purple-600" />
              <span className="text-sm">Gửi kết quả XN</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <span className="text-sm">Báo cáo khẩn cấp</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PatientLayout>
  )
}
