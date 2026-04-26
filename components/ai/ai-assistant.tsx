'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Send, X, User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  text: string
  sender: 'ai' | 'user'
  timestamp: Date
}

interface ApiMessage {
  role: 'user' | 'assistant'
  content: string
}

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
}

export function AIAssistant({ isOpen, onClose }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'I am the AI assistant of Adflow for your guide. How can I help you today?',
      sender: 'ai',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userText = input.trim()
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const apiMessages: ApiMessage[] = messages
        .filter(m => m.id !== '1') // Don't send initial welcome
        .map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text
        }))
      
      apiMessages.push({ role: 'user', content: userText })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      })

      if (!response.ok) throw new Error('Failed to fetch response')
      
      const data = await response.json()
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: data.content,
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error('Chat error:', error)
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again later.",
        sender: 'ai',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-24 right-6 z-50 w-[380px] overflow-hidden rounded-3xl border border-white/10 bg-[#0f172a]/95 text-white shadow-2xl backdrop-blur-xl md:right-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-primary/10 px-6 py-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-primary opacity-20 blur-sm animate-pulse" />
                <div className="relative grid h-8 w-8 place-items-center rounded-full bg-primary shadow-lg shadow-primary/20">
                  <Bot className="h-4.5 w-4.5 text-primary-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">Adflow AI</h3>
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition-all hover:bg-white/5 hover:text-on-surface"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="h-[400px] space-y-4 overflow-y-auto px-6 py-6 custom-scrollbar"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex flex-col gap-1.5",
                  msg.sender === 'user' ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "flex max-w-[85%] items-start gap-2.5",
                  msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                )}>
                  <div className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/5",
                    msg.sender === 'ai' ? "bg-primary/10 text-primary" : "bg-white/5 text-muted-foreground"
                  )}>
                    {msg.sender === 'ai' ? <Sparkles className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                    msg.sender === 'ai' 
                      ? "bg-white/5 text-on-surface ring-1 ring-white/5" 
                      : "bg-primary text-primary-foreground shadow-lg shadow-primary/10"
                  )}>
                    {msg.text}
                  </div>
                </div>
                <span className="px-10 text-[10px] text-muted-foreground/50">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex flex-col gap-1.5 items-start">
                <div className="flex max-w-[85%] items-start gap-2.5 flex-row">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/5 bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm bg-white/5 text-on-surface ring-1 ring-white/5">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5 bg-black/20">
            <div className="relative flex items-center gap-2 group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything about ads, posting, or campaign..."
                className="flex-1 rounded-2xl border border-white/5 bg-white/5 px-5 py-3.5 text-sm text-on-surface placeholder:text-muted-foreground/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white/10"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="h-11 w-11 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-95 shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function AIToggle({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-6 py-3.5 font-bold transition-all duration-500 shadow-2xl group",
        isOpen 
          ? "bg-white/10 text-white backdrop-blur-xl ring-1 ring-white/10" 
          : "bg-primary text-primary-foreground shadow-primary/25 hover:scale-105"
      )}
    >
      <div className="relative h-6 w-6">
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isOpen ? "opacity-0" : "opacity-100"
        )}>
          <Bot className="h-6 w-6" />
        </div>
        <div className={cn(
          "absolute inset-0 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0"
        )}>
          <X className="h-5 w-5 m-0.5" />
        </div>
      </div>
      <span className="text-sm tracking-wide">
        {isOpen ? "Close AI" : "Open AI Assistant"}
      </span>
      {!isOpen && (
        <div className="absolute -inset-1 rounded-full bg-primary opacity-0 blur-md transition group-hover:opacity-40 animate-pulse" />
      )}
    </button>
  )
}
