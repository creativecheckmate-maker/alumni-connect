'use client';

import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Send, Phone, Video, Info } from 'lucide-react';
import { useState } from 'react';
import { users } from '@/lib/placeholder-data';

export default function MessagesPage() {
  const [activeChat, setActiveChat] = useState(users[0]?.id);
  const [message, setMessage] = useState('');

  const selectedUser = users.find(u => u.id === activeChat);

  const mockMessages = [
    { id: 1, senderId: users[0]?.id, text: "Hey! How are things at Nexus?", timestamp: "10:30 AM" },
    { id: 2, senderId: 'me', text: "Doing great! Working on a new project for the network.", timestamp: "10:32 AM" },
    { id: 3, senderId: users[0]?.id, text: "That sounds awesome. We should catch up soon about the upcoming alumni meet.", timestamp: "10:35 AM" },
  ];

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Sidebar: Chat List */}
      <Card className="w-80 flex flex-col overflow-hidden border-none shadow-md">
        <div className="p-4 border-b bg-card">
          <h2 className="text-lg font-bold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search people..." className="pl-8 bg-muted/20 border-none shadow-none" />
          </div>
        </div>
        <ScrollArea className="flex-1 bg-card">
          <div className="p-2 space-y-1">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setActiveChat(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                  activeChat === user.id 
                    ? 'bg-primary/10 text-primary shadow-sm' 
                    : 'hover:bg-muted/50'
                }`}
              >
                <Avatar className="h-10 w-10 ring-2 ring-background ring-offset-2">
                  <AvatarImage src={user.avatarUrl} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">Hey! How are things...</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className="text-[9px] text-muted-foreground">10:35 AM</span>
                    {activeChat !== user.id && <span className="h-2 w-2 bg-primary rounded-full"></span>}
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Main Chat Window */}
      <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-md">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback>{selectedUser.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-bold">{selectedUser.name}</p>
                  <p className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"><Phone className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"><Info className="h-4 w-4" /></Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-6 bg-muted/5">
              <div className="space-y-6">
                <div className="flex justify-center">
                    <span className="text-[10px] bg-muted/50 px-3 py-1 rounded-full text-muted-foreground font-medium uppercase tracking-wider">Today</span>
                </div>
                {mockMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-sm ${
                        msg.senderId === 'me'
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-card text-card-foreground rounded-tl-none border'
                      }`}
                    >
                      <p className="leading-relaxed">{msg.text}</p>
                      <p className={`text-[9px] mt-2 font-medium opacity-70 ${msg.senderId === 'me' ? 'text-right' : 'text-left'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-card">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type a message..." 
                  className="bg-muted/20 border-none shadow-none focus-visible:ring-primary/20"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && setMessage('')}
                />
                <Button size="icon" className="shrink-0 rounded-full h-10 w-10 shadow-lg" onClick={() => setMessage('')}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-10 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="font-bold text-lg text-foreground">No Chat Selected</h3>
            <p className="text-sm max-w-xs">Select an alumnus from the list on the left to start a conversation.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
