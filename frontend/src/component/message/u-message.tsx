// MessageContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Message.css';

export interface Message {
  id: number;
  content: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export type MessageType = Message['type'];

const MessageContext = createContext<{
    addMessage: (content: string, type?: MessageType, duration?: number) => void;
    removeMessage: (id: number) => void;
}>({
    addMessage: () => {},
    removeMessage: () => {},
});

export const MessageProvider: React.FC = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const timerRef = useRef<Record<string, NodeJS.Timeout>>({});

    const addMessage = useCallback((content: string, type: MessageType = 'info', duration: number = 3000) => {
        const id = Date.now();
        setMessages(prev => [...prev, { id, content, type }]);

        timerRef.current[id] = setTimeout(() => {
            removeMessage(id);
        }, duration);
    }, []);

    const removeMessage = useCallback((id: number) => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
        clearTimeout(timerRef.current[id]);
        delete timerRef.current[id];
    }, []);

    return (
        <MessageContext.Provider value={{ addMessage, removeMessage }}>
            {children}
            {ReactDOM.createPortal(
                <div className="message-container">
                    {messages.map(({ id, content, type }) => (
                        <MessageItem
                            key={id}
                            id={id}
                            content={content}
                            type={type}
                            onClose={() => removeMessage(id)}
                        />
                    ))}
                </div>,
                document.body
            )}
        </MessageContext.Provider>
    );
};

interface MessageItemProps {
    id: number;
    content: string;
    type: MessageType;
    onClose: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ id, content, type, onClose }) => {
    return (
        <div className={`message-item ${type}`}>
            {content}
            <button onClick={onClose}>×</button>
        </div>
    );
};

export const useMessage = (): ReturnType<typeof MessageContext> => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessage must be used within a MessageProvider');
    }
    return context;
};