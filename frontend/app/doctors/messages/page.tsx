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
  Calendar,
  AlertCircle,
  Star,
  Plus,
  Filter,
  Stethoscope,
  FileText,
  Pill,
  Activity,
  Priority
} from "lucide-react"
import { DoctorLayout } from "@/components/layout/UniversalLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEnhancedAuth } from "@/lib/auth/auth-wrapper"
import { toast } from "sonner"

interface Message {
  message_id: string
  conversation_id: string
  sender_id: string
  sender_type: 'patient' | 'doctor'
  content: string
  message_type: 'text' | 'image' | 'file' | 'prescription' | 'appointment'
  timestamp: string
  read: boolean
  attachment_url?: string
  attachment_name?: string
}

interface Conversation {
  conversation_id: string
  patient_id: string
  patient_name: string
  patient_age: number
  patient_avatar?: string
  last_message: string
  last_message_time: string
  unread_count: number
  status: 'active' | 'archived'
  priority: 'normal' | 'urgent' | 'emergency'
  medical_condition?: string
  last_appointment?: string
}

// Mock data
const mockConversations: Conversation[] = [
  {
    conversation_id: "1",
    patient_id: "1",
    patient_name: "Nguyễn Văn A",
    patient_age: 45,
    last_message: "Cảm ơn bác sĩ đã tư vấn. Em sẽ uống thuốc theo đúng chỉ định.",
    last_message_time: "2025-01-03T14:30:00",
    unread_count: 0,
    status: "active",
    priority: "normal",
    medical_condition: "Tăng huyết áp",
    last_appointment: "2025-01-02"
  },
  {
    conversation_id: "2",
    patient_id: "2",
    patient_name: "Trần Thị B",
    patient_age: 32,
    last_message: "Bác sĩ ơi, em bị đau ngực từ sáng nay. Em có nên đến bệnh viện không ạ?",
    last_message_time: "2025-01-03T16:45:00",
    unread_count: 3,
    status: "active",
    priority: "urgent",
    medical_condition: "Tim mạch",
    last_appointment: "2025-01-01"
  },
  {
    conversation_id: "3",
    patient_id: "3",
    patient_name: "Lê Văn C",
    patient_age: 28,
    last_message: "Kết quả xét nghiệm đã có, em gửi ảnh cho bác sĩ xem ạ.",
    last_message_time: "2025-01-03T11:20:00",
    unread_count: 1,
    status: "active",
    priority: "normal",
    medical_condition: "Khám tổng quát"
  }
]

const mockMessages: Message[] = [
  {
    message_id: "1",
    conversation_id: "2",
    sender_id: "patient",
    sender_type: "patient",
    content: "Chào bác sĩ, em bị đau ngực từ sáng nay. Cảm giác như bị thắt lại và hơi khó thở.",
    message_type: "text",
    timestamp: "2025-01-03T16:30:00",
    read: true
  },
  {
    message_id: "2",
    conversation_id: "2",
    sender_id: "patient",
    sender_type: "patient",
    content: "Em có nên đến bệnh viện ngay không ạ? Em hơi lo lắng.",
    message_type: "text",
    timestamp: "2025-01-03T16:32:00",
    read: true
  },
  {
    message_id: "3",
    conversation_id: "2",
    sender_id: "doctor",
    sender_type: "doctor",
    content: "Chào anh! Bác sĩ hiểu anh đang lo lắng. Với triệu chứng đau ngực và khó thở, bác sĩ khuyên anh nên đến bệnh viện ngay để được khám và đánh giá chính xác.",
    message_type: "text",
    timestamp: "2025-01-03T16:35:00",
    read: true
  },
  {
    message_id: "4",
    conversation_id: "2",
    sender_id: "doctor",
    sender_type: "doctor",
    content: "Trong lúc chờ đợi, anh hãy ngồi thẳng, thở chậm và sâu. Tránh vận động mạnh. Nếu triệu chứng nặng hơn, hãy gọi cấp cứu 115 ngay.",
    message_type: "text",
    timestamp: "2025-01-03T16:36:00",
    read: true
  },
  {
    message_id: "5",
    conversation_id: "2",
    sender_id: "patient",
    sender_type: "patient",
    content: "Bác sĩ ơi, em bị đau ngực từ sáng nay. Em có nên đến bệnh viện không ạ?",
    message_type: "text",
    timestamp: "2025-01-03T16:45:00",
    read: false
  }
]

const quickReplies = [
  "Anh/chị nên đến khám ngay để được đánh giá chính xác.",
  "Hãy uống thuốc theo đúng chỉ định và theo dõi triệu chứng.",
  "Kết quả xét nghiệm bình thường, anh/chị yên tâm.",
  "Tôi sẽ kê đơn thuốc mới cho anh/chị.",
  "Hãy đặt lịch tái khám sau 1 tuần.",
  "Nếu có triệu chứng bất thường, liên hệ ngay với tôi."
]

export default function DoctorMessagesPage() {
  const { user, loading } = useEnhancedAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string>("")
  const [newMessage, setNewMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.medical_condition?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPriority = priorityFilter === "all" || conv.priority === priorityFilter
    return matchesSearch && matchesPriority
  })

  const currentConversation = conversations.find(c => c.conversation_id === selectedConversation)
  const conversationMessages = messages.filter(m => m.conversation_id === selectedConversation)

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return

    setIsSending(true)
    try {
      const message: Message = {
        message_id: Date.now().toString(),
        conversation_id: selectedConversation,
        sender_id: user?.id || "doctor",
        sender_type: "doctor",
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
          ? { ...conv, last_message: newMessage, last_message_time: new Date().toISOString(), unread_count: 0 }
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

  const handleQuickReply = (reply: string) => {
    setNewMessage(reply)
  }

  const handlePrescription = () => {
    // In real app, open prescription dialog
    toast.info("Chức năng kê đơn thuốc đang được phát triển")
  }

  const handleAppointment = () => {
    // In real app, open appointment booking
    toast.info("Chức năng đặt lịch hẹn đang được phát triển")
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'bg-red-500 text-white'
      case 'urgent': return 'bg-orange-500 text-white'
      case 'normal': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'Cấp cứu'
      case 'urgent': return 'Khẩn cấp'
      case 'normal': return 'Bình thường'
      default: return priority
    }
  }

  if (loading || isLoading) {
    return (
      <DoctorLayout title="Tin nhắn" activePage="messages">
        <div className="animate-pulse">
          <div className="grid md:grid-cols-3 gap-6 h-[600px]">
            <div className="bg-gray-200 rounded-lg"></div>
            <div className="md:col-span-2 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </DoctorLayout>
    )
  }

  return (
    <DoctorLayout title="Tin nhắn bệnh nhân" activePage="messages">
      <div className="grid md:grid-cols-3 gap-6 h-[700px]">
        {/* Conversations List */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tin nhắn bệnh nhân</CardTitle>
              <Badge variant="secondary">
                {conversations.reduce((sum, conv) => sum + conv.unread_count, 0)} chưa đọc
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Tìm kiếm bệnh nhân..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Lọc theo mức độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="emergency">Cấp cứu</SelectItem>
                  <SelectItem value="urgent">Khẩn cấp</SelectItem>
                  <SelectItem value="normal">Bình thường</SelectItem>
                </SelectContent>
              </Select>
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
                      <AvatarImage src={conversation.patient_avatar} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-sm truncate">
                          {conversation.patient_name}
                        </h4>
                        <div className="flex items-center gap-1">
                          <Badge className={`text-xs ${getPriorityColor(conversation.priority)}`}>
                            {getPriorityLabel(conversation.priority)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.last_message_time)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-600">
                          {conversation.patient_age} tuổi
                        </span>
                        {conversation.medical_condition && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-600">
                              {conversation.medical_condition}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 truncate">
                        {conversation.last_message}
                      </p>
                      {conversation.unread_count > 0 && (
                        <Badge className="mt-2 bg-red-600 text-white text-xs">
                          {conversation.unread_count} tin nhắn mới
                        </Badge>
                      )}
                      {conversation.last_appointment && (
                        <p className="text-xs text-gray-500 mt-1">
                          Khám gần nhất: {new Date(conversation.last_appointment).toLocaleDateString('vi-VN')}
                        </p>
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
                      <AvatarImage src={currentConversation.patient_avatar} />
                      <AvatarFallback>
                        <User className="w-5 h-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{currentConversation.patient_name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{currentConversation.patient_age} tuổi</span>
                        {currentConversation.medical_condition && (
                          <>
                            <span>•</span>
                            <span>{currentConversation.medical_condition}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handlePrescription}>
                      <Pill className="w-4 h-4 mr-1" />
                      Kê đơn
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleAppointment}>
                      <Calendar className="w-4 h-4 mr-1" />
                      Đặt lịch
                    </Button>
                    <Button size="sm" variant="outline">
                      <Phone className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Video className="w-4 h-4" />
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
                    className={`flex ${message.sender_type === 'doctor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${message.sender_type === 'doctor' ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`p-3 rounded-lg ${
                          message.sender_type === 'doctor'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${
                        message.sender_type === 'doctor' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(message.timestamp)}
                        </span>
                        {message.sender_type === 'doctor' && (
                          <CheckCheck className={`w-3 h-3 ${message.read ? 'text-blue-500' : 'text-gray-400'}`} />
                        )}
                      </div>
                    </div>
                    {message.sender_type === 'patient' && (
                      <Avatar className="w-8 h-8 order-1 mr-2">
                        <AvatarImage src={currentConversation.patient_avatar} />
                        <AvatarFallback>
                          <User className="w-4 h-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </CardContent>

              {/* Quick Replies */}
              <div className="px-4 py-2 border-t bg-gray-50">
                <p className="text-xs text-gray-600 mb-2">Trả lời nhanh:</p>
                <div className="flex flex-wrap gap-1">
                  {quickReplies.slice(0, 3).map((reply, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickReply(reply)}
                      className="text-xs h-6"
                    >
                      {reply.length > 30 ? reply.substring(0, 30) + '...' : reply}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-end gap-2">
                  <Button size="sm" variant="outline">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <FileText className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <Textarea
                      placeholder="Nhập tin nhắn cho bệnh nhân..."
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
                  Chọn một bệnh nhân để bắt đầu trò chuyện
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
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" onClick={handlePrescription}>
              <Pill className="w-6 h-6 text-green-600" />
              <span className="text-sm">Kê đơn thuốc</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" onClick={handleAppointment}>
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-sm">Đặt lịch tái khám</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <FileText className="w-6 h-6 text-purple-600" />
              <span className="text-sm">Gửi kết quả XN</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Video className="w-6 h-6 text-orange-600" />
              <span className="text-sm">Tư vấn từ xa</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DoctorLayout>
  )
}
