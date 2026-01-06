import { useMemo } from "react";
import { SkincareProductCategories } from "../../../../../../constants/products";
import { useData } from "../../../../../../context/global/DataContext";
import AnalysisScreenCategoryScreenShortcut from "../../../CategoryScreen/shortcut";
import AnalysisScreenProductsTabNoProductRecommendationsAvailable from "./noProducts";

const AnalysisScreenProductsTabCategorizedRecommendations = ({
    routineRecommendations
}) => {
    const {products, routineProducts} = useData();

    // Simple filtering without complex memoization
    const filteredRecommendations = useMemo(() => {
        if (!Array.isArray(routineRecommendations)) return [];
        
        const existingIds = routineProducts?.map(item => item.routineInfo?.productId) || [];
        return routineRecommendations.filter(id => !existingIds.includes(id));
    }, [routineRecommendations, routineProducts]);

    // Group by category - simple approach without over-optimization
    const productsByCategory = useMemo(() => {
        if (!filteredRecommendations.length) return [];
        
        const categoryMap = new Map();
        
        filteredRecommendations.forEach(productId => {
            const category = products?.[productId]?.category;
            if (category !== undefined) {
                if (!categoryMap.has(category)) {
                    categoryMap.set(category, []);
                }
                categoryMap.get(category).push(productId);
            }
        });
        
        return Array.from(categoryMap.entries())
            .sort(([a], [b]) => a - b)
            .map(([, productIds]) => productIds);
    }, [filteredRecommendations, products]);

    if (productsByCategory?.length) {
        return productsByCategory.map((categoryProducts, idx) => {
            const firstProduct = products?.[categoryProducts[0]];
            const skincareProductCategory = SkincareProductCategories.find(spc => spc.value === firstProduct?.category);
            
            return (
                <AnalysisScreenCategoryScreenShortcut
                    key={idx}
                    image={firstProduct?.imageUrl}
                    category={skincareProductCategory}
                    categoryProducts={categoryProducts}
                />
            )
        })
    }
    else {
        return (
            <AnalysisScreenProductsTabNoProductRecommendationsAvailable />
        )
    }
}

export default AnalysisScreenProductsTabCategorizedRecommendations;