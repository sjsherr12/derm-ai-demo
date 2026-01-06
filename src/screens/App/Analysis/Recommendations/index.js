import DefaultText from 'components/Text/DefaultText';
import colors from 'config/colors';
import * as Haptics from 'expo-haptics'
import { SafeAreaView } from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons'
import ProductCardItem from 'components/Products/ProductCardItem';
import EmptyComponentGeneric from '../../../../components/Graphics/EmptyGeneric';
import { useSafeAreaStyles } from "../../../../hooks/useSafeAreaStyles";
const { default: DefaultStyles } = require("config/styles");
const { useData } = require("context/global/DataContext");
const { View, ScrollView, StyleSheet, FlatList } = require("react-native");
const { default: RecommendationsScreenHeader } = require("./header");
const { useNavigation, useRoute } = require("@react-navigation/native");

const RecommendationsScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const safeAreaStyles = useSafeAreaStyles();

    const {recommendations, tabTitle, infoTitle, infoDescription, emptyTitle, emptyDescription} = route?.params;
    const {products} = useData();

    // Convert product IDs to product objects
    const recommendedProducts = recommendations?.map(productId => products?.[productId]).filter(Boolean) || [];

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
            <RecommendationsScreenHeader
                tabTitle={tabTitle}
                infoTitle={infoTitle}
                infoDescription={infoDescription}
            />

            {recommendedProducts.length > 0 ? (
                <FlatList
                    data={recommendedProducts}
                    renderItem={renderProductItem}
                    keyExtractor={(item) => item.id}
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
                        icon='list-outline'
                        size={64}
                        title={emptyTitle || 'No products'}
                        description={emptyDescription || 'There are no products in this list.'}
                    />
                </View>
            )}
        </View>
    )
}

export default RecommendationsScreen;

const styles = StyleSheet.create({
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
        flex: 1,
        paddingHorizontal: DefaultStyles.container.paddingHorizontal,
        paddingTop: 20,
    },
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
    title: {
        fontSize:DefaultStyles.text.title.small,
        color:colors.text.lighter,
        fontWeight:'600',
        textAlign:'center',
    },
    caption: {
        fontSize:DefaultStyles.text.caption.small,
        color:colors.text.lighter,
        textAlign:'center',
    }
})