import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, ArrowLeft, Search, Image as ImageIcon, MessageCircle, Loader2 } from 'lucide-react';
import type { Conversation, Message, Profile } from '@/lib/types';
import { Avatar } from '@/components/Avatar';
import { useAuth } from '@/context/AuthContext';
import { fetchConversations, fetchMessages, sendMessage, getOrCreateConversation } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { timeAgo, classNames, scrollToBottom } from '@/lib/utils';

export function MessagesPage({ initialUserId }: { initialUserId?: string }) {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const c = await fetchConversations(user.id);
      setConversations(c);
      if (initialUserId && !active) {
        const conv = await getOrCreateConversation(initialUserId);
        if (conv) {
          const full = c.find((x) => x.id === conv.id) ?? {
            ...conv,
            members: [{ id: initialUserId, avatar_url: null, full_name: '', username: '' } as Profile],
          };
          setActive(full);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, initialUserId, active]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const openConversation = async (conv: Conversation) => {
    setActive(conv);
    setLoadingMsgs(true);
    setMessages([]);
    try {
      const m = await fetchMessages(conv.id);
      setMessages(m);
      setTimeout(() => scrollToBottom(messagesEndRef.current), 50);
    } finally {
      setLoadingMsgs(false);
    }
  };

  // Real-time subscription for messages in active conversation
  useEffect(() => {
    if (!active) return;
    const channel = supabase
      .channel(`messages:${active.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${active.id}` }, async (payload) => {
        const newMsg = payload.new as Message;
        // fetch sender info
        const { data: sender } = await supabase.from('profiles').select('*').eq('id', newMsg.sender_id).maybeSingle();
        setMessages((prev) => [...prev, { ...newMsg, sender: sender as unknown as Profile }]);
        setTimeout(() => scrollToBottom(messagesEndRef.current), 50);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [active]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const content = text.trim();
    setText('');
    try {
      const msg = await sendMessage(active.id, content);
      if (msg) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => scrollToBottom(messagesEndRef.current), 50);
        // refresh conversation list order
        loadConversations();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const otherMember = (conv: Conversation): Profile | undefined => {
    if (!user) return undefined;
    return conv.members?.find((m) => m.id !== user.id);
  };

  const activeOther = active ? otherMember(active) : undefined;
  const filteredConvs = conversations.filter((c) => {
    if (!search.trim()) return true;
    const other = otherMember(c);
    return other?.full_name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="max-w-6xl mx-auto py-4 px-3 h-[calc(100vh-3.5rem)]">
      <div className="atlas-card overflow-hidden h-full flex">
        {/* conversation list */}
        <div className={classNames('w-full md:w-80 border-r border-gray-200 flex flex-col', active && 'hidden md:flex')}>
          <div className="p-3 border-b border-gray-200">
            <h1 className="text-xl font-bold mb-2">Chats</h1>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="atlas-input pl-9" placeholder="Search chats" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {loading && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}
            {!loading && filteredConvs.length === 0 && (
              <div className="text-center py-10 px-4">
                <MessageCircle size={40} className="mx-auto text-gray-300" />
                <p className="text-gray-500 mt-2 text-sm">No conversations yet.</p>
                <p className="text-gray-400 text-xs mt-1">Start one from a friend's profile.</p>
              </div>
            )}
            {filteredConvs.map((c) => {
              const other = otherMember(c);
              return (
                <button
                  key={c.id}
                  onClick={() => openConversation(c)}
                  className={classNames(
                    'flex items-center gap-3 w-full px-3 py-2.5 hover:bg-gray-100 text-left',
                    active?.id === c.id && 'bg-[#e7f0fd]',
                  )}
                >
                  <Avatar profile={other ?? { avatar_url: null, full_name: '?' }} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{other?.full_name ?? 'Conversation'}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.last_message ? `${c.last_message.sender_id === user?.id ? 'You: ' : ''}${c.last_message.content}` : 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* chat window */}
        {active ? (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-3 p-3 border-b border-gray-200">
              <button onClick={() => setActive(null)} className="md:hidden p-1 rounded-full hover:bg-gray-100">
                <ArrowLeft size={20} />
              </button>
              <Avatar profile={activeOther ?? { avatar_url: null, full_name: '?' }} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{activeOther?.full_name ?? 'Chat'}</p>
                <p className="text-xs text-green-600">Active now</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2 bg-gray-50">
              {loadingMsgs && <div className="flex justify-center py-10"><Loader2 className="animate-spin text-gray-400" /></div>}
              {!loadingMsgs && messages.length === 0 && (
                <div className="text-center py-10 text-gray-400 text-sm">Say hello to start the conversation.</div>
              )}
              {messages.map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={classNames('flex items-end gap-2', mine ? 'justify-end' : 'justify-start')}>
                    {!mine && <Avatar profile={m.sender ?? activeOther ?? { avatar_url: null, full_name: '?' }} size="sm" />}
                    <div className={classNames('max-w-[70%] rounded-2xl px-3 py-2', mine ? 'bg-[#1877F2] text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm')}>
                      <p className="text-sm whitespace-pre-wrap break-words">{m.content}</p>
                      {m.image_url && <img src={m.image_url} alt="" className="mt-1 rounded-lg max-h-48" />}
                      <p className={classNames('text-[10px] mt-1', mine ? 'text-blue-100' : 'text-gray-400')}>{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex items-center gap-2">
              <button type="button" className="p-2 rounded-full hover:bg-gray-100 text-gray-500" title="Attach image">
                <ImageIcon size={20} />
              </button>
              <input
                className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 outline-none text-sm focus:bg-white focus:ring-1 focus:ring-[#1877F2]"
                placeholder="Type a message…"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <button type="submit" disabled={!text.trim()} className="text-[#1877F2] disabled:text-gray-300 p-2">
                <Send size={22} />
              </button>
            </form>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-gray-400 flex-col">
            <MessageCircle size={56} className="mb-3 text-gray-300" />
            <p className="text-lg font-medium">Your messages</p>
            <p className="text-sm">Select a conversation or start a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
