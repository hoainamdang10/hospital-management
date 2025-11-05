"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  Send,
  X,
  Minimize2,
  Maximize2,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Circle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from "./AuthContext";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "file";
  status: "sent" | "delivered" | "read";
}

interface ChatUser {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: Date;
}

interface ChatRoom {
  id: string;
  name: string;
  participants: ChatUser[];
  lastMessage?: Message;
  unreadCount: number;
  type: "direct" | "group";
}

export function ChatSystem() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data
  const [chatRooms] = useState<ChatRoom[]>([
    {
      id: "1",
      name: "BS. Nguyễn Văn A",
      type: "direct",
      participants: [
        {
          id: "doctor1",
          name: "BS. Nguyễn Văn A",
          role: "Bác sĩ Tim mạch",
          avatar: "/avatars/doctor1.jpg",
          isOnline: true,
        },
      ],
      unreadCount: 2,
      lastMessage: {
        id: "msg1",
        senderId: "doctor1",
        senderName: "BS. Nguyễn Văn A",
        senderRole: "doctor",
        content: "Kết quả xét nghiệm của bệnh nhân đã có",
        timestamp: new Date(Date.now() - 300000),
        type: "text",
        status: "delivered",
      },
    },
    {
      id: "2",
      name: "Nhóm Y tá tầng 3",
      type: "group",
      participants: [
        {
          id: "nurse1",
          name: "Y tá Trần Thị B",
          role: "Y tá",
          avatar: "/avatars/nurse1.jpg",
          isOnline: true,
        },
        {
          id: "nurse2",
          name: "Y tá Lê Văn C",
          role: "Y tá",
          avatar: "/avatars/nurse2.jpg",
          isOnline: false,
          lastSeen: new Date(Date.now() - 3600000),
        },
      ],
      unreadCount: 0,
      lastMessage: {
        id: "msg2",
        senderId: "nurse1",
        senderName: "Y tá Trần Thị B",
        senderRole: "nurse",
        content: "Đã hoàn thành kiểm tra ca đêm",
        timestamp: new Date(Date.now() - 1800000),
        type: "text",
        status: "read",
      },
    },
    {
      id: "3",
      name: "BN. Nguyễn Thị D",
      type: "direct",
      participants: [
        {
          id: "patient1",
          name: "BN. Nguyễn Thị D",
          role: "Bệnh nhân",
          avatar: "/avatars/patient1.jpg",
          isOnline: false,
          lastSeen: new Date(Date.now() - 7200000),
        },
      ],
      unreadCount: 1,
      lastMessage: {
        id: "msg3",
        senderId: "patient1",
        senderName: "BN. Nguyễn Thị D",
        senderRole: "patient",
        content: "Tôi muốn hỏi về thuốc được kê đơn",
        timestamp: new Date(Date.now() - 900000),
        type: "text",
        status: "sent",
      },
    },
  ]);

  const [messages] = useState<Record<string, Message[]>>({
    "1": [
      {
        id: "msg1-1",
        senderId: "doctor1",
        senderName: "BS. Nguyễn Văn A",
        senderRole: "doctor",
        content:
          "Chào bạn, tôi cần xem lại hồ sơ bệnh án của bệnh nhân phòng 302",
        timestamp: new Date(Date.now() - 1800000),
        type: "text",
        status: "read",
      },
      {
        id: "msg1-2",
        senderId: user?.id || "current-user",
        senderName: user?.name || "Bạn",
        senderRole: user?.role || "staff",
        content: "Tôi sẽ gửi ngay hồ sơ cho bạn",
        timestamp: new Date(Date.now() - 1500000),
        type: "text",
        status: "read",
      },
      {
        id: "msg1-3",
        senderId: "doctor1",
        senderName: "BS. Nguyễn Văn A",
        senderRole: "doctor",
        content: "Kết quả xét nghiệm của bệnh nhân đã có",
        timestamp: new Date(Date.now() - 300000),
        type: "text",
        status: "delivered",
      },
    ],
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const handleSendMessage = () => {
    if (!message.trim() || !activeChat) return;

    // Here you would typically send to backend
    console.log("Sending message:", { chatId: activeChat, content: message });

    setMessage("");
  };

  const filteredChats = chatRooms.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const totalUnread = chatRooms.reduce(
    (sum, chat) => sum + chat.unreadCount,
    0
  );
  const activeRoom = chatRooms.find((room) => room.id === activeChat);
  const activeMessages = activeChat ? messages[activeChat] || [] : [];

  return (
    <>
      {/* Chat Trigger Button */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="icon"
          className="h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg relative"
        >
          <MessageCircle className="h-6 w-6" />
          {totalUnread > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {totalUnread > 99 ? "99+" : totalUnread}
            </Badge>
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 100 }}
            className={`fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 ${
              isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-600 text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-semibold">
                  {activeChat ? activeRoom?.name : "Tin nhắn"}
                </h3>
                {activeRoom?.type === "direct" &&
                  activeRoom.participants[0]?.isOnline && (
                    <Circle className="h-2 w-2 fill-green-400 text-green-400" />
                  )}
              </div>
              <div className="flex items-center gap-1">
                {activeChat && !isMinimized && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Xem thông tin</DropdownMenuItem>
                        <DropdownMenuItem>Tắt thông báo</DropdownMenuItem>
                        <DropdownMenuItem>Xóa tin nhắn</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                >
                  {isMinimized ? (
                    <Maximize2 className="h-4 w-4" />
                  ) : (
                    <Minimize2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {!isMinimized && (
              <div className="flex h-[calc(100%-56px)]">
                {/* Chat List */}
                <div
                  className={`${
                    activeChat ? "w-1/3" : "w-full"
                  } border-r border-gray-200 dark:border-gray-700 flex flex-col`}
                >
                  <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <Input
                      placeholder="Tìm kiếm cuộc trò chuyện..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {filteredChats.map((chat) => (
                        <motion.div
                          key={chat.id}
                          whileHover={{
                            backgroundColor: "rgba(59, 130, 246, 0.05)",
                          }}
                          className={`p-3 rounded-lg cursor-pointer mb-1 ${
                            activeChat === chat.id
                              ? "bg-blue-50 dark:bg-blue-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                          onClick={() => setActiveChat(chat.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={chat.participants[0]?.avatar}
                                />
                                <AvatarFallback>
                                  {chat.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              {chat.participants[0]?.isOnline && (
                                <Circle className="absolute -bottom-0.5 -right-0.5 h-3 w-3 fill-green-400 text-green-400 border-2 border-white dark:border-gray-800" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {chat.name}
                                </p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {chat.lastMessage &&
                                    formatTime(chat.lastMessage.timestamp)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {chat.lastMessage?.content ||
                                    "Chưa có tin nhắn"}
                                </p>
                                {chat.unreadCount > 0 && (
                                  <Badge
                                    variant="destructive"
                                    className="h-5 min-w-[20px] rounded-full text-xs"
                                  >
                                    {chat.unreadCount}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Chat Messages */}
                {activeChat && (
                  <div className="flex-1 flex flex-col">
                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {activeMessages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${
                              msg.senderId === user?.id
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div
                              className={`max-w-[70%] ${
                                msg.senderId === user?.id
                                  ? "order-2"
                                  : "order-1"
                              }`}
                            >
                              <div
                                className={`rounded-lg p-3 ${
                                  msg.senderId === user?.id
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                                }`}
                              >
                                <p className="text-sm">{msg.content}</p>
                              </div>
                              <div
                                className={`flex items-center gap-1 mt-1 text-xs text-gray-500 dark:text-gray-400 ${
                                  msg.senderId === user?.id
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >
                                <span>{formatTime(msg.timestamp)}</span>
                                {msg.senderId === user?.id && (
                                  <span className="text-blue-500">
                                    {msg.status === "sent" && "✓"}
                                    {msg.status === "delivered" && "✓✓"}
                                    {msg.status === "read" && "✓✓"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                          <Input
                            placeholder="Nhập tin nhắn..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) =>
                              e.key === "Enter" && handleSendMessage()
                            }
                            className="border-none bg-gray-100 dark:bg-gray-700 focus:ring-0"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0"
                        >
                          <Smile className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSendMessage}
                          disabled={!message.trim()}
                          className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
