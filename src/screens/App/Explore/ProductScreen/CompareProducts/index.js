import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import DefaultStyles from "../../../../../config/styles";
import DefaultText from "../../../../../components/Text/DefaultText";
import CompareProductsScreenHeader from "./header";
import { useRoute } from "@react-navigation/native";
import { useData } from "../../../../../context/global/DataContext";
import useIngredientFetcher from "../../../../../context/global/useIngredientFetcher";
import CompareProductsVerticalProductDisplay from "./product";
import CompareProductsSelectScreen from "./select";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import colors from "../../../../../config/colors";
import {Ionicons} from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'

const {height: SCREEN_HEIGHT} = Dimensions.get('window')

const CompareProductsScreen = () => {

    const route = useRoute();
    const {initialProductId} = route?.params
    const {products} = useData();
    const { fetchProductIngredients, ingredients } = useIngredientFetcher();
    const [loading, setLoading] = useState(true)
    const [comparedProducts, setComparedProducts] = useState([initialProductId]);
    const [ingredientsExpanded, setIngredientsExpanded] = useState(false)
    const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)

    // Calculate the smallest ingredients list length from all compared products
    const smallestIngredientsListLength = Math.min(comparedProducts
        .map(productId => products?.[productId])
        .filter(product => product && product.ingredients)
        .reduce((min, product) => {
            const length = product.ingredients?.length ?? 0;
            return length < min ? length : min;
        }, Infinity) || 3, 3); // Default to 3 if no products have ingredients

    // Fetch ingredients for all compared products
    useEffect(() => {
        const fetchAllIngredients = async () => {
            if (!products) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true)
                // Get actual product objects from IDs
                const productObjects = comparedProducts
                    .map(productId => products?.[productId])
                    .filter(product => product && product.ingredients);

                // Fetch ingredients for all products in parallel
                await Promise.all(
                    productObjects.map(product => fetchProductIngredients(product))
                );
            } catch (error) {
                console.error('Error fetching ingredients for compared products:', error);
            } finally {
                setLoading(false)
            }
        };

        fetchAllIngredients();
    }, [comparedProducts, fetchProductIngredients, products]);

    // Handle product selection from modal
    const handleProductSelect = (productId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setComparedProducts(prev => [...prev, productId]);
    };

    // Handle opening the modal
    const handleOpenSelectModal = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsSelectModalOpen(true);
    };

    // Handle closing the modal
    const handleCloseSelectModal = () => {
        setIsSelectModalOpen(false);
    };

    // Handle removing a product from comparison
    const handleRemoveProduct = (productId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setComparedProducts(prev => prev.filter(id => id !== productId));
    };

    return (
        <View
            style={DefaultStyles.outer}
        >
            <SafeAreaView
                edges={['top']}
                style={DefaultStyles.safeArea}
            >
                <CompareProductsScreenHeader
                    onAddProduct={handleOpenSelectModal}
                />

                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    style={styles.outerScroll}
                >
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled={true}
                        contentContainerStyle={styles.innerScroll}
                    >
                        {comparedProducts.map((productId, idx) => {
                            const product = products?.[productId]
                            return (
                                <CompareProductsVerticalProductDisplay
                                    key={idx}
                                    product={product}
                                    loading={loading}
                                    expanded={ingredientsExpanded}
                                    setExpanded={setIngredientsExpanded}
                                    ingredientsCutoff={smallestIngredientsListLength}
                                    ingredients={product?.ingredients?.map((ing, idx) => ingredients?.[ing])?.sort((a, b) => (b?.safetyScore ?? 0) - (a?.safetyScore ?? 0))}
                                    onRemove={() => handleRemoveProduct(productId)}
                                />
                            )
                        })}

                        <Pressable
                            style={{
                                height:SCREEN_HEIGHT-250,
                                width:250,
                                marginHorizontal:DefaultStyles.container.paddingHorizontal,
                                backgroundColor:colors.background.light,
                                borderRadius:16,
                                alignItems:'center',
                                justifyContent:'center',
                                gap:12,
                            }}
                            onPress={handleOpenSelectModal}
                        >
                            <Ionicons
                                name='add-circle-outline'
                                size={48}
                                color={colors.text.lighter}
                            />
                            <DefaultText
                                style={{
                                    fontSize:DefaultStyles.text.caption.medium,
                                    fontWeight:'600',
                                    color:colors.text.lighter,
                                }}
                            >
                                Add Product
                            </DefaultText>
                        </Pressable>
                    </ScrollView>
                </ScrollView>
            </SafeAreaView>

            <Modal
                visible={isSelectModalOpen}
                presentationStyle='pageSheet'
                animationType='slide'
                onRequestClose={handleCloseSelectModal}
            >
                <CompareProductsSelectScreen
                    onProductSelect={handleProductSelect}
                    onClose={handleCloseSelectModal}
                    excludedProductIds={comparedProducts}
                />
            </Modal>
        </View>
    )
}

export default CompareProductsScreen;

const styles = StyleSheet.create({
    outerScroll: {
        flex: 1,
    },
    innerScroll: {
        paddingRight:DefaultStyles.container.paddingHorizontal,
    },
    scrollContainer: {
        paddingVertical:DefaultStyles.container.paddingHorizontal,
        flexGrow: 1,
    }
})