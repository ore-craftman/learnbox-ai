'use client';

import React from "react"

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Loader2, BarChart3, Mic, Volume2, StopCircle, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { initSpeechRecognition, synthesizeSpeech, stopSpeech, pauseSpeech, resumeSpeech, checkVoiceSupport } from '@/lib/voice-utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; title: string }>;
}

import { NIGERIAN_SUBJECTS } from '@/lib/constants';

const CLASSES = Object.keys(NIGERIAN_SUBJECTS);

export default function TutorPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState('');
  const [subject, setSubject] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI tutor. I\'m here to help you learn from your class materials. Which subject would you like to study today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading2, setIsLoading2] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Voice features
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupport, setVoiceSupport] = useState({ speechRecognition: false, textToSpeech: false });
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // Check voice support
    const support = checkVoiceSupport();
    setVoiceSupport(support);

    if (support.speechRecognition) {
      recognitionRef.current = initSpeechRecognition(
        (text) => {
          setInput(text);
          setIsListening(false);
        },
        (error) => {
          toast({
            title: 'Voice Error',
            description: error,
            variant: 'destructive',
          });
          setIsListening(false);
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    // Scroll to bottom
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim() || !subject) {
      toast({
        title: 'Error',
        description: 'Please select a subject and enter a message',
        variant: 'destructive',
      });
      return;
    }

    // Add user message
    const userMessageId = Date.now().toString();
    const newMessages = [
      ...messages,
      {
        id: userMessageId,
        type: 'user' as const,
        content: input,
      },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading2(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          classId: selectedClass,
          subject,
          sessionId: `session-${user.userId}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'assistant',
          content: data.response,
          sources: data.sourceResources,
        },
      ]);

    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get response. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading2(false);
    }
  };

  const handleStartListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
    }
  };

  // Audio state
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  // ... (speech recognition refs)

  const handleAudioControl = async (messageId: string, text: string) => {
    // Case 1: Clicked on currently playing audio
    if (currentAudioId === messageId) {
      if (isPaused) {
        resumeSpeech();
        setIsPaused(false);
        setIsSpeaking(true);
      } else {
        pauseSpeech();
        setIsPaused(true);
        // Note: isSpeaking stays true conceptually as we are in an active session,
        // but for UI toggle we might want to differentiate.
        // Let's keep isSpeaking=true to show "Pause" button state or similar.
      }
      return;
    }

    // Case 2: Clicked on a different message or starting new
    stopSpeech(); // Stop any previous
    setCurrentAudioId(messageId);
    setIsPaused(false);
    setIsSpeaking(true);

    try {
      await synthesizeSpeech(text);
      // When promise resolves (speech finishes)
      setIsSpeaking(false);
      setCurrentAudioId(null);
      setIsPaused(false);
    } catch (error) {
       console.error(error);
       setIsSpeaking(false);
       setCurrentAudioId(null);
    }
  };

  const handleStopAudio = () => {
    stopSpeech();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentAudioId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">AI Tutor</h1>
            <p className="text-sm text-muted-foreground">Learn from your class materials</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 py-8">
        {/* Subject Selection */}
        <Card className="mb-6 p-4 border-border">
          <div className="flex flex-col md:flex-row gap-4 items-end">
             <div className="flex-1 w-full">
              <label className="text-sm font-medium text-foreground mb-2 block">Select Class</label>
              <Select value={selectedClass} onValueChange={(val) => {
                  setSelectedClass(val);
                  setSubject(''); // Reset subject when class changes
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class..." />
                </SelectTrigger>
                <SelectContent>
                  {CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 w-full">
              <label className="text-sm font-medium text-foreground mb-2 block">Select Subject</label>
              <Select
                value={subject}
                onValueChange={setSubject}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedClass ? "Choose a subject..." : "Select class first..."} />
                </SelectTrigger>
                <SelectContent>
                  {(selectedClass ? NIGERIAN_SUBJECTS[selectedClass] : []).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {subject && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center">
                <BarChart3 className="h-4 w-4 inline mr-2" />
                Ready to learn {subject} for {selectedClass}
            </div>
          )}
        </Card>

        {/* Messages */}
        <ScrollArea className="flex-1 mb-6 border border-border rounded-lg bg-card p-4">
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content.split('**').map((part, i) =>
                      i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                  </div>
                  {msg.type === 'assistant' && voiceSupport.textToSpeech && (
                    <button
                      onClick={() => handleAudioControl(msg.id, msg.content)}
                      className="mt-2 text-xs hover:underline opacity-75"
                    >
                      {currentAudioId === msg.id
                        ? (isPaused ? '▶️ Resume' : '⏸️ Pause')
                        : '🔊 Listen'}
                    </button>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/20">
                      <p className="text-xs font-semibold mb-1">Sources:</p>
                      <ul className="text-xs space-y-1">
                        {msg.sources.map((src) => (
                          <li key={src.id} className="opacity-75">
                            • {src.title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading2 && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder={subject ? 'Ask a question about ' + subject + '...' : 'Select a subject first...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!subject || isLoading2 || isListening}
            className="flex-1"
          />

          {voiceSupport.speechRecognition && (
            <>
              {!isListening ? (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleStartListening}
                  disabled={!subject || isLoading2}
                  title="Click to speak your question"
                >
                  <Mic className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleStopListening}
                  className="text-red-500 bg-transparent"
                >
                  <StopCircle className="h-4 w-4" />
                </Button>
              )}
            </>
          )}

          <Button
            type="submit"
            size="icon"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!subject || isLoading2 || !input.trim()}
          >
            {isLoading2 ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Safe Learning:</strong> This AI tutor only uses materials uploaded by your teachers. It won't provide answers from the internet.
          </p>
        </div>
      </main>
    </div>
  );
}
