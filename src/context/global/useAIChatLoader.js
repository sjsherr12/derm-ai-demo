import { useCallback } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/firebase';
import { useAuth } from './AuthContext';

/**
 * Hook for managing AI chat data fetching
 * Provides manual fetching methods for chat documents and messages per chat
 */
const useAIChatLoader = () => {
    const { user } = useAuth();

    /**
     * Fetch all user's AI chats
     * Only fetches if aiChats array is empty (conditional fetching)
     */
    const fetchAllChats = useCallback(async (
        aiChats,
        setAiChats,
        setAiChatsLoading,
        aiChatsLoadedRef,
        forceRefresh = false
    ) => {
        // Skip fetching if data already exists and not forcing refresh
        if (!forceRefresh && aiChats.length > 0) {
            return;
        }

        if (!user?.uid || user.isAnonymous) {
            setAiChats([]);
            setAiChatsLoading(false);
            return;
        }

        setAiChatsLoading(true);

        try {
            const chatsRef = collection(db, 'users', user.uid, 'chats');
            const chatsQuery = query(chatsRef, orderBy('updatedAt', 'desc'));
            const snapshot = await getDocs(chatsQuery);

            const chats = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                chats.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate()
                });
            });

            setAiChats(chats);
            aiChatsLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching AI chats:', error);
        } finally {
            setAiChatsLoading(false);
        }
    }, [user]);

    /**
     * Fetch messages for a specific chat
     * Only fetches if messages for that chat don't exist (conditional fetching)
     */
    const fetchMessagesForChat = useCallback(async (
        chatId,
        messagesByChatId,
        setMessagesByChatId,
        setMessagesLoadingByChatId,
        forceRefresh = false
    ) => {
        // Skip fetching if data already exists for this chat and not forcing refresh
        if (!forceRefresh && messagesByChatId[chatId]?.length > 0) {
            return;
        }

        if (!user?.uid || user.isAnonymous || !chatId) {
            return;
        }

        // Set loading state for this specific chat
        setMessagesLoadingByChatId(prev => ({
            ...prev,
            [chatId]: true
        }));

        try {
            const messagesRef = collection(db, 'users', user.uid, 'chats', chatId, 'messages');
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
            const snapshot = await getDocs(messagesQuery);

            const messages = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                messages.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp?.toDate()
                });
            });

            // Update messages for this specific chat
            setMessagesByChatId(prev => ({
                ...prev,
                [chatId]: messages
            }));
        } catch (error) {
            console.error(`Error fetching messages for chat ${chatId}:`, error);
        } finally {
            // Clear loading state for this chat
            setMessagesLoadingByChatId(prev => ({
                ...prev,
                [chatId]: false
            }));
        }
    }, [user]);

    /**
     * Get messages for a specific chat
     */
    const getMessagesForChat = useCallback((messagesByChatId, chatId) => {
        return messagesByChatId[chatId] || [];
    }, []);

    /**
     * Check if messages are loading for a specific chat
     */
    const isMessagesLoadingForChat = useCallback((messagesLoadingByChatId, chatId) => {
        return messagesLoadingByChatId[chatId] || false;
    }, []);

    /**
     * Refresh chats (force refetch)
     */
    const refreshChats = useCallback(async (
        aiChats,
        setAiChats,
        setAiChatsLoading,
        aiChatsLoadedRef
    ) => {
        return await fetchAllChats(aiChats, setAiChats, setAiChatsLoading, aiChatsLoadedRef, true);
    }, [fetchAllChats]);

    /**
     * Refresh messages for a specific chat (force refetch)
     */
    const refreshMessagesForChat = useCallback(async (
        chatId,
        messagesByChatId,
        setMessagesByChatId,
        setMessagesLoadingByChatId
    ) => {
        return await fetchMessagesForChat(chatId, messagesByChatId, setMessagesByChatId, setMessagesLoadingByChatId, true);
    }, [fetchMessagesForChat]);

    return {
        fetchAllChats,
        fetchMessagesForChat,
        getMessagesForChat,
        isMessagesLoadingForChat,
        refreshChats,
        refreshMessagesForChat
    };
};

export default useAIChatLoader;