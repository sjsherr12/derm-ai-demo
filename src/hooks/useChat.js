import { useState, useEffect, useCallback, useRef } from 'react';
import clientChatService from '../services/clientChatService';
import { useAuth } from '../context/global/AuthContext';
import { useData } from '../context/global/DataContext';

export const useChat = (chatId = null) => {
    const { user } = useAuth();
    const { userData, products, routineProducts } = useData();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentChatId, setCurrentChatId] = useState(chatId);

    // Refs for stable references
    const messagesRef = useRef(messages);
    const unsubscribeRef = useRef(null);

    // Update messages ref when messages change
    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    // Message handler
    const handleMessages = useCallback((newMessages, error) => {
        if (error) {
            console.error('Error in message listener:', error);
            setError('Failed to load messages');
            return;
        }

        if (newMessages) {
            setMessages(newMessages);
            setError(null);
        }
    }, []);

    // Setup message listener when chat ID changes
    useEffect(() => {
        if (!user?.uid || !currentChatId) {
            setMessages([]);
            return;
        }

        // Cleanup previous listener
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        // Set up new listener
        setLoading(true);
        setError(null);

        try {
            const unsubscribe = clientChatService.listenToMessages(
                user.uid,
                currentChatId,
                handleMessages
            );

            unsubscribeRef.current = unsubscribe;
            setLoading(false);
        } catch (err) {
            console.error('Error setting up message listener:', err);
            setError('Failed to connect to chat');
            setLoading(false);
        }

        // Cleanup on unmount or dependency change
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [user?.uid, currentChatId, handleMessages]);

    // Send message function
    const sendMessage = useCallback(async (message, imageUri = null) => {
        if (!user?.uid) {
            throw new Error('User not authenticated');
        }

        if (!message.trim() && !imageUri) {
            throw new Error('Message cannot be empty');
        }

        setLoading(true);
        setError(null);

        try {
            const result = await clientChatService.sendMessage(message, imageUri, currentChatId, userData, products, routineProducts);

            // If this is a new chat, update the current chat ID
            if (!currentChatId && result.chatId) {
                setCurrentChatId(result.chatId);
            }

            setLoading(false);
            return result;

        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message || 'Failed to send message');
            setLoading(false);
            throw err;
        }
    }, [user?.uid, currentChatId, userData, products, routineProducts]);

    // Get last message
    const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

    // Get messages grouped by type (for UI purposes)
    const messageGroups = messages.reduce((groups, message) => {
        const key = message.isFromAI ? 'ai' : 'user';
        if (!groups[key]) groups[key] = [];
        groups[key].push(message);
        return groups;
    }, {});

    // Check if AI is "typing" (last message is from user and no AI response yet)
    const isAITyping = loading && lastMessage && !lastMessage.isFromAI;

    return {
        messages,
        loading,
        error,
        chatId: currentChatId,
        sendMessage,
        lastMessage,
        messageGroups,
        isAITyping,
        messageCount: messages.length,
        // Utility functions
        clearError: () => setError(null),
        setChatId: setCurrentChatId
    };
};

export const useChatList = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const unsubscribeRef = useRef(null);

    // Chat list handler
    const handleChats = useCallback((newChats, error) => {
        if (error) {
            console.error('Error in chat list listener:', error);
            setError('Failed to load chats');
            return;
        }

        if (newChats) {
            setChats(newChats);
            setError(null);
        }
    }, []);

    // Setup chat list listener
    useEffect(() => {
        if (!user?.uid) {
            setChats([]);
            return;
        }

        // Cleanup previous listener
        if (unsubscribeRef.current) {
            unsubscribeRef.current();
            unsubscribeRef.current = null;
        }

        setLoading(true);
        setError(null);

        try {
            const unsubscribe = clientChatService.listenToChats(user.uid, handleChats);
            unsubscribeRef.current = unsubscribe;
            setLoading(false);
        } catch (err) {
            console.error('Error setting up chat list listener:', err);
            setError('Failed to load chat list');
            setLoading(false);
        }

        // Cleanup on unmount or dependency change
        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
        };
    }, [user?.uid, handleChats]);

    return {
        chats,
        loading,
        error,
        clearError: () => setError(null)
    };
};