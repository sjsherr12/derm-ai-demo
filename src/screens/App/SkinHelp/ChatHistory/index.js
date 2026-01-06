import { useRoute } from "@react-navigation/native"
import { ScrollView, View, StyleSheet, Image } from "react-native";
import DefaultStyles from "../../../../config/styles";
import { SafeAreaView } from "react-native-safe-area-context";
import ChatHistoryScreenHeader from "./header";
import { useData } from "../../../../context/global/DataContext";
import { useAuth } from "../../../../context/global/AuthContext";
import { useEffect, useRef, useCallback, useState } from "react";
import DefaultText from "../../../../components/Text/DefaultText";
import Logo from '../../../../assets/logos/icon.png';
import UserProfileImage from "../../../../components/Common/UserProfileImage";
import colors from "../../../../config/colors";
import DefaultButton from "../../../../components/Buttons/DefaultButton";
import DefaultBottomSheet from "../../../../components/Containers/DefaultBottomSheet";
import ProductCardItem from "../../../../components/Products/ProductCardItem";
import IconButton from "../../../../components/Buttons/IconButton";

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

const ChatHistoryScreen = () => {
    const route = useRoute();
    const { chatId } = route?.params;
    const { user } = useAuth();
    const {
        fetchChatMessages,
        getMessagesForChat,
        messagesByChatId,
        messagesLoadingByChatId,
        products
    } = useData();
    const scrollViewRef = useRef(null);
    const hasFetchedRef = useRef(false);
    const [displayedRecommendations, setDisplayedRecommendations] = useState([]);

    // Memoized callback to close bottom sheet
    const handleCloseRecommendations = useCallback(() => {
        setDisplayedRecommendations([]);
    }, []);

    // Fetch messages for this chat (only once)
    useEffect(() => {
        if (chatId && !hasFetchedRef.current) {
            hasFetchedRef.current = true;
            fetchChatMessages(chatId);
        }
    }, [chatId]);

    // Reset fetch flag when chatId changes
    useEffect(() => {
        hasFetchedRef.current = false;
    }, [chatId]);

    // Get messages and loading state for this specific chat
    const messages = getMessagesForChat(messagesByChatId, chatId);
    const loading = messagesLoadingByChatId[chatId] || false;

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                edges={['top']}
                style={DefaultStyles.safeArea}
            >
                <ChatHistoryScreenHeader />

                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.chatContainer}
                    showsVerticalScrollIndicator={true}
                    style={{ flex: 1 }}
                >
                    {/* Static welcome message */}
                    <View style={styles.botMessageContainer}>
                        <Image
                            source={Logo}
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 32,
                                padding: 4,
                                backgroundColor: colors.background.primary,
                            }}
                        />

                        <View style={styles.botTextContainer}>
                            <DefaultText style={styles.text}>
                                Hello! I'm your virtual skin advisor. Got questions about skincare? I'm here anytime with quick guidance and safe product suggestions. Just a heads-up: I'm not a licensed medical professional. For personalized treatment, it's always best to consult a dermatologist.
                            </DefaultText>
                        </View>
                    </View>

                    {/* Chat messages */}
                    {messages.map((message, index) => (
                        message.isFromAI ? (
                            <View key={message.id || index} style={styles.botMessageContainer}>
                                <Image
                                    source={Logo}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 32,
                                        padding: 3,
                                        backgroundColor: colors.background.primary,
                                    }}
                                />

                                <View style={styles.botTextContainer}>
                                    <DefaultText style={styles.text}>
                                        {parseMarkdownText(message.content)}
                                    </DefaultText>

                                    {/* Product recommendations */}
                                    {message.hasProductRecommendations &&
                                     message.recommendedProducts &&
                                     message.recommendedProducts.length > 0 && (
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
                                <View style={styles.userTextContainer}>
                                    <DefaultText style={[
                                        styles.text,
                                        { color: colors.text.primary }
                                    ]}>
                                        {message.content}
                                    </DefaultText>
                                    {(message.imageUrl || message.hasImage) && (
                                        <Image
                                            source={{ uri: message.imageUrl }}
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

                    {loading && (
                        <View style={styles.botMessageContainer}>
                            <Image
                                source={Logo}
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 32,
                                    padding: 2,
                                    backgroundColor: colors.background.primary,
                                }}
                            />

                            <View style={styles.botTextContainer}>
                                <DefaultText style={[styles.text, { fontStyle: 'italic', opacity: 0.7 }]}>
                                    Loading messages...
                                </DefaultText>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            <DefaultBottomSheet
                isOpen={displayedRecommendations?.length > 0}
                onClose={handleCloseRecommendations}
            >
                {displayedRecommendations?.length > 0 && (
                    <View style={styles.productRecommendationsContainer}>
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
        </View>
    )
}

export default ChatHistoryScreen;

const styles = StyleSheet.create({
    chatContainer: {
        padding: DefaultStyles.container.paddingTop,
        paddingBottom: 48, // Extra space at bottom
        width: '100%',
        gap: 12,
    },
    botMessageContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        width: '100%',
    },
    botTextContainer: {
        maxWidth: '75%',
        padding: DefaultStyles.container.paddingTop,
        borderRadius: 12,
        borderTopLeftRadius: 0,
        borderWidth: 1.5,
        borderColor: colors.accents.stroke,
        backgroundColor: colors.background.light,
        alignSelf: 'flex-start',
    },
    userMessageContainer: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
        width: '100%',
        justifyContent: 'flex-end'
    },
    userTextContainer: {
        maxWidth: '75%',
        padding: DefaultStyles.container.paddingTop,
        borderRadius: 12,
        borderTopRightRadius: 0,
        backgroundColor: colors.background.primary,
        alignSelf: 'flex-end',
    },
    text: {
        fontSize: DefaultStyles.text.caption.small,
        fontWeight: '500',
        color: colors.text.secondary,
        lineHeight: 20,
    },
    messageImage: {
        width: 150,
        height: 150,
        borderRadius: 12,
        marginTop: 8,
        backgroundColor: colors.background.light,
    },
    productRecommendationsContainer: {
        gap:24,
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
    },
    productScrollContent: {
        gap: 16,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
    },
    productCardWrapper: {
        width: 160,
    },
    flexContainer: {
        gap:16,
        width:'100%',
        justifyContent:'space-between',
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
});