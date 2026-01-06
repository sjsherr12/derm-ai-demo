import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Platform, Animated, Keyboard, Image, TouchableWithoutFeedback, Pressable, Alert, TouchableOpacity, Easing, Modal } from "react-native"
import DefaultStyles from "../../../../config/styles"
import SkinHelpChatInterfaceHeader from "./header"
import colors from "../../../../config/colors"
import DefaultTextInput from "../../../../components/Text/DefaultTextInput"
import { useState, useEffect, useRef, useCallback } from "react"
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context"
import { useSafeAreaStyles } from "../../../../hooks/useSafeAreaStyles"
import {Ionicons} from '@expo/vector-icons'
import DefaultText from "../../../../components/Text/DefaultText"
import Logo from '../../../../assets/logos/icon.png'
import UserProfileImage from "../../../../components/Common/UserProfileImage"
import IconButton from "../../../../components/Buttons/IconButton"
import { useAuth } from "../../../../context/global/AuthContext"
import { useChat } from "../../../../hooks/useChat"
import { useData } from "../../../../context/global/DataContext"
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../../../../services/firebase/firebase'
import ProductCardItem from "../../../../components/Products/ProductCardItem"
import DefaultBottomSheet from "../../../../components/Containers/DefaultBottomSheet"
import DefaultButton from "../../../../components/Buttons/DefaultButton"
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation"
import { BlurView } from 'expo-blur'

// Helper function to parse markdown-style bold text
const parseMarkdownText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2);
            return (
                <DefaultText key={index} style={{ fontWeight: 'bold' }}>
                    {boldText}
                </DefaultText>
            );
        }
        return part;
    });
};

const mostAskedQuestions = [
    "Should I wear sunscreen indoors?",
    "Best routine for sensitive skin?",
    "How to layer skincare products?",
    "Ways to keep skin hydrated?",
    "How to treat dry skin?",
    "How to manage oily skin?",
    "Care tips for combination skin?",
    "Simple routine for normal skin?",
    "How to fade dark spots?",
    "Quick fix for breakouts?",
    "Best routine for hormonal acne?",
    "How to soothe irritation fast?",
    "How often should I exfoliate?",
    "Dry vs dehydrated skin difference?",
    "Should I change routine seasonally?",
    "How to smooth uneven texture?",
    "Best care for aging skin?",
    "How to calm redness?",
    "Can AI improve my skincare?",
    "Can I mix retinol and vitamin C?"
]

const SkinHelpChatInterface = () => {
    const {user} = useAuth();
    const { aiChats, products } = useData();
    const safeAreaStyles = useSafeAreaStyles();
    const [prompt, setPrompt] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [localMessages, setLocalMessages] = useState([]);
    const [typewriterText, setTypewriterText] = useState('');
    const [currentTypewriterMessage, setCurrentTypewriterMessage] = useState(null);
    const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
    const [userScrolledManually, setUserScrolledManually] = useState(false);
    const [displayedRecommendations, setDisplayedRecommendations] = useState([])
    const [showMostAskedQuestions, setShowMostAskedQuestions] = useState(false);
    const {scale, handlePressIn, handlePressOut} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:100,
    })

    // Memoized callback to close bottom sheet
    const handleCloseRecommendations = useCallback(() => {
        setDisplayedRecommendations([]);
    }, []);

    const handleCloseMostAskedQuestions = useCallback(() => {
        setShowMostAskedQuestions(false);
    }, [])

    const handleQuestionSelect = useCallback((question) => {
        setPrompt(question);
        handleCloseMostAskedQuestions();
    }, [handleCloseMostAskedQuestions]);

    const scrollViewRef = useRef(null);
    const typewriterTimeoutRef = useRef(null);
    const textInputRef = useRef(null);
    const inputContainerTranslateY = useRef(new Animated.Value(0)).current;
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);

    // Image attachment states
    const [attachedImage, setAttachedImage] = useState(null);
    const [canAttachImage, setCanAttachImage] = useState(true);

    // Use the chat hook
    const { messages, loading, error, sendMessage, isAITyping, clearError } = useChat();

    const canSendPrompt = prompt.trim().length > 0 && !isSubmitting && !loading;

    // Check if user has already sent an image today
    const checkImageLimitForToday = useCallback(async () => {
        if (!user) return true;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        try {
            // Check current chat messages first (most efficient)
            if (messages && messages.length > 0) {
                const todayMessages = messages.filter(msg =>
                    !msg.isFromAI &&
                    msg.hasImage &&
                    msg.timestamp &&
                    msg.timestamp >= today
                );
                if (todayMessages.length > 0) {
                    return false; // Found an image sent today in current chat
                }
            }

            // Then check all chats if needed (for comprehensive check)
            if (aiChats && aiChats.length > 0) {
                for (const chat of aiChats) {
                    // Check messages in chats that could have today's messages
                    const messagesQuery = query(
                        collection(db, 'users', user.uid, 'chats', chat.id, 'messages'),
                        where('hasImage', '==', true),
                        where('timestamp', '>=', Timestamp.fromDate(today))
                    );

                    const snapshot = await getDocs(messagesQuery);
                    if (!snapshot.empty) {
                        return false; // Found an image sent today
                    }
                }
            }
        } catch (error) {
            console.error('Error checking image limit:', error);
            return true; // Allow on error
        }

        return true;
    }, [user, aiChats, messages]);

    // Update canAttachImage when chats or messages change
    useEffect(() => {
        const updateImageLimit = async () => {
            const canAttach = await checkImageLimitForToday();
            setCanAttachImage(canAttach);
        };
        updateImageLimit();
    }, [checkImageLimitForToday]);

    // Handle image attachment
    const handleImageAttach = useCallback(async (imageUri) => {
        // Double-check the limit when actually attaching
        const canAttach = await checkImageLimitForToday();
        if (!canAttach) {
            Alert.alert('Daily Limit Reached', 'You can attach one image per day to your chats.');
            return;
        }

        setAttachedImage(imageUri);

        // Blur and refocus the text input to trigger keyboard position recalculation
        // Add delay to handle cases where image needs to download
        setTimeout(() => {
            textInputRef.current?.blur();
            setTimeout(() => {
                textInputRef.current?.focus();
            }, 150);
        }, 200);
    }, [checkImageLimitForToday]);

    // Handle image removal
    const handleImageRemove = useCallback(() => {
        setAttachedImage(null);
    }, []);

    // Typewriter effect
    const startTypewriter = useCallback((message, fullText) => {
        setCurrentTypewriterMessage(message);
        setTypewriterText('');

        let currentIndex = 0;
        const typeSpeed = 15; // milliseconds per character

        const typeNextChar = () => {
            if (currentIndex < fullText.length) {
                setTypewriterText(fullText.substring(0, currentIndex + 1));
                currentIndex++;
                typewriterTimeoutRef.current = setTimeout(typeNextChar, typeSpeed);

                // Auto-scroll while typing (only if user hasn't manually scrolled)
                if (!userScrolledManually) {
                    setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: false });
                    }, 10);
                }
            } else {
                // Mark message as processed when typewriter finishes
                setProcessedMessageIds(prev => new Set([...prev, message.id]));
                setCurrentTypewriterMessage(null);
                setTypewriterText('');
            }
        };

        typeNextChar();
    }, [userScrolledManually]);

    // Stop typewriter effect when component unmounts
    useEffect(() => {
        return () => {
            if (typewriterTimeoutRef.current) {
                clearTimeout(typewriterTimeoutRef.current);
            }
        };
    }, []);

    // Keyboard animation effect
    useEffect(() => {
        const keyboardWillShowListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
            (event) => {
                if (!isKeyboardVisible) {
                    setIsKeyboardVisible(true);
                    Animated.timing(inputContainerTranslateY, {
                        toValue: -event.endCoordinates.height + 114,
                        duration: 350,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }).start(() => {
                        // Scroll content up to prevent overlap after keyboard animation completes
                        setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 50);
                    });
                }
            }
        );

        const keyboardWillHideListener = Keyboard.addListener(
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
            (event) => {
                if (isKeyboardVisible) {
                    setIsKeyboardVisible(false);
                    Animated.timing(inputContainerTranslateY, {
                        toValue: 0,
                        duration: 350,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }).start(() => {
                        // Animate scroll back down to natural position after keyboard hides
                        setTimeout(() => {
                            scrollViewRef.current?.scrollToEnd({ animated: true });
                        }, 50);
                    });
                }
            }
        );

        return () => {
            keyboardWillShowListener?.remove();
            keyboardWillHideListener?.remove();
        };
    }, [inputContainerTranslateY, isKeyboardVisible]);

    const handlePromptChange = (text) => {
        setPrompt(text);
    };

    // Handle sending message
    const handleSendMessage = async () => {
        if (!canSendPrompt) return;

        const messageText = prompt.trim();
        const imageToSend = attachedImage;

        if (imageToSend && !messageText) {
            Alert.alert('Caption Required', 'Please add a caption to describe your skin concern when attaching an image.');
            return;
        }

        setPrompt('');
        setAttachedImage(null);
        setIsSubmitting(true);

        // Create local message for immediate display
        const localMessage = {
            id: `local-${Date.now()}`,
            content: messageText,
            isFromAI: false,
            timestamp: new Date(),
            isLocal: true,
            imageUri: imageToSend
        };

        // Add to local messages for immediate display
        setLocalMessages(prev => [...prev, localMessage]);

        // Scroll to bottom after adding local message
        setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);

        try {
            await sendMessage(messageText, imageToSend);

            // If an image was successfully sent, update the canAttachImage state
            if (imageToSend) {
                setCanAttachImage(false);
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            Alert.alert('Error', err.message || 'Failed to send message');
            // Remove local message on error and restore prompt/image
            setLocalMessages(prev => prev.filter(msg => msg.id !== localMessage.id));
            setPrompt(messageText);
            setAttachedImage(imageToSend);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show error alert when error occurs
    useEffect(() => {
        if (error) {
            Alert.alert('Chat Error', error, [
                { text: 'OK', onPress: clearError }
            ]);
        }
    }, [error, clearError]);

    // Auto-scroll when new messages arrive and trigger typewriter for AI messages
    useEffect(() => {
        if (messages.length > 0) {
            const latestMessage = messages[messages.length - 1];

            // Only start typewriter for new AI messages that haven't been processed
            if (latestMessage.isFromAI &&
                !processedMessageIds.has(latestMessage.id) &&
                !currentTypewriterMessage) {

                startTypewriter(latestMessage, latestMessage.content);
            } else if (!latestMessage.isFromAI) {
                // For user messages, scroll normally and reset manual scroll flag
                setUserScrolledManually(false);
                setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                }, 100);
            }
        }
    }, [messages, startTypewriter, currentTypewriterMessage, processedMessageIds]);

    // Clean up local messages when they appear in real messages
    useEffect(() => {
        if (messages.length > 0 && localMessages.length > 0) {
            const latestMessage = messages[messages.length - 1];
            // If the latest real message is from user and matches any local message, remove local messages
            if (!latestMessage.isFromAI) {
                const matchingLocal = localMessages.find(local =>
                    !local.isFromAI && local.content === latestMessage.content
                );
                if (matchingLocal) {
                    setLocalMessages([]);
                }
            }
        }
    }, [messages, localMessages]);

    // Combine messages for display (real messages + local messages)
    const displayMessages = [...messages, ...localMessages.filter(local => {
        // Only show local messages that aren't already in real messages
        return !messages.some(real =>
            !real.isFromAI && real.content === local.content
        );
    })];

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaBottomWithTabBar]}
        >
            <SafeAreaView
                edges={['top']}
                style={DefaultStyles.safeArea}
            >
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior="padding"
                    enabled={false}
                >
                    <SkinHelpChatInterfaceHeader
                        onImageAttach={handleImageAttach}
                        canAttachImage={canAttachImage}
                    />

                    <ScrollView
                        ref={scrollViewRef}
                        contentContainerStyle={[
                            styles.chatContainer,
                            { paddingBottom: isKeyboardVisible ? 240 : 20 }
                        ]}
                        showsVerticalScrollIndicator={true}
                        keyboardShouldPersistTaps="handled"
                        style={{ flex: 1 }}
                        onScrollBeginDrag={() => {
                            // User started manual scrolling
                            setUserScrolledManually(true);
                        }}
                        onMomentumScrollEnd={(event) => {
                            // Check if user scrolled to bottom manually
                            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
                            const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
                            if (isAtBottom) {
                                setUserScrolledManually(false);
                            }
                        }}
                    >
                        {/* Static welcome message */}
                        <View style={styles.botMessageContainer}>
                            <Image
                                source={Logo}
                                style={{
                                    width:40,
                                    height:40,
                                    borderRadius:32,
                                    padding:4,
                                    backgroundColor:colors.background.primary,
                                }}
                            />

                            <View style={styles.botTextContainer}>
                                <DefaultText style={styles.text}>
                                    Hello! I'm your virtual skin advisor. Got questions about skincare? I'm here anytime with quick guidance and safe product suggestions. Just a heads-up: I'm not a licensed medical professional. For personalized treatment, it's always best to consult a dermatologist.
                                </DefaultText>
                            </View>
                        </View>

                        {/* Chat messages */}
                        {displayMessages.map((message, index) => (
                            message.isFromAI ? (
                                <View key={message.id || index} style={styles.botMessageContainer}>
                                    <Image
                                        source={Logo}
                                        style={{
                                            width:40,
                                            height:40,
                                            borderRadius:32,
                                            padding:3,
                                            backgroundColor:colors.background.primary,
                                        }}
                                    />

                                    <View style={styles.botTextContainer}>
                                        <DefaultText style={styles.text}>
                                            {currentTypewriterMessage?.id === message.id
                                                ? parseMarkdownText(typewriterText)
                                                : parseMarkdownText(message.content)
                                            }
                                        </DefaultText>

                                        {/* Product recommendations - only show after typewriter finishes */}
                                        {message.hasProductRecommendations &&
                                         message.recommendedProducts &&
                                         message.recommendedProducts.length > 0 &&
                                         currentTypewriterMessage?.id !== message.id && (
                                            <DefaultButton
                                                isActive
                                                title='View Products'
                                                onPress={() => setDisplayedRecommendations(message?.recommendedProducts)}
                                                style={{
                                                    height:50,
                                                    marginTop:DefaultStyles.container.paddingTop,
                                                }}
                                                extraStyles={{
                                                    button: {
                                                        height:50,
                                                    }
                                                }}
                                            />
                                        )}
                                    </View>
                                </View>
                            ) : (
                                <View key={message.id || index} style={styles.userMessageContainer}>
                                    <View style={[
                                        styles.userTextContainer,
                                        message.isLocal && styles.localMessageContainer
                                    ]}>
                                        <DefaultText style={[
                                            styles.text,
                                            message.isLocal && styles.localMessageText,
                                            {
                                                color:colors.text.primary
                                            }
                                        ]}>
                                            {message.content}
                                        </DefaultText>
                                        {(message.imageUri || message.imageUrl) && (
                                            <Image
                                                source={{ uri: message.imageUri || message.imageUrl }}
                                                style={styles.messageImage}
                                                resizeMode="cover"
                                            />
                                        )}
                                    </View>

                                    <UserProfileImage
                                        image={user?.photoURL}
                                        width={40}
                                        height={40}
                                    />
                                </View>
                            )
                        ))}

                        {/* AI typing indicator */}
                        {isAITyping && (
                            <View style={styles.botMessageContainer}>
                                <Image
                                    source={Logo}
                                    style={{
                                        width:40,
                                        height:40,
                                        borderRadius:32,
                                        padding:2,
                                        backgroundColor:colors.background.primary,
                                    }}
                                />

                                <View style={styles.botTextContainer}>
                                    <DefaultText style={[styles.text, { fontStyle: 'italic', opacity: 0.7 }]}>
                                        Derm AI is thinking...
                                    </DefaultText>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <Animated.View style={[
                        styles.bottomContainerWrapper,
                        { transform: [{ translateY: inputContainerTranslateY }] }
                    ]}>
                        {/* Attached Image Preview */}
                        {attachedImage && (
                            <View style={styles.attachedImageContainer}>
                                <Image
                                    source={{ uri: attachedImage }}
                                    style={styles.attachedImage}
                                    resizeMode="cover"
                                />
                                <TouchableOpacity
                                    style={styles.removeImageButton}
                                    onPress={handleImageRemove}
                                >
                                    <Ionicons
                                        name="close-circle"
                                        size={24}
                                        color={colors.background.primary}
                                    />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[
                            styles.bottomContainer,
                            { borderColor: isInputFocused ? colors.background.primary : colors.accents.stroke }
                        ]}>
                            <View
                                style={styles.flexContainer}
                            >
                                <DefaultTextInput
                                    ref={textInputRef}
                                    value={prompt}
                                    onChangeText={handlePromptChange}
                                    placeholder={attachedImage ? 'Describe your skin concern' : 'Type your question here'}
                                    textAlignVertical='top'
                                    style={styles.promptInput}
                                    multiline
                                    maxLength={1000}
                                    editable={!isSubmitting && !loading}
                                    onFocus={() => {
                                        setIsInputFocused(true);
                                        // Immediate scroll to push content up
                                        scrollViewRef.current?.scrollToEnd({ animated: true });
                                        // Additional scroll after keyboard appears to ensure no overlap
                                        setTimeout(() => {
                                            scrollViewRef.current?.scrollToEnd({ animated: true });
                                        }, 400);
                                    }}
                                    onBlur={() => {
                                        setIsInputFocused(false);
                                    }}
                                />

                                <IconButton
                                    style={{
                                        width:40,
                                        height:40,
                                        backgroundColor:colors.background.primary,
                                        opacity:canSendPrompt ? 1 : .5,
                                        borderRadius:64,
                                        marginLeft:'auto'
                                    }}
                                    icon={isSubmitting ? 'hourglass' : 'arrow-up'}
                                    size={24}
                                    disabled={!canSendPrompt}
                                    color={colors.text.primary}
                                    onPress={handleSendMessage}
                                />
                            </View>

                            <View style={DefaultStyles.separator} />

                            <Pressable
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                onPress={() => setShowMostAskedQuestions(prev => !prev)}
                            >
                                <Animated.View
                                    style={{
                                        ...styles.flexContainer,
                                        paddingTop:8,
                                        paddingBottom:DefaultStyles.container.paddingTop,
                                        transform:[{scale}]
                                    }}
                                >
                                    <Ionicons
                                        name='add'
                                        size={18}
                                        color={colors.background.primary}
                                    />

                                    <DefaultText
                                        style={{
                                            ...styles.text,
                                            color:colors.background.primary,
                                        }}
                                    >
                                        See most asked questions
                                    </DefaultText>
                                </Animated.View>
                            </Pressable>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <DefaultBottomSheet
                isOpen={displayedRecommendations?.length > 0}
                onClose={handleCloseRecommendations}
            >
                {displayedRecommendations?.length > 0 && (
                    <View
                        style={{
                            ...styles.productRecommendationsContainer,
                            paddingBottom:100,
                        }}
                    >
                        <View
                            style={styles.flexContainer}
                        >
                            <DefaultText
                                style={styles.title}
                                numberOfLines={1}
                            >
                                Recommendations
                            </DefaultText>

                            <IconButton
                                style={styles.iconButton}
                                icon='close'
                                size={16}
                                color={colors.text.darker}
                                onPress={handleCloseRecommendations}
                            />
                        </View>

                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.productScrollContent}
                            style={{
                                marginHorizontal:-DefaultStyles.container.paddingHorizontal,
                            }}
                        >
                            {displayedRecommendations.map((productId) => {
                                const product = products?.[productId];
                                if (!product) return null;
                                return (
                                    <View key={productId} style={styles.productCardWrapper}>
                                        <ProductCardItem
                                            product={{ id: productId, ...product }}
                                            columns={2.25}
                                        />
                                    </View>
                                );
                            })}
                        </ScrollView>
                    </View>
                )}
            </DefaultBottomSheet>

            {/* Most Asked Questions Modal */}
            <DefaultBottomSheet
                isOpen={showMostAskedQuestions}
                onClose={handleCloseMostAskedQuestions}
            >
                <View
                    style={{
                        ...styles.productRecommendationsContainer,
                        paddingBottom:100,
                    }}
                >
                    <View
                        style={styles.flexContainer}
                    >
                        <DefaultText
                            style={styles.title}
                            numberOfLines={1}
                        >
                            Most Asked Questions
                        </DefaultText>

                        <IconButton
                            style={styles.iconButton}
                            icon='close'
                            size={16}
                            color={colors.text.darker}
                            onPress={handleCloseMostAskedQuestions}
                        />
                    </View>

                    <ScrollView
                        contentContainerStyle={styles.questionsContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        {mostAskedQuestions.map((question, index) => (
                            <DefaultButton
                                key={index}
                                title={question}
                                onPress={() => handleQuestionSelect(question)}
                                style={{
                                    height:48
                                }}
                                extraStyles={{
                                    button: {
                                        height:48
                                    },
                                    text: {
                                        fontSize:DefaultStyles.text.caption.small,
                                    }
                                }}
                            />
                        ))}
                    </ScrollView>
                </View>
            </DefaultBottomSheet>
        </View>
    )
}

export default SkinHelpChatInterface;

const styles = StyleSheet.create({
    bottomContainerWrapper: {
        gap:16,
        padding:DefaultStyles.container.paddingTop,
        width:'100%',
        backgroundColor:colors.background.screen,
        borderTopWidth:1.5,
        borderTopColor:colors.accents.stroke,
    },
    bottomContainer: {
        gap:4,
        backgroundColor:colors.background.light,
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        paddingLeft:16,
        paddingRight:8,
        paddingTop:4,
    },
    flexContainer: {
        gap:8,
        width:'100%',
        alignItems:'center',
        flexDirection:'row',
    },
    iconButton: {
        width:32,
        height:32,
        marginLeft:'auto',
        backgroundColor:colors.background.light,
    },
    title: {
        flex:1,
        alignSelf:'flex-start',
        fontSize:DefaultStyles.text.title.xsmall,
        color:colors.text.secondary,
        fontWeight:'600'
    },
    text: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
    },
    promptInput: {
        flex:1,
        fontWeight:'500',
        fontSize: DefaultStyles.text.caption.small,
        paddingVertical: DefaultStyles.container.paddingBottom,
        maxHeight:140
    },
    subtext: {
        color:colors.background.primary,
        fontSize:DefaultStyles.text.caption.small,
    },
    chatContainer: {
        padding:DefaultStyles.container.paddingTop,
        width:'100%',
        gap:12,
    },
    botMessageContainer: {
        flexDirection:'row',
        gap:12,
        alignItems:'flex-start',
        width: '100%',
    },
    botTextContainer: {
        maxWidth: '75%',
        padding:DefaultStyles.container.paddingTop,
        borderRadius:12,
        borderTopLeftRadius:0,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        backgroundColor:colors.background.light,
        alignSelf: 'flex-start',
    },
    userMessageContainer: {
        flexDirection:'row',
        gap:12,
        alignItems:'flex-start',
        width: '100%',
        justifyContent: 'flex-end',
    },
    userTextContainer: {
        maxWidth: '75%',
        padding:DefaultStyles.container.paddingTop,
        borderRadius:12,
        borderTopRightRadius:0,
        backgroundColor:colors.background.primary,
        alignSelf: 'flex-end',
    },
    text: {
        fontSize:14,
        fontWeight:'500',
        color:colors.text.secondary,
        lineHeight: 22,
    },
    productRecommendationsContainer: {
        gap:24,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    productScrollContent: {
        gap: 12,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    localMessageContainer: {
        opacity: 0.7,
        borderColor: colors.accents.stroke + '80', // More transparent border
    },
    localMessageText: {
        opacity: 0.8,
        fontStyle: 'italic',
    },
    attachedImageContainer: {
        padding: DefaultStyles.container.paddingTop,
        paddingBottom: 0,
    },
    attachedImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: colors.background.light,
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colors.background.screen,
        borderRadius: 12,
    },
    messageImage: {
        width: 150,
        height: 150,
        borderRadius: 12,
        marginTop: 8,
        backgroundColor: colors.background.light,
    },
    fullScreenBlurContainer: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    fullScreenBlurView: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    safeAreaContainer: {
        flex: 1,
        gap:16,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
        paddingTop:DefaultStyles.container.paddingTop,
        paddingBottom:0,
    },
    questionsContainer: {
        paddingBottom:48,
        gap: 12,
    },
    questionsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        marginTop: 8,
    },
    questionsTitle: {
        fontSize: DefaultStyles.text.title.small,
        fontWeight: '700',
        color: colors.text.primary,
        flex: 1,
    },
    closeButton: {
        width: 36,
        height: 36,
        marginLeft:'auto',
        backgroundColor: colors.background.light + '40',
        borderRadius: 18,
    },
})