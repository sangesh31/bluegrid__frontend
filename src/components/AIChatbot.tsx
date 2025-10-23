import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your BlueGrid assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Suggested questions for users
  const suggestedQuestions = [
    'How to submit report?',
    'What are report statuses?',
    'How do notifications work?',
    'What can residents do?',
    'How does water schedule work?',
  ];

  // Knowledge base for the chatbot
  const knowledgeBase = {
    // General questions
    'what is bluegrid': 'BlueGrid is a comprehensive water management system that helps manage pipe damage reports, water supply schedules, and maintenance tasks efficiently.',
    'how does it work': 'BlueGrid connects residents, maintenance technicians, panchayat officers, and water flow controllers to streamline water infrastructure management.',
    
    // Report related
    'how to submit report': 'To submit a report:\n\n1) Go to your Resident Dashboard\n2) Click "Submit New Report"\n3) Fill in details (location, issue description)\n4) Optionally add a photo\n5) Click Submit\n\nYou\'ll receive email and WhatsApp notifications.',
    'report status': 'Report statuses are: Pending (submitted), Assigned (technician assigned), In Progress (work started), Awaiting Approval (work completed), Approved (verified), or Rejected (needs more work).',
    'track report': 'You can track your report status in your dashboard. You\'ll also receive email and WhatsApp notifications for every status update.',
    
    // Roles
    'resident role': 'Residents can submit pipe damage reports, track their status, view water supply schedules, and receive notifications about water availability.',
    'technician role': 'Maintenance Technicians receive assigned reports, accept assignments, update work progress, mark tasks complete, and upload completion photos.',
    'officer role': 'Panchayat Officers review submitted reports, assign technicians, approve or reject completed work, and manage staff members.',
    'controller role': 'Water Flow Controllers create water supply schedules, open/close water supply, and notify residents about water availability.',
    
    // Features
    'email notification': 'Yes! BlueGrid sends automatic email notifications for report submissions, assignments, status updates, approvals, and water schedule changes.',
    'whatsapp notification': 'Yes! You\'ll receive WhatsApp messages for all important updates including report status changes and water supply schedules.',
    'gps location': 'Yes, you can use GPS to pinpoint the exact location of the pipe damage. Click "Use GPS Location" when submitting a report.',
    'photo upload': 'Yes, you can upload photos of the damage when submitting reports and when marking work as complete.',
    
    // Water schedules
    'water schedule': 'Water Flow Controllers create schedules specifying when water supply will be available in different areas. Residents receive notifications via email and WhatsApp.',
    'water timing': 'Water supply timings are set by Water Flow Controllers. Check your dashboard or notifications for the schedule in your area.',
    
    // Technical
    'forgot password': 'Currently, please contact your administrator to reset your password. We\'re working on a self-service password reset feature.',
    'contact support': 'For support, please contact your local Panchayat office or email support at sabareeshwarans3@gmail.com',
    'browser support': 'BlueGrid works best on modern browsers like Chrome, Firefox, Safari, and Edge. Make sure your browser is up to date.',
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return 'Hello! How can I assist you with BlueGrid today?';
    }
    
    // Check for thanks
    if (lowerMessage.match(/(thank|thanks|appreciate)/)) {
      return 'You\'re welcome! Feel free to ask if you have any other questions.';
    }
    
    // Search knowledge base
    for (const [key, value] of Object.entries(knowledgeBase)) {
      if (lowerMessage.includes(key)) {
        return value;
      }
    }
    
    // Check for specific keywords
    if (lowerMessage.includes('report') && lowerMessage.includes('submit')) {
      return knowledgeBase['how to submit report'];
    }
    if (lowerMessage.includes('status')) {
      return knowledgeBase['report status'];
    }
    if (lowerMessage.includes('notification') || lowerMessage.includes('email')) {
      return knowledgeBase['email notification'];
    }
    if (lowerMessage.includes('whatsapp')) {
      return knowledgeBase['whatsapp notification'];
    }
    if (lowerMessage.includes('water') && (lowerMessage.includes('schedule') || lowerMessage.includes('timing'))) {
      return knowledgeBase['water schedule'];
    }
    if (lowerMessage.includes('role') || lowerMessage.includes('what can i do')) {
      return 'BlueGrid has 4 roles: Residents (submit reports), Maintenance Technicians (fix issues), Panchayat Officers (manage & approve), and Water Flow Controllers (manage water supply). Which role would you like to know more about?';
    }
    
    // Default response
    return 'I\'m here to help! You can ask me about:\n• How to submit reports\n• Report statuses\n• User roles and features\n• Email & WhatsApp notifications\n• Water supply schedules\n• GPS and photo features\n\nWhat would you like to know?';
  };

  const handleSendMessage = async (question?: string) => {
    const messageText = question || inputMessage;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setShowSuggestions(false); // Hide suggestions after first message

    // Simulate AI thinking time
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(messageText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Text-to-Speech functions
  const speakMessage = (text: string, messageId: string) => {
    // Stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice settings
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.pitch = 1.0; // Normal pitch
    utterance.volume = 1.0; // Full volume
    
    // Try to use a female voice for more pleasant experience
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Google US English') ||
      voice.name.includes('Microsoft Zira')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      setSpeakingMessageId(messageId);
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
    };

    speechSynthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  };

  // Load voices when component mounts
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Stop audio when chat is closed
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl hover:scale-110 transition-all duration-300 z-50 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            ?
          </span>
          <span className="absolute right-16 top-1/2 -translate-y-1/2 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Need help?
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">BlueGrid Assistant</h3>
                <p className="text-xs text-blue-100">Always here to help</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 space-y-4 bg-gray-50" ref={scrollAreaRef}>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                      : 'bg-gradient-to-br from-gray-600 to-gray-700'
                  }`}
                >
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-blue-100' : 'text-gray-400'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {/* Audio button for bot messages */}
                  {message.sender === 'bot' && (
                    <button
                      onClick={() => {
                        if (speakingMessageId === message.id) {
                          stopSpeaking();
                        } else {
                          speakMessage(message.text, message.id);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
                      title={speakingMessageId === message.id ? "Stop audio" : "Listen to message"}
                    >
                      {speakingMessageId === message.id ? (
                        <>
                          <VolumeX className="w-3 h-3" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3 h-3" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {/* Suggested Questions */}
            {showSuggestions && messages.length === 1 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs text-gray-500 font-semibold px-2">Quick questions you can ask:</p>
                <div className="flex flex-col gap-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      className="text-left px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 rounded-xl text-sm text-gray-700 hover:text-blue-700 transition-all hover:shadow-md"
                    >
                      💬 {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200">
            <div className="flex gap-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl px-4"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Ask me anything about BlueGrid!
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AIChatbot;
