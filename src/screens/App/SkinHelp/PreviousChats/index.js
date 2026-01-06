import { Animated, Pressable, ScrollView, StyleSheet, View } from "react-native"
import DefaultStyles from "../../../../config/styles"
import { SafeAreaView } from "react-native-safe-area-context"
import { useData } from "../../../../context/global/DataContext"
import PreviousChatsScreenHeader from "./header"
import DefaultText from "../../../../components/Text/DefaultText"
import EmptyComponentGeneric from "../../../../components/Graphics/EmptyGeneric"
import colors from "../../../../config/colors"
import { timeAgo } from "../../../../utils/date"
import {Ionicons} from '@expo/vector-icons'
import useScalePressAnimation from "../../../../hooks/useScalePressAnimation"
import { useNavigation } from "@react-navigation/native"

const ChatShortcut = ({
    chat
}) => {
    
    const navigation = useNavigation();
    const {handlePressIn, handlePressOut, scale} = useScalePressAnimation({
        minScale:.975,
        maxScale:1,
        duration:150
    })

    return (
        <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={() => navigation.navigate('ChatHistory', {
                chatId: chat?.id
            })}
        >
            <Animated.View
                style={{
                    ...styles.flexContainer,
                    transform:[{scale}]
                }}
            >
                <View
                    style={{
                        flex:1,
                        gap:8
                    }}
                >
                    <DefaultText
                        style={styles.title}
                    >
                        {chat?.title ?? 'Chat'}
                    </DefaultText>

                    <DefaultText
                        style={styles.caption}
                    >
                        Chat created {timeAgo(chat?.createdAt ?? (new Date()))}
                    </DefaultText>
                </View>

                <Ionicons
                    name='chevron-forward'
                    size={24}
                    color={colors.text.secondary}
                />
            </Animated.View>
        </Pressable>
    )
}

const PreviousChatsScreen = () => {
    const { aiChats, aiChatsLoading } = useData();

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                edges={['top']}
                style={DefaultStyles.safeArea}
            >
                <PreviousChatsScreenHeader
                />

                <ScrollView
                    contentContainerStyle={DefaultStyles.scrollContainer}
                >
                    {aiChats?.length? (
                        <>
                            {aiChats.map((chat, idx) => (
                                <ChatShortcut
                                    key={idx}
                                    chat={chat}
                                />
                            ))}
                        </>
                    ) : (
                        <EmptyComponentGeneric
                            icon='chatbubbles-outline'
                            size={64}
                            title={'No chats'}
                            description={'You have not had any chats with our AI skin helper yet. Try it out completely for free!'}
                        />
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    )
}

export default PreviousChatsScreen;

const styles = StyleSheet.create({
    flexContainer: {
        flexDirection:'row',
        alignItems:'center',
        width:'100%',
        borderBottomWidth:1.5,
        borderBottomColor:colors.accents.stroke,
        paddingBottom:DefaultStyles.container.paddingBottom,
    },
    title: {
        fontSize:DefaultStyles.text.caption.medium,
        fontWeight:'700',
        color:colors.text.secondary
    },
    caption: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
    }
})