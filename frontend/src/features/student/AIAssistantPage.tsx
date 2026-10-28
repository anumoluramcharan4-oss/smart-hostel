import React, { useState, useRef, useEffect } from 'react'
import { Bot, Send, Sparkles, BookOpen, Trash2, ShieldCheck, User } from 'lucide-react'
import { api } from '@/lib/api'
import type { ChatMessage } from '@/lib/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils/formatters'

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      sender: 'assistant',
      text: "Hello Aarav! I'm your Smart Hostel AI Assistant. I can answer questions regarding hostel timings, leave application rules, complaint SLA policies, mess schedules, and prohibited appliances directly from your official 2026 handbook.",
      timestamp: new Date().toISOString(),
      citation: 'Hostel Handbook 2026 Edition',
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input
    if (!textToSend.trim()) return

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!queryText) setInput('')
    setIsTyping(true)

    try {
      const response = await api.queryAssistant(textToSend)
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: response.answer,
        citation: response.citation,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: "I encountered an error retrieving this information. Please contact the Warden's desk directly.",
        isError: true,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsTyping(false)
    }
  }

  const suggestedQuestions = [
    'What are the main hostel gate timings and curfew rules?',
    'How do I apply for a weekend leave or outpass?',
    'What is the resolution SLA for electrical and plumbing complaints?',
    'What appliances and electrical items are strictly prohibited?',
    'What are the mess timings for breakfast and dinner?',
  ]

  const clearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'assistant',
        text: "Chat cleared. What can I help you find in the hostel policies today?",
        timestamp: new Date().toISOString(),
      },
    ])
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto h-[calc(100vh-8.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>AI Hostel Assistant</span>
              <Badge variant="pending" size="sm">Gemini Powered</Badge>
            </h1>
            <p className="text-xs text-slate-500">
              Grounded in official hostel regulations and safety codes
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={clearChat}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
        >
          Clear
        </Button>
      </div>

      {/* Suggested Questions Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Ask:</span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-full border border-slate-200 bg-white hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Main Chat Conversation Card */}
      <Card className="flex-1 flex flex-col overflow-hidden p-0 border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user'
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-lg rounded-2xl p-4 text-xs space-y-2 leading-relaxed ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                  }`}
                >
                  <p>{msg.text}</p>

                  {msg.citation && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      <BookOpen className="w-3 h-3 text-indigo-500 shrink-0" />
                      <span>Source: {msg.citation}</span>
                    </div>
                  )}

                  <span
                    className={`block text-[10px] opacity-70 ${
                      isUser ? 'text-indigo-100 text-right' : 'text-slate-400'
                    }`}
                  >
                    {formatDateTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            )
          })}

          {/* Typing Animation Indicator */}
          {isTyping && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-slate-100 p-3.5 dark:bg-slate-800/80 text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px]">Searching hostel handbook...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask about gate timings, leave approval rules, prohibited appliances..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100"
            />
            <Button
              type="submit"
              size="md"
              disabled={!input.trim() || isTyping}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Ask AI
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
