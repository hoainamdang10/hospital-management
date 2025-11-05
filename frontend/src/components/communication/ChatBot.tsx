import { useState, useRef, useEffect } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  Calendar,
  Clock,
  Phone,
  MapPin,
  Stethoscope,
  Heart,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  type: "user" | "bot";
  content: string;
  timestamp: Date;
  options?: string[];
  appointmentData?: {
    specialty: string;
    doctor: string;
    date: string;
    time: string;
  };
}

interface ChatBotProps {
  onBookAppointment?: (appointmentData: any) => void;
}

export function ChatBot({ onBookAppointment }: ChatBotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "bot",
      content:
        "👋 Xin chào! Tôi là MediBot, trợ lý ảo của bệnh viện MediCare. Tôi có thể giúp bạn:",
      timestamp: new Date(),
      options: [
        "📅 Đặt lịch khám bệnh",
        "🏥 Thông tin các khoa",
        "💰 Bảng giá dịch vụ",
        "📞 Liên hệ hỗ trợ",
        "🕐 Giờ làm việc",
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [currentFlow, setCurrentFlow] = useState<
    "main" | "appointment" | "info"
  >("main");
  const [appointmentStep, setAppointmentStep] = useState(0);
  const [appointmentData, setAppointmentData] = useState({
    specialty: "",
    doctor: "",
    date: "",
    time: "",
    patientName: "",
    phone: "",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const specialties = [
    { id: "cardiology", name: "Tim mạch", icon: "❤️" },
    { id: "neurology", name: "Thần kinh", icon: "🧠" },
    { id: "orthopedics", name: "Chấn thương chỉnh hình", icon: "🦴" },
    { id: "pediatrics", name: "Nhi khoa", icon: "👶" },
    { id: "dermatology", name: "Da liễu", icon: "🩹" },
    { id: "ophthalmology", name: "Mắt", icon: "👁️" },
  ];

  const doctors = {
    cardiology: ["BS. Nguyễn Văn A", "BS. Trần Thị B", "BS. Lê Văn C"],
    neurology: ["BS. Phạm Thị D", "BS. Hoàng Văn E", "BS. Đỗ Thị F"],
    orthopedics: ["BS. Vũ Văn G", "BS. Ngô Thị H", "BS. Bùi Văn I"],
    pediatrics: ["BS. Đặng Thị J", "BS. Lý Văn K", "BS. Mai Thị L"],
    dermatology: ["BS. Phan Văn M", "BS. Chu Thị N", "BS. Võ Văn O"],
    ophthalmology: ["BS. Tô Thị P", "BS. Lâm Văn Q", "BS. Hồ Thị R"],
  };

  const timeSlots = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
  ];

  const addMessage = (
    content: string,
    type: "user" | "bot",
    options?: string[],
    appointmentData?: any
  ) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      options,
      appointmentData,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const simulateTyping = async (duration = 1000) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, duration));
    setIsTyping(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    addMessage(inputValue, "user");
    const userInput = inputValue.toLowerCase();
    setInputValue("");

    await simulateTyping();

    // Process user input based on current flow
    if (currentFlow === "appointment") {
      handleAppointmentFlow(userInput);
    } else {
      handleGeneralQuery(userInput);
    }
  };

  const handleOptionClick = async (option: string) => {
    addMessage(option, "user");
    await simulateTyping();

    if (option.includes("Đặt lịch khám")) {
      setCurrentFlow("appointment");
      setAppointmentStep(1);
      addMessage(
        "📋 Tuyệt vời! Hãy chọn chuyên khoa bạn muốn khám:",
        "bot",
        specialties.map((s) => `${s.icon} ${s.name}`)
      );
    } else if (option.includes("Thông tin các khoa")) {
      addMessage(
        "🏥 **Các chuyên khoa tại MediCare:**\n\n" +
          specialties.map((s) => `${s.icon} **${s.name}**`).join("\n") +
          "\n\n💡 Chúng tôi có đội ngũ bác sĩ chuyên nghiệp với trang thiết bị hiện đại.",
        "bot",
        ["📅 Đặt lịch khám ngay", "💰 Xem bảng giá", "🔙 Quay lại menu chính"]
      );
    } else if (option.includes("Bảng giá")) {
      addMessage(
        "💰 **Bảng giá dịch vụ MediCare:**\n\n" +
          "🔸 Khám tổng quát: 200.000đ\n" +
          "🔸 Khám chuyên khoa: 300.000đ\n" +
          "🔸 Siêu âm: 250.000đ\n" +
          "🔸 Xét nghiệm cơ bản: 150.000đ\n" +
          "🔸 X-quang: 180.000đ\n\n" +
          "💡 *Giá có thể thay đổi theo từng trường hợp cụ thể*",
        "bot",
        ["📅 Đặt lịch khám", "🏥 Xem thông tin khoa", "🔙 Quay lại menu chính"]
      );
    } else if (option.includes("Liên hệ hỗ trợ")) {
      addMessage(
        "📞 **Thông tin liên hệ:**\n\n" +
          "☎️ Hotline: 1900-1234\n" +
          "📧 Email: support@medicare.vn\n" +
          "📍 Địa chỉ: 123 Đường ABC, Quận 1, TP.HCM\n" +
          "🌐 Website: medicare.vn\n\n" +
          "⏰ Hỗ trợ 24/7",
        "bot",
        ["📅 Đặt lịch khám", "🔙 Quay lại menu chính"]
      );
    } else if (option.includes("Giờ làm việc")) {
      addMessage(
        "🕐 **Giờ làm việc:**\n\n" +
          "🌅 **Sáng:** 7:00 - 11:30\n" +
          "🌇 **Chiều:** 13:30 - 17:00\n" +
          "🌙 **Tối:** 18:00 - 21:00\n\n" +
          "📅 **Thứ 2 - Chủ nhật**\n" +
          "🚨 **Cấp cứu 24/7**",
        "bot",
        ["📅 Đặt lịch khám", "📞 Liên hệ cấp cứu", "🔙 Quay lại menu chính"]
      );
    } else if (option.includes("Quay lại menu chính")) {
      resetToMainMenu();
    } else if (currentFlow === "appointment") {
      handleAppointmentOption(option);
    }
  };

  const handleAppointmentOption = async (option: string) => {
    if (appointmentStep === 1) {
      // Chọn chuyên khoa
      const selectedSpecialty = specialties.find((s) =>
        option.includes(s.name)
      );
      if (selectedSpecialty) {
        setAppointmentData((prev) => ({
          ...prev,
          specialty: selectedSpecialty.name,
        }));
        setAppointmentStep(2);
        addMessage(
          `👨‍⚕️ Bạn đã chọn chuyên khoa **${selectedSpecialty.name}**. Vui lòng chọn bác sĩ:`,
          "bot",
          doctors[selectedSpecialty.id as keyof typeof doctors]
        );
      }
    } else if (appointmentStep === 2) {
      // Chọn bác sĩ
      setAppointmentData((prev) => ({ ...prev, doctor: option }));
      setAppointmentStep(3);
      addMessage(
        `📅 Bạn đã chọn **${option}**. Vui lòng chọn ngày khám (dd/mm/yyyy):`,
        "bot"
      );
    } else if (appointmentStep === 4) {
      // Chọn giờ khám
      setAppointmentData((prev) => ({ ...prev, time: option }));
      setAppointmentStep(5);
      addMessage(
        `⏰ Bạn đã chọn **${option}**. Vui lòng nhập họ tên của bạn:`,
        "bot"
      );
    }
  };

  const handleAppointmentFlow = (userInput: string) => {
    if (appointmentStep === 3) {
      // Nhập ngày
      const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      if (dateRegex.test(userInput)) {
        setAppointmentData((prev) => ({ ...prev, date: userInput }));
        setAppointmentStep(4);
        addMessage(
          `📅 Ngày khám: **${userInput}**. Vui lòng chọn giờ khám:`,
          "bot",
          timeSlots
        );
      } else {
        addMessage(
          "❌ Định dạng ngày không đúng. Vui lòng nhập theo định dạng dd/mm/yyyy (ví dụ: 15/12/2024):",
          "bot"
        );
      }
    } else if (appointmentStep === 5) {
      // Nhập tên
      setAppointmentData((prev) => ({ ...prev, patientName: userInput }));
      setAppointmentStep(6);
      addMessage(
        `👤 Họ tên: **${userInput}**. Vui lòng nhập số điện thoại:`,
        "bot"
      );
    } else if (appointmentStep === 6) {
      // Nhập số điện thoại
      const phoneRegex = /^[0-9]{10,11}$/;
      if (phoneRegex.test(userInput.replace(/\s/g, ""))) {
        const finalAppointmentData = { ...appointmentData, phone: userInput };
        setAppointmentData(finalAppointmentData);

        addMessage(
          `📋 **Thông tin đặt lịch:**\n\n` +
            `👤 Họ tên: ${finalAppointmentData.patientName}\n` +
            `📞 SĐT: ${finalAppointmentData.phone}\n` +
            `🏥 Chuyên khoa: ${finalAppointmentData.specialty}\n` +
            `👨‍⚕️ Bác sĩ: ${finalAppointmentData.doctor}\n` +
            `📅 Ngày: ${finalAppointmentData.date}\n` +
            `⏰ Giờ: ${finalAppointmentData.time}\n\n` +
            `✅ Đặt lịch thành công! Bạn sẽ được chuyển đến trang thanh toán.`,
          "bot",
          ["💳 Thanh toán ngay", "📝 Đặt lịch khác", "🔙 Quay lại menu chính"],
          finalAppointmentData
        );

        // Call the callback after a short delay
        setTimeout(() => {
          onBookAppointment?.(finalAppointmentData);
        }, 2000);

        resetAppointmentFlow();
      } else {
        addMessage(
          "❌ Số điện thoại không hợp lệ. Vui lòng nhập lại (10-11 số):",
          "bot"
        );
      }
    }
  };

  const handleGeneralQuery = (userInput: string) => {
    if (userInput.includes("đặt lịch") || userInput.includes("khám bệnh")) {
      setCurrentFlow("appointment");
      setAppointmentStep(1);
      addMessage(
        "📋 Tuyệt vời! Hãy chọn chuyên khoa bạn muốn khám:",
        "bot",
        specialties.map((s) => `${s.icon} ${s.name}`)
      );
    } else if (userInput.includes("giá") || userInput.includes("phí")) {
      addMessage(
        "💰 **Bảng giá dịch vụ MediCare:**\n\n" +
          "🔸 Khám tổng quát: 200.000đ\n" +
          "🔸 Khám chuyên khoa: 300.000đ\n" +
          "🔸 Siêu âm: 250.000đ\n" +
          "🔸 Xét nghiệm cơ bản: 150.000đ\n" +
          "🔸 X-quang: 180.000đ",
        "bot",
        ["📅 Đặt lịch khám", "🔙 Quay lại menu chính"]
      );
    } else if (userInput.includes("địa chỉ") || userInput.includes("liên hệ")) {
      addMessage(
        "📍 **Thông tin liên hệ:**\n\n" +
          "🏥 123 Đường ABC, Quận 1, TP.HCM\n" +
          "☎️ Hotline: 1900-1234\n" +
          "📧 support@medicare.vn",
        "bot",
        ["📅 Đặt lịch khám", "🔙 Quay lại menu chính"]
      );
    } else {
      addMessage(
        "🤔 Xin lỗi, tôi chưa hiểu câu hỏi của bạn. Bạn có thể chọn một trong các tùy chọn sau:",
        "bot",
        [
          "📅 Đặt lịch khám bệnh",
          "🏥 Thông tin các khoa",
          "💰 Bảng giá dịch vụ",
          "📞 Liên hệ hỗ trợ",
        ]
      );
    }
  };

  const resetToMainMenu = () => {
    setCurrentFlow("main");
    resetAppointmentFlow();
    addMessage("🏠 Quay lại menu chính. Tôi có thể giúp bạn:", "bot", [
      "📅 Đặt lịch khám bệnh",
      "🏥 Thông tin các khoa",
      "💰 Bảng giá dịch vụ",
      "📞 Liên hệ hỗ trợ",
      "🕐 Giờ làm việc",
    ]);
  };

  const resetAppointmentFlow = () => {
    setAppointmentStep(0);
    setAppointmentData({
      specialty: "",
      doctor: "",
      date: "",
      time: "",
      patientName: "",
      phone: "",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <MessageCircle className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
          </motion.div>
        </Button>

        {/* Notification Badge */}
        <motion.div
          className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-white text-xs font-bold">!</span>
        </motion.div>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 w-96 h-[600px] z-40"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Card className="h-full flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              {/* Header */}
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-4 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 bg-white/20">
                      <AvatarFallback className="bg-transparent">
                        <Bot className="h-6 w-6 text-white" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">MediBot</CardTitle>
                      <p className="text-sm opacity-90">Trợ lý ảo MediCare</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-0"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>

              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 thin-scrollbar">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-start gap-2 max-w-[85%] ${
                          message.type === "user" ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback
                            className={
                              message.type === "user"
                                ? "bg-blue-100"
                                : "bg-cyan-100"
                            }
                          >
                            {message.type === "user" ? (
                              <User className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Bot className="h-4 w-4 text-cyan-600" />
                            )}
                          </AvatarFallback>
                        </Avatar>

                        <div
                          className={`rounded-lg p-3 ${
                            message.type === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          <div className="whitespace-pre-line text-sm">
                            {message.content}
                          </div>

                          {message.options && (
                            <div className="mt-3 space-y-1">
                              {message.options.map((option, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOptionClick(option)}
                                  className="w-full justify-start text-left h-auto p-2 text-xs bg-white hover:bg-blue-50 border-blue-200"
                                >
                                  {option}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-cyan-100">
                          <Bot className="h-4 w-4 text-cyan-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </CardContent>

              {/* Input */}
              <div className="p-4 border-t bg-white rounded-b-lg">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-blue-600 hover:bg-blue-700 px-3"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
