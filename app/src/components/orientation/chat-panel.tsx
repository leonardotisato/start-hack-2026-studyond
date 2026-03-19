"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Student } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  student: Student;
  fieldIds: string[];
  searchQuery: string;
  onSelectTopic: (topicId: string) => void;
}

function ChatMarkdown({
  content,
  onSelectTopic,
}: {
  content: string;
  onSelectTopic: (topicId: string) => void;
}) {
  return (
    <div className="prose prose-sm max-w-none text-sm [&_a.topic-link]:text-primary [&_a.topic-link]:underline [&_a.topic-link]:underline-offset-2 [&_a.topic-link]:cursor-pointer">
      <ReactMarkdown
        components={{
          a: ({ href, children }) => {
            const topicMatch = href?.match(/^topic:(.+)$/);
            if (topicMatch) {
              return (
                <a
                  className="topic-link"
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectTopic(topicMatch[1]);
                  }}
                >
                  {children}
                </a>
              );
            }
            return <a href={href}>{children}</a>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export function ChatPanel({
  student,
  fieldIds,
  searchQuery,
  onSelectTopic,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/orientation-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          student,
          fieldIds,
          query: searchQuery,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");

      const data = await res.json();
      setMessages([
        ...nextMessages,
        { role: "assistant", content: data.message },
      ]);
    } catch {
      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 p-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-sm">
              Ask me about thesis topics, career paths, or fields you're
              interested in. I'll help you find your direction.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[80%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <CardContent className="p-3">
                {msg.role === "assistant" ? (
                  <ChatMarkdown
                    content={msg.content}
                    onSelectTopic={onSelectTopic}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <Card className="bg-muted">
              <CardContent className="p-3">
                <div className="flex gap-1">
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                  <span className="size-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about topics, fields, or career paths..."
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
