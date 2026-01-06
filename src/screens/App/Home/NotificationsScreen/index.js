import IconButton from "components/Buttons/IconButton"
import DefaultTabHeader from "components/Containers/DefaultTabHeader"
import colors from "config/colors"
import { ScrollView, StyleSheet, View, FlatList, ActivityIndicator, RefreshControl } from "react-native"
import NotificationsScreenHeader from "./header"
import { useData } from "../../../../context/global/DataContext"
import EmptyComponentGeneric from "../../../../components/Graphics/EmptyGeneric"
import {Ionicons} from '@expo/vector-icons'
import { timeAgo } from "../../../../utils/date"
import TopTabBar from "../../../../components/Options/TopTabBar"
import * as Haptics from 'expo-haptics'
import { useState, useCallback, useMemo, useEffect } from "react"
import { NotificationTypes } from "../../../../constants/signup"
const { default: DefaultText } = require("components/Text/DefaultText")
const { default: DefaultStyles } = require("config/styles")
const { SafeAreaView } = require("react-native-safe-area-context")

const BATCH_SIZE = 10;
const TABS = ['Today', 'This Week', 'Past'];

const NotificationsScreen = ({
    navigation
}) => {
    const {
        notifications,
        constants,
        notificationsLoading,
        fetchNotifications,
        getLocalProductById
    } = useData();
    const [activeTab, setActiveTab] = useState(0);
    const [displayedCounts, setDisplayedCounts] = useState({
        1: BATCH_SIZE, // This Week
        2: BATCH_SIZE  // Past
    });
    const [loadingMore, setLoadingMore] = useState({
        1: false,
        2: false
    });

    const filterNotificationsByTime = useCallback((notifications, timeFilter) => {
        if (!notifications || notifications.length === 0) return [];
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        
        return notifications.filter(notification => {
            const notificationDate = notification.sentAt.toDate();
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            
            switch (timeFilter) {
                case 0: // Today - since last 12am
                    return notificationDate >= today && notificationDate < tomorrow;
                case 1: // This Week - last 7 days (excluding today)
                    return notificationDate >= sevenDaysAgo && notificationDate < today;
                case 2: // Past - anything older than 7 days
                    return notificationDate < sevenDaysAgo;
                default:
                    return false;
            }
        }).sort((a, b) => b.sentAt.toDate() - a.sentAt.toDate());
    }, []);

    // Memoized filtered notifications for each tab
    const filteredNotifications = useMemo(() => {
        return {
            0: filterNotificationsByTime(notifications, 0), // Today
            1: filterNotificationsByTime(notifications, 1), // This Week
            2: filterNotificationsByTime(notifications, 2)  // Past
        };
    }, [notifications, filterNotificationsByTime]);

    // Get displayed notifications for current tab
    const getCurrentTabNotifications = useCallback(() => {
        const allNotifications = filteredNotifications[activeTab] || [];
        
        if (activeTab === 0) {
            // Show all for Today tab
            return allNotifications;
        } else {
            // Show limited for This Week and Past tabs
            const limit = displayedCounts[activeTab] || BATCH_SIZE;
            return allNotifications.slice(0, limit);
        }
    }, [activeTab, filteredNotifications, displayedCounts]);

    const loadMoreNotifications = useCallback(() => {
        if (activeTab === 0 || loadingMore[activeTab]) return;
        
        const allNotifications = filteredNotifications[activeTab] || [];
        const currentCount = displayedCounts[activeTab] || BATCH_SIZE;
        
        if (currentCount >= allNotifications.length) return;
        
        setLoadingMore(prev => ({ ...prev, [activeTab]: true }));
        
        // Simulate loading delay
        setTimeout(() => {
            setDisplayedCounts(prev => ({
                ...prev,
                [activeTab]: Math.min(currentCount + BATCH_SIZE, allNotifications.length)
            }));
            setLoadingMore(prev => ({ ...prev, [activeTab]: false }));
        }, 500);
    }, [activeTab, filteredNotifications, displayedCounts, loadingMore]);

    // Reset displayed count when switching tabs
    useEffect(() => {
        if (activeTab !== 0) {
            setDisplayedCounts(prev => ({
                ...prev,
                [activeTab]: Math.min(BATCH_SIZE, (filteredNotifications[activeTab] || []).length)
            }));
        }
    }, [activeTab, filteredNotifications]);

    const renderNotificationItem = useCallback(({ item }) => {
        const notificationInfo = NotificationTypes.find(nt => nt.value === item?.type);
        const isRead = item?.read;
        
        if (notificationInfo) {
            // Handle type 5 notifications with product data replacement
            let displayBody = notificationInfo?.body || item.message || 'No message';
            
            if (item?.type === 5 && item?.productId && getLocalProductById) {
                const productData = getLocalProductById(item.productId);
                if (productData) {
                    displayBody = displayBody
                        .replace('{product}', productData.name || 'Unknown Product')
                        .replace('{brand}', productData.brand || 'Unknown Brand');
                }
            }
            
            return (
                <View
                    style={[
                        styles.itemContainer,
                        {
                            borderColor:isRead?colors.accents.stroke:colors.background.primary
                        }
                    ]}
                >
                    <View style={styles.icon}>
                        <Ionicons
                            color={colors.text.secondary}
                            size={24}
                            name={notificationInfo?.icon || 'notifications-outline'}
                        />
                    </View>

                    <View
                        style={{
                            gap:6,
                            flex:1
                        }}
                    >
                        <View style={styles.flexContainer}>
                            <DefaultText style={styles.caption}>
                                {notificationInfo?.title || 'Notification'}
                            </DefaultText>

                            <DefaultText style={styles.timeAgo}>
                                {timeAgo(item.sentAt.toDate())}
                            </DefaultText>
                        </View>

                        <DefaultText style={styles.text}>
                            {displayBody}
                        </DefaultText>
                    </View>

                    {!isRead &&
                        <View style={styles.badge} />
                    }
                </View>
            );
        }
    }, [constants, getLocalProductById]);

    const renderFooter = useCallback(() => {
        if (activeTab === 0) return null; // No footer for Today tab
        
        const allNotifications = filteredNotifications[activeTab] || [];
        const displayedCount = displayedCounts[activeTab] || BATCH_SIZE;
        const hasMore = displayedCount < allNotifications.length;
        
        if (!hasMore) return null;
        
        if (loadingMore[activeTab]) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.background.primary} />
                    <DefaultText style={styles.loadingText}>Loading more...</DefaultText>
                </View>
            );
        }
        
        return null;
    }, [activeTab, filteredNotifications, displayedCounts, loadingMore]);

    const renderEmptyComponent = useCallback(() => {
        const tabName = TABS[activeTab];
        return (
            <View
                style={{
                    paddingVertical:DefaultStyles.container.paddingBottom
                }}
            >
                <EmptyComponentGeneric
                    icon='notifications-outline'
                    title='No Notifications'
                    description={`You have not received any notifications ${tabName === 'Today' ? 'today' : tabName === 'This Week' ? 'this week' : 'in the past'}.`}
                />
            </View>
        );
    }, [activeTab]);

    const keyExtractor = useCallback((item, index) => `${activeTab}-${item.id || index}`, [activeTab]);

    const currentNotifications = getCurrentTabNotifications();

    return (
        <View style={DefaultStyles.outer}>
            <SafeAreaView
                style={DefaultStyles.safeArea}
                edges={['top']}
            >
                <NotificationsScreenHeader
                    notifications={notifications}
                />
                
                <View style={styles.contentContainer}>
                    <View style={styles.tabBarContainer}>
                        <TopTabBar
                            tabs={TABS}
                            activeTab={activeTab}
                            onChange={setActiveTab}
                            hapticType={Haptics.ImpactFeedbackStyle.Soft}
                        />
                    </View>

                    <FlatList
                        refreshControl={
                            <RefreshControl
                                refreshing={notificationsLoading}
                                onRefresh={() => fetchNotifications(true)}
                            />
                        }
                        data={currentNotifications}
                        renderItem={renderNotificationItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={
                            currentNotifications.length === 0 
                                ? styles.emptyContainer 
                                : [
                                    DefaultStyles.scrollContainer,
                                    {
                                        gap:0,
                                    }
                                ]
                        }
                        showsVerticalScrollIndicator={false}
                        onEndReached={loadMoreNotifications}
                        onEndReachedThreshold={0.1}
                        ListFooterComponent={renderFooter}
                        ListEmptyComponent={renderEmptyComponent}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                    />
                </View>
            </SafeAreaView>
        </View>
    )
}

export default NotificationsScreen

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
    },
    tabBarContainer: {
        padding: DefaultStyles.container.paddingBottom,
        paddingBottom:0,
    },
    separator: {
        height: 12,
    },
    itemContainer: {
        position:'relative',
        borderRadius:16,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        padding:DefaultStyles.container.paddingBottom,
        flexDirection:'row',
        gap:18,
    },
    flexContainer: {
        flexDirection:'row',
        alignItems:'end',
        justifyContent:'space-between',
        gap:16,
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        fontWeight:'600',
        color:colors.text.secondary,
    },
    text: {
        fontSize:14,
        color:colors.text.darker,
        lineHeight:18
    },
    timeAgo: {
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.lighter,
        fontWeight:'500',
    },
    icon: {
        width:48,
        height:48,
        backgroundColor:colors.background.light,
        justifyContent:'center',
        alignItems:'center',
        borderRadius:64,
    },
    loadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    loadingText: {
        fontSize: DefaultStyles.text.caption.small,
        color: colors.text.darker,
        fontWeight: '500',
    },
    emptyContainer: {
        paddingHorizontal: DefaultStyles.container.paddingBottom,
    },
    badge: {
        width:24,
        height:24,
        position:'absolute',
        top:-8,
        right:-8,
        backgroundColor:colors.background.primary,
        borderRadius:16,
    }
})