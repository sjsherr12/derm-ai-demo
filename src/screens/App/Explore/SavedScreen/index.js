import { SafeAreaView } from "react-native-safe-area-context"
import DefaultStyles from "../../../../config/styles"
import { useData } from "../../../../context/global/DataContext"
import { useMemo, memo } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import colors from "../../../../config/colors";
import EmptyComponentGeneric from "../../../../components/Graphics/EmptyGeneric";
import ProductCardItem from "../../../../components/Products/ProductCardItem";
import ExploreScreenSavedProductsScreenHeader from "./header";

const ExploreScreenSavedProductsScreen = ({

}) => {

    const {products, userData} = useData();
    const savedProducts = useMemo(
        () => userData?.routine?.likedProducts
            ?.map((productId => products?.[productId]))
            .filter(item => item && item.id) || [],
        [userData?.routine?.likedProducts, products]
    )

    const renderProductItem = ({item}) => (
        <ProductCardItem
            product={item}
            columns={2}
        />
    )

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                style={DefaultStyles.safeArea}
                edges={['top']}
            >
                <ExploreScreenSavedProductsScreenHeader />

                {savedProducts.length > 0 ? (
                    <FlatList
                        data={savedProducts}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item?.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        contentContainerStyle={styles.flatListContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                        style={styles.flatList}
                    />
                ) : (
                    <View style={styles.emptyWrapper}>
                        <EmptyComponentGeneric
                            icon='bookmark-outline'
                            size={64}
                            title={'No saved products'}
                            description={'You have not saved any products yet. You can save products from their product page or listing card.'}
                        />
                    </View>
                )}
            </SafeAreaView>
        </View>
    )
}

export default memo(ExploreScreenSavedProductsScreen)

const styles = StyleSheet.create({
    emptyContainer: {
        borderWidth:2,
        borderStyle:'dashed',
        borderColor:colors.accents.stroke,
        justifyContent:'center',
        borderRadius:12,
        alignItems:'center',
        gap:16,
        padding:DefaultStyles.container.paddingHorizontal
    },
    flatList: {
        flex: 1,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
    },
    flatListContent: {
        paddingBottom: DefaultStyles.tabScrollContainer.paddingBottom,
        paddingTop: 20,
    },
    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 0,
    },
    emptyWrapper: {
        paddingHorizontal:DefaultStyles.container.paddingHorizontal,
        paddingVertical:DefaultStyles.container.paddingBottom
    },
})