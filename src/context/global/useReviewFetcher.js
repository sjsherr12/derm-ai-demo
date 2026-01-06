import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, where, getDocs, limit, orderBy, startAfter } from 'firebase/firestore';
import { useAuth } from 'context/global/AuthContext';
import { db } from 'services/firebase/firebase';

const useReviewFetcher = () => {
    const [reviews, setReviews] = useState({});
    const [userReviews, setUserReviews] = useState([]);
    const [userReviewsLoading, setUserReviewsLoading] = useState(true);
    const [userReviewsLoadingMore, setUserReviewsLoadingMore] = useState(false);
    const [userReviewsHasMore, setUserReviewsHasMore] = useState(true);
    const [lastUserReviewDoc, setLastUserReviewDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const INITIAL_USER_REVIEWS_LIMIT = 5;
    const LOAD_MORE_USER_REVIEWS_LIMIT = 10;

    // Fetch user's reviews with initial limit
    const fetchUserReviews = async (isLoadMore = false) => {
        if (!user) {
            setUserReviews([]);
            setUserReviewsLoading(false);
            return;
        }

        if (isLoadMore) {
            setUserReviewsLoadingMore(true);
        } else {
            setUserReviewsLoading(true);
            setUserReviews([]);
            setLastUserReviewDoc(null);
            setUserReviewsHasMore(true);
        }

        try {
            const reviewsRef = collection(db, 'reviews');
            let q = query(
                reviewsRef,
                where('user', '==', user.uid),
                orderBy('createdAt', 'desc'),
                limit(isLoadMore ? LOAD_MORE_USER_REVIEWS_LIMIT : INITIAL_USER_REVIEWS_LIMIT)
            );

            if (isLoadMore && lastUserReviewDoc) {
                q = query(
                    reviewsRef,
                    where('user', '==', user.uid),
                    orderBy('createdAt', 'desc'),
                    startAfter(lastUserReviewDoc),
                    limit(LOAD_MORE_USER_REVIEWS_LIMIT)
                );
            }

            const querySnapshot = await getDocs(q);
            console.log('👤 useReviewFetcher: Fetched', querySnapshot.docs.length, 'user reviews', isLoadMore ? '(load more)' : '(initial)');
            const newReviews = [];
            
            querySnapshot.docs.forEach(doc => {
                newReviews.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            if (isLoadMore) {
                setUserReviews(prev => [...prev, ...newReviews]);
            } else {
                setUserReviews(newReviews);
            }

            // Update pagination state
            setLastUserReviewDoc(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
            setUserReviewsHasMore(newReviews.length === (isLoadMore ? LOAD_MORE_USER_REVIEWS_LIMIT : INITIAL_USER_REVIEWS_LIMIT));

        } catch (error) {
            console.error('Error fetching user reviews:', error);
        } finally {
            setUserReviewsLoading(false);
            setUserReviewsLoadingMore(false);
        }
    };

    // Load more user reviews
    const loadMoreUserReviews = () => {
        if (!userReviewsLoadingMore && userReviewsHasMore) {
            fetchUserReviews(true);
        }
    };

    // Initial load of user reviews
    useEffect(() => {
        fetchUserReviews(false);
    }, [user]);

    // Keep the original functionality for backward compatibility (product reviews, etc.)
    useEffect(() => {
        if (!user) {
            setReviews({});
            setLoading(false);
            return;
        }

        const reviewsRef = collection(db, 'reviews');
        const unsubscribe = onSnapshot(reviewsRef, (snapshot) => {
            console.log('🔥 useReviewFetcher: Real-time listener triggered, processing', snapshot.docs.length, 'review documents');
            const reviewsData = {};
            snapshot.docs.forEach(doc => {
                reviewsData[doc.id] = {
                    id: doc.id,
                    ...doc.data()
                };
            });
            setReviews(reviewsData);
            setLoading(false);
        });

        return unsubscribe;
    }, [user]);

    const addReview = async (reviewData) => {
        if (!user) throw new Error('User must be authenticated');
        
        // Check if user already reviewed this product
        const existingReview = await checkExistingReview(reviewData.productId);
        if (existingReview) {
            throw new Error('You have already reviewed this product');
        }

        const reviewsRef = collection(db, 'reviews');
        const docRef = await addDoc(reviewsRef, {
            ...reviewData,
            user: user.uid,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        // Refresh user reviews to show the new review
        fetchUserReviews(false);
        
        return docRef.id;
    };

    const updateReview = async (reviewId, reviewData) => {
        if (!user) throw new Error('User must be authenticated');
        
        const reviewRef = doc(db, 'reviews', reviewId);
        await updateDoc(reviewRef, {
            ...reviewData,
            updatedAt: new Date()
        });
        
        // Refresh user reviews to show the updated review
        fetchUserReviews(false);
    };

    const deleteReview = async (reviewId) => {
        if (!user) throw new Error('User must be authenticated');
        
        const reviewRef = doc(db, 'reviews', reviewId);
        await deleteDoc(reviewRef);
        
        // Refresh user reviews to remove the deleted review
        fetchUserReviews(false);
    };

    const checkExistingReview = async (productId) => {
        if (!user) return null;
        
        const reviewsRef = collection(db, 'reviews');
        const q = query(
            reviewsRef, 
            where('user', '==', user.uid),
            where('productId', '==', productId)
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty ? null : querySnapshot.docs[0].data();
    };

    const getProductReviews = (productId) => {
        return Object.values(reviews).filter(review => review.productId === productId);
    };

    const getUserReviews = (userId = user?.uid) => {
        if (!userId) return [];
        return Object.values(reviews).filter(review => review.user === userId);
    };

    const getProductAverageRating = (productId) => {
        const productReviews = getProductReviews(productId);
        if (productReviews.length === 0) return 0;
        
        const total = productReviews.reduce((sum, review) => sum + review.rating, 0);
        return total / productReviews.length;
    };

    return {
        reviews,
        loading,
        addReview,
        updateReview,
        deleteReview,
        checkExistingReview,
        getProductReviews,
        getUserReviews,
        getProductAverageRating,
        
        // New user-specific review functionality
        userReviews,
        userReviewsLoading,
        userReviewsLoadingMore,
        userReviewsHasMore,
        loadMoreUserReviews,
        refreshUserReviews: () => fetchUserReviews(false)
    };
};

export default useReviewFetcher;