import { useData } from "context/global/DataContext";
import { Image, ScrollView, StyleSheet, View } from "react-native";
import * as Haptics from 'expo-haptics'
import DefaultStyles from "config/styles";
import ExploreScreenSection from "./section";
import { useNavigation } from "@react-navigation/native";
import colors from "config/colors";
import DefaultText from "components/Text/DefaultText";
import { SkinConcerns } from "constants/signup";
import { convertSkinConcernSeverityIdToName } from "utils/analysis";
import { useState, useEffect, useMemo, memo, useCallback } from "react";
import ExploreScreenSearchByGroupedItems from "./grouped";
import { SkinTypes } from "constants/signup";
import { SkincareProductCategories } from "constants/products";

// Category Images
import cleanserImage from 'assets/explore/category/cleanser.jpg';
import creamImage from 'assets/explore/category/cream.webp';
import exfoliantImage from 'assets/explore/category/exfoliant.jpg';
import eyecareImage from 'assets/explore/category/eyecare.jpg';
import maskImage from 'assets/explore/category/mask.jpg';
import moisturizerImage from 'assets/explore/category/moisturizer.webp';
import oilImage from 'assets/explore/category/oil.webp';
import removerImage from 'assets/explore/category/remover.jpg';
import serumImage from 'assets/explore/category/serum.webp';
import sprayImage from 'assets/explore/category/spray.jpg';
import suncareImage from 'assets/explore/category/suncare.jpg';
import tonerImage from 'assets/explore/category/toner.jpg';
import treatmentImage from 'assets/explore/category/treatment.webp';

// Skin Concern Images
import acneImage from 'assets/explore/concern/acne.png';
import agingImage from 'assets/explore/concern/aging.png';
import darkcirclesImage from 'assets/explore/concern/darkcircles.png';
import drynessImage from 'assets/explore/concern/dryness.png';
import oilinessImage from 'assets/explore/concern/oiliness.png';
import poresImage from 'assets/explore/concern/pores.png';
import rednessImage from 'assets/explore/concern/redness.png';
import toneImage from 'assets/explore/concern/tone.png';

// Memoize static image mappings outside component to prevent recreation
const categoryImages = {
    0: cleanserImage,        // Cleanser
    1: moisturizerImage,     // Moisturizer
    3: serumImage,           // Serum
    5: eyecareImage,         // Eye Care
    6: creamImage,           // Cream
    7: maskImage,            // Mask
    8: tonerImage,           // Toner
    9: suncareImage,         // Sun Care
    10: removerImage,        // Makeup Remover
    12: exfoliantImage,      // Exfoliant
    13: treatmentImage,      // Treatment
    14: sprayImage,          // Spray
    15: oilImage,            // Oil
};

const concernImages = {
    'acne': acneImage,
    'aging': agingImage,
    'darkCircles': darkcirclesImage,
    'dryness': drynessImage,
    'oiliness': oilinessImage,
    'pores': poresImage,
    'redness': rednessImage,
    'tone': toneImage,
};

const skinTypeIcons = {
    0: 'star',          // Normal - filled star
    2: 'water',         // Oily - filled water drop
    3: 'leaf',          // Dry - filled leaf
    4: 'options',       // Combination - filled options
};

const ExploreScreenDefaultResults = memo(({
    personalizedProducts,
    trendingProducts,
    setAppliedFilters,
    isLoadingProducts = false
}) => {

    const {products, userData} = useData();
    const navigation = useNavigation();

    // Memoized product objects to prevent unnecessary re-mapping
    const personalizedProductObjects = useMemo(() => 
        personalizedProducts
            .map(productId => products?.[productId])
            .filter(Boolean),
    [personalizedProducts, products]);

    const trendingProductObjects = useMemo(() => 
        trendingProducts
            .map(productId => products?.[productId])
            .filter(Boolean),
    [trendingProducts, products]);

    // Memoized helper function to filter products by category and user preferences
    const getFilteredProductsByCategory = useCallback((categoryValue, limit = 10) => {
        const allProducts = Object.values(products || {});
        
        // Filter by category
        const categoryProducts = allProducts.filter(product => product.category === categoryValue);
        
        if (!userData?.profile?.skinInfo) {
            // If no user data, return top products by safety score
            return categoryProducts
                .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
                .slice(0, limit);
        }

        const userSkinInfo = userData.profile.skinInfo;
        const dislikedProducts = userData?.routine?.dislikedProducts || [];
        
        // Filter out disliked products and those with user sensitivities
        const filteredProducts = categoryProducts.filter(product => {
            // Exclude disliked products
            if (dislikedProducts.includes(product.id)) return false;
            
            // Exclude products with user sensitivities
            if (userSkinInfo.sensitivities && Array.isArray(userSkinInfo.sensitivities) && userSkinInfo.sensitivities.length > 0) {
                if (product.sensitivities && Array.isArray(product.sensitivities)) {
                    const hasUserSensitivities = userSkinInfo.sensitivities.some(sensitivity => 
                        product.sensitivities.includes(sensitivity)
                    );
                    if (hasUserSensitivities) return false;
                }
            }
            
            return true;
        });
        
        // Sort by safety score and return top products
        return filteredProducts
            .sort((a, b) => (b.safetyScore || 0) - (a.safetyScore || 0))
            .slice(0, limit);
    }, [products, userData]);

    return (
        <View
            style={styles.container}
        >
            {/* 1. Personalized For You */}
            <ExploreScreenSection
                title='Personalized For You'
                description='Recommended products tailored to your skin needs.'
                products={personalizedProductObjects}
                isLoading={isLoadingProducts}
                onExpand={() => {
                    navigation.navigate('Recommendations', {
                        recommendations: personalizedProducts,
                        tabTitle:'Recommendations',
                        infoTitle:'Personalized Recommendations',
                        infoDescription:'These products are tailored specifically to your skin profile, matching your skin concerns and type while avoiding ingredients you\'re sensitive to. All recommendations are sorted by safety score to ensure the best options for your skin.'
                    })
                }}
            />
            
            {/* 2. Browse by Product Categories */}
            <ExploreScreenSearchByGroupedItems
                title='Browse by Category'
                filterType='categories'
                options={SkincareProductCategories.map((category => ({
                    ...category,
                    name: category.displayLabel || category.title,
                    image: categoryImages[category.value],
                })))}
                setAppliedFilters={setAppliedFilters}
                imagePadding={12}
            />

            {/* 3. Trending Skincare */}
            <ExploreScreenSection
                title='Trending Skincare'
                description='Products trending based on purchases, reviews, views.'
                products={trendingProductObjects}
                isLoading={isLoadingProducts}
                onExpand={() => {
                    navigation.navigate('Recommendations', {
                        recommendations: trendingProducts,
                        tabTitle:'Trending',
                        infoTitle:'Trending Products',
                        infoDescription:'These products are currently trending based on high quality ratings and popularity. The selection refreshes to show you a curated mix of top-rated skincare products.'
                    })
                }}
            />

            {/* 4. Browse by Skin Concern */}
            <ExploreScreenSearchByGroupedItems
                title='Browse by Concern'
                filterType='skinConcerns'
                options={SkinConcerns.slice(1).map((concern => ({
                    ...concern,
                    name: convertSkinConcernSeverityIdToName(concern.severityId),
                    image: concernImages[concern.severityId],
                })))}
                setAppliedFilters={setAppliedFilters}
                imagePadding={22}
            />

            {/* 5. Cleansers */}
            <ExploreScreenSection
                title='Cleansers'
                description='Gentle cleansers suited for your skin type.'
                products={getFilteredProductsByCategory(0)} // Cleanser category value is 0
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [0]
                    }));
                }}
            />

            {/* 5.1. Browse by Skin Type */}
            <ExploreScreenSearchByGroupedItems
                title='Browse by Skin Type'
                filterType='skinTypes'
                options={SkinTypes.map((skinType => ({
                    ...skinType,
                    name: skinType.displayLabel || skinType.title,
                    icon: skinTypeIcons[skinType.value],
                })))}
                setAppliedFilters={setAppliedFilters}
                imagePadding={4}
            />

            {/* 6. Moisturizers */}
            <ExploreScreenSection
                title='Moisturizers'
                description='Hydrating moisturizers for your skin needs.'
                products={getFilteredProductsByCategory(1)} // Moisturizer category value is 1
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [1]
                    }));
                }}
            />

            {/* 7. Treatments */}
            <ExploreScreenSection
                title='Treatments'
                description='Targeted treatments for specific skin concerns.'
                products={getFilteredProductsByCategory(13)} // Treatment category value is 13
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [13]
                    }));
                }}
            />

            {/* 7.1. Creams */}
            <ExploreScreenSection
                title='Creams'
                description='Rich creams for enhanced skin protection.'
                products={getFilteredProductsByCategory(6)} // Cream category value is 6
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [6]
                    }));
                }}
            />

            {/* 8. Serums */}
            <ExploreScreenSection
                title='Serums'
                description='Concentrated serums with active ingredients.'
                products={getFilteredProductsByCategory(3)} // Serum category value is 3
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [3]
                    }));
                }}
            />

            {/* 9. Toners */}
            <ExploreScreenSection
                title='Toners'
                description='Balancing toners to prep your skin.'
                products={getFilteredProductsByCategory(8)} // Toner category value is 8
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [8]
                    }));
                }}
            />

            {/* 9.1. Eye Care */}
            <ExploreScreenSection
                title='Eye Care'
                description='Specialized care for the delicate eye area.'
                products={getFilteredProductsByCategory(5)} // Eye Care category value is 5
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [5]
                    }));
                }}
            />

            {/* 10. Masks */}
            <ExploreScreenSection
                title='Masks'
                description='Treatment masks for intensive care.'
                products={getFilteredProductsByCategory(7)} // Mask category value is 7
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [7]
                    }));
                }}
            />

            {/* 11. Exfoliants */}
            <ExploreScreenSection
                title='Exfoliants'
                description='Gentle exfoliants to smooth skin texture.'
                products={getFilteredProductsByCategory(12)} // Exfoliant category value is 12
                isLoading={isLoadingProducts}
                onExpand={() => {
                    setAppliedFilters(prev => ({
                        ...prev,
                        categories: [12]
                    }));
                }}
            />
        </View>
    )
});

const styles = StyleSheet.create({
    container: {
        gap:24,
    },
})

export default ExploreScreenDefaultResults;