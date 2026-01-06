import { useRoute } from "@react-navigation/native"
import AnalysisScreenProductsTabCategorizedRecommendations from "../AnalysisScreen/Tabs/ProductsTab/categorized";
import { FlatList, ScrollView, StyleSheet, View } from "react-native";
import DefaultStyles from "../../../../config/styles";
import { useSafeAreaStyles } from "../../../../hooks/useSafeAreaStyles";
import FullRecommendationsScreenHeader from "./header";
import {Ionicons} from '@expo/vector-icons'
import colors from "../../../../config/colors";
import DefaultText from "../../../../components/Text/DefaultText";
import TopTabBar from "../../../../components/Options/TopTabBar";
import { useMemo, useState } from "react";
import * as Haptics from 'expo-haptics'
import ProductCardItem from "../../../../components/Products/ProductCardItem";
import { useData } from "../../../../context/global/DataContext";

const FullRecommendationsScreen = ({

}) => {

    const route = useRoute();
    const [tab, setTab] = useState(0)
    const {products} = useData();
    const safeAreaStyles = useSafeAreaStyles();
    const {routineRecommendations} = route?.params;
    const dataFilledRoutineRecommendations = useMemo(
        () => routineRecommendations?.map(productId => products?.[productId]).filter(Boolean) || [],
        [products]
    )

    const renderProductItem = ({ item }) => (
        <ProductCardItem
            product={item}
            columns={2}
        />
    );

    return (
        <View
            style={[DefaultStyles.outer, safeAreaStyles.safeAreaTop]}
        >
            <FullRecommendationsScreenHeader
            />

            <View
                style={styles.topTabBarContainer}
            >
                <TopTabBar
                    tabs={['Categorized', 'All Products']}
                    activeTab={tab}
                    onChange={setTab}
                    hapticType={Haptics.ImpactFeedbackStyle.Soft}
                />
            </View>

            <View style={{display:tab===0?'contents':'none'}}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={DefaultStyles.tabScrollContainer}
                >
                    <View
                        style={styles.itemContainer}
                    >
                        <Ionicons
                            name='information-circle-outline'
                            color={colors.text.secondary}
                            size={24}
                        />
                        <DefaultText
                            style={styles.text}
                        >
                            Note: these recommendations are outdated. You are viewing your recommendation history, not your current recommendations.
                        </DefaultText>
                    </View>

                    <AnalysisScreenProductsTabCategorizedRecommendations
                        routineRecommendations={routineRecommendations}
                    />
                </ScrollView>
            </View>

            <View style={{display:tab===1?'contents':'none'}}>
                <FlatList
                    data={dataFilledRoutineRecommendations}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.flatListContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                    style={styles.flatList}
                />
            </View>
        </View>
    )
}

export default FullRecommendationsScreen;

const styles = StyleSheet.create({
    itemContainer: {
        padding:DefaultStyles.container.paddingBottom,
        borderRadius:12,
        borderWidth:1.5,
        borderColor:colors.accents.stroke,
        gap:16,
        flexDirection:'row',
        alignItems:'center',
    },
    topTabBarContainer: {
        padding:DefaultStyles.container.paddingBottom,
        paddingBottom:0,
    },
    text: {
        flex:1,
        fontSize:DefaultStyles.text.caption.xsmall,
        color:colors.text.darker,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    flatList: {
        flex: 1,
        paddingHorizontal: DefaultStyles.container.paddingBottom,
    },
    flatListContent: {
        paddingHorizontal:8,
        paddingTop: DefaultStyles.container.paddingTop,
        paddingBottom: DefaultStyles.tabScrollContainer.paddingBottom,
    },
})