
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Loader2, Send, MessageSquare, Plus, Trash2, Edit3 } from 'lucide-react';
import { useIAChat } from '@/hooks/useIAChat';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    conversations,
    currentConversation,
    messages,
    loading,
    sendingMessage,
    sendMessage,
    createNewConversation,
    selectConversation,
    deleteConversation
  } = useIAChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return;
    
    console.log('Enviando mensagem:', messageInput);
    const message = messageInput;
    setMessageInput('');
    
    try {
      await sendMessage(message);
      console.log('Mensagem enviada com sucesso');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r border-border bg-muted/30 flex flex-col">
        {/* Conversations List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-muted-foreground p-4 text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Ainda não há conversas</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors hover:bg-accent/50",
                    currentConversation === conversation.id && "bg-accent"
                  )}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-foreground">
                      {conversation.title || "Nova conversa"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conversation.updated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit'
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conversation.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Nova conversa button at bottom */}
        <div className="p-4">
          <Button 
            onClick={createNewConversation}
            className="w-full"
            style={{
              background: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 100%)',
              color: '#fff',
              borderRadius: '999px',
              padding: '12px 24px',
              fontWeight: 'bold'
            }}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Nova conversa
          </Button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length > 0 ? (
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {messages
                  .filter(message => message.content.trim() !== '') // Filtra mensagens vazias
                  .map((message, index) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4 group",
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted border border-border'
                      )}
                    >
                      {message.role === 'user' ? (
                        <span className="text-sm font-semibold">V</span>
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex-1 max-w-3xl",
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}>
                      <div
                        className={cn(
                          "inline-block rounded-2xl px-4 py-3 text-sm",
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted border border-border'
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {sendingMessage && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted border border-border flex items-center justify-center">
                      <MessageSquare className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block bg-muted border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-foreground">Já estou verificando os dados do seu gabinete...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md mx-auto px-4">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Como posso ajudar você hoje?</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Sou seu assistente IA especializado em gabinetes políticos. 
                  Posso ajudar com demandas, indicações, cadastro de eleitores, agenda e muito mais.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Message Input - Always visible, with floating shadow */}
        <div className="bg-background p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Envie uma mensagem..."
                disabled={sendingMessage}
                className="pr-12 min-h-[48px] resize-none border-0 rounded-full bg-muted/50 focus:bg-background focus:shadow-lg focus:shadow-black/10 focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 hover:shadow-md hover:shadow-black/5"
                style={{ outline: 'none' }}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sendingMessage}
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #FF6B35 0%, #E91E63 100%)',
                  color: '#fff'
                }}
              >
                {sendingMessage ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              O Assistente IA pode cometer erros. Verifique informações importantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
