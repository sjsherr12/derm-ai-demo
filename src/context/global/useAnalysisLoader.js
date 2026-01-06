import { collection, query, orderBy, limit, getDocs, doc, getDoc, where } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { db, storage } from 'services/firebase/firebase';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { useCallback } from 'react';
// import { getProductInfo } from '../../utils/products'; // DEPRECATED - using local data now

// Removed scan types - now using simple 3-day cooldown system

const useAnalysisLoader = () => {
    const { user } = useAuth();
    const { 
        setDiagnoses, 
        setMostRecentDiagnosis, 
        setSeverityTrends,
        setAnalysisStats,
        setAnalysisLoading,
        setRoutineRecommendations,
        setScanRecommendations,
        setRecommendationsLoading,
        products,
        getLocalProductById
    } = useData();

    // Helper function to get facial scan URLs from Firebase Storage (3 images)
    const getFacialScanUrls = async (userId, diagnosisId) => {
        try {
            const imageTypes = ['front', 'left', 'right'];
            const urls = {};
            
            for (const imageType of imageTypes) {
                try {
                    const facialScanRef = ref(storage, `users/${userId}/diagnoses/${diagnosisId}/${imageType}`);
                    urls[imageType] = await getDownloadURL(facialScanRef);
                } catch (error) {
                    console.error(`Error fetching ${imageType} scan URL for diagnosis ${diagnosisId}:`, error);
                    urls[imageType] = null;
                }
            }
            
            return urls;
        } catch (error) {
            console.error(`Error fetching facial scan URLs for diagnosis ${diagnosisId}:`, error);
            return { front: null, left: null, right: null };
        }
    };

    // Helper function to append facial scan URLs to diagnosis data
    const appendFacialScanUrls = async (diagnoses) => {
        if (!user || !diagnoses.length) return diagnoses;
        
        const diagnosesWithUrls = await Promise.all(
            diagnoses.map(async (diagnosis) => {
                // Get 3-image format URLs
                const facialScanUrls = await getFacialScanUrls(user.uid, diagnosis.id);
                
                return {
                    ...diagnosis,
                    facialScans: facialScanUrls
                };
            })
        );
        
        return diagnosesWithUrls;
    };

    // No longer needed - all products are pre-cached in global state

    // Fetch most recent diagnoses (limit 5)
    const fetchRecentDiagnoses = async () => {
        if (!user) return;

        try {
            setAnalysisLoading(true);
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(
                diagnosesRef,
                orderBy('createdAt', 'desc'),
            );
            
            const snapshot = await getDocs(q);
            console.log('📊 useAnalysisLoader (fetchRecentDiagnoses): Fetched', snapshot.docs.length, 'recent diagnoses from Firebase');
            const diagnoses = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() // Convert timestamp
            }));

            // Append facial scan URLs
            const diagnosesWithUrls = await appendFacialScanUrls(diagnoses);

            setDiagnoses(diagnosesWithUrls);
            if (diagnosesWithUrls.length > 0) {
                setMostRecentDiagnosis(diagnosesWithUrls[0]);
            }

            return diagnosesWithUrls;
        } catch (error) {
            console.error('Error fetching recent diagnoses:', error);
            return [];
        } finally {
            setAnalysisLoading(false);
        }
    };

    // Fetch most recent diagnosis only
    const fetchMostRecentDiagnosis = async () => {
        if (!user) return null;

        try {
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(
                diagnosesRef,
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const diagnosis = {
                id: snapshot.docs[0].id,
                ...snapshot.docs[0].data(),
                createdAt: snapshot.docs[0].data().createdAt?.toDate()
            };

            // Append facial scan URL
            const diagnosesWithUrls = await appendFacialScanUrls([diagnosis]);
            const diagnosisWithUrl = diagnosesWithUrls[0];

            setMostRecentDiagnosis(diagnosisWithUrl);
            return diagnosisWithUrl;
        } catch (error) {
            console.error('Error fetching most recent diagnosis:', error);
            return null;
        }
    };

    // Fetch severity trends over time for analysis charts
    const fetchSeverityTrends = async (limitCount = 10) => {
        if (!user) return;

        try {
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(
                diagnosesRef,
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            
            const snapshot = await getDocs(q);
            const trends = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    date: data.createdAt?.toDate(),
                    severities: data.severities
                };
            }).reverse(); // Reverse to get chronological order for charts

            setSeverityTrends(trends);
            return trends;
        } catch (error) {
            console.error('Error fetching severity trends:', error);
            return [];
        }
    };

    // Fetch all scans (no longer filtering by scan type)
    const fetchAllScans = async (limitCount = 5) => {
        if (!user) return;

        try {
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(
                diagnosesRef,
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            
            const snapshot = await getDocs(q);
            const allScans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            // Append facial scan URLs
            const allScansWithUrls = await appendFacialScanUrls(allScans);
            return allScansWithUrls;
        } catch (error) {
            console.error('Error fetching scans:', error);
            return [];
        }
    };

    // Calculate analysis statistics
    const calculateAnalysisStats = async () => {
        if (!user) return;

        try {
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(diagnosesRef, orderBy('createdAt', 'desc'));
            
            const snapshot = await getDocs(q);
            console.log('📈 useAnalysisLoader (calculateAnalysisStats): Fetched', snapshot.docs.length, 'total diagnoses for stats from Firebase');
            const allDiagnoses = snapshot.docs.map(doc => ({
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));

            const stats = {
                totalScans: allDiagnoses.length,
                firstScanDate: allDiagnoses.length > 0 ? allDiagnoses[allDiagnoses.length - 1].createdAt : null,
                lastScanDate: allDiagnoses.length > 0 ? allDiagnoses[0].createdAt : null,
                hasRoutineRecommendations: allDiagnoses.some(d => 
                    Array.isArray(d.routineRecommendations) && d.routineRecommendations.length > 0
                ),
                hasScanRecommendations: allDiagnoses.some(d => d.scanRecommendations && d.scanRecommendations.length > 0)
            };

            // Calculate improvement trends
            if (allDiagnoses.length >= 2) {
                const latest = allDiagnoses[0];
                const previous = allDiagnoses[1];
                
                const improvements = {};
                Object.keys(latest.severities || {}).forEach(concern => {
                    const currentSeverity = latest.severities[concern] || 0;
                    const previousSeverity = previous.severities[concern] || 0;
                    improvements[concern] = currentSeverity - previousSeverity; // Positive = improvement (higher scores are better)
                });
                
                stats.recentImprovements = improvements;
                stats.overallImprovement = improvements.overall || 0;
            }

            setAnalysisStats(stats);
            return stats;
        } catch (error) {
            console.error('Error calculating analysis stats:', error);
            return null;
        }
    };

    // Get scan eligibility (check if user can scan - 3-day cooldown system)
    const checkScanEligibility = useCallback(async () => {
        if (!user) return { canScan: false, message: 'User not authenticated' };

        try {
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(diagnosesRef, orderBy('createdAt', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            
            // First time user - no scans yet
            if (snapshot.empty) {
                return { 
                    canScan: true, 
                    isFirstScan: true,
                    message: 'Ready for your first scan!' 
                };
            }

            const mostRecentScan = snapshot.docs[0].data();
            const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
            const mostRecentScanDate = mostRecentScan.createdAt?.toDate();
            
            if (!mostRecentScanDate) {
                return { 
                    canScan: true, 
                    isFirstScan: false,
                    message: 'Ready to scan!' 
                };
            }

            // Check if most recent scan was more than 3 days ago
            if (mostRecentScanDate <= threeDaysAgo) {
                return { 
                    canScan: true, 
                    isFirstScan: false,
                    message: 'Ready for your next scan!' 
                };
            } else {
                const nextScanDate = new Date(mostRecentScanDate.getTime() + 3 * 24 * 60 * 60 * 1000);
                const daysRemaining = Math.ceil((nextScanDate - new Date()) / (24 * 60 * 60 * 1000));
                return { 
                    canScan: false, 
                    isFirstScan: false,
                    message: `You can scan again on ${nextScanDate.toLocaleDateString()}. Please wait ${daysRemaining} more ${daysRemaining === 1 ? 'day' : 'days'}.`,
                    nextScanDate,
                    daysRemaining
                };
            }
        } catch (error) {
            console.error('Error checking scan eligibility:', error);
            return { 
                canScan: false, 
                message: 'Error checking scan availability. Please try again.' 
            };
        }
    }, [user]);

    // Fetch and set routine recommendations
    const loadRoutineRecommendations = async () => {
        if (!user) return;
        
        try {
            setRecommendationsLoading(true);
            const recommendations = await fetchMostRecentRoutineRecommendations();
            setRoutineRecommendations(recommendations);
            
            // Fetch and cache products for the recommendations
            if (Array.isArray(recommendations) && recommendations.length > 0) {
                // Products are already pre-cached, no individual fetching needed
            }
            
            return recommendations;
        } catch (error) {
            console.error('Error loading routine recommendations:', error);
            return null;
        } finally {
            setRecommendationsLoading(false);
        }
    };

    // Fetch and set scan recommendations
    const loadScanRecommendations = async () => {
        if (!user) return;
        
        try {
            setRecommendationsLoading(true);
            const recommendations = await fetchMostRecentScanRecommendations();
            setScanRecommendations(recommendations);
            
            // Products are already pre-cached, no individual fetching needed
            
            return recommendations;
        } catch (error) {
            console.error('Error loading scan recommendations:', error);
            return null;
        } finally {
            setRecommendationsLoading(false);
        }
    };

    // Load all recommendations
    const loadAllRecommendations = async () => {
        if (!user) return;
        
        try {
            setRecommendationsLoading(true);
            await Promise.all([
                loadRoutineRecommendations(),
                loadScanRecommendations()
            ]);
        } catch (error) {
            console.error('Error loading all recommendations:', error);
        } finally {
            setRecommendationsLoading(false);
        }
    };

    // Refresh all analysis data
    const refreshAnalysisData = useCallback(async () => {
        if (!user) return;

        try {
            setAnalysisLoading(true);
            await Promise.all([
                fetchRecentDiagnoses(),
                fetchSeverityTrends(),
                calculateAnalysisStats(),
                loadAllRecommendations()
            ]);
        } catch (error) {
            console.error('Error refreshing analysis data:', error);
        } finally {
            setAnalysisLoading(false);
        }
    }, [user, setAnalysisLoading, setDiagnoses, setMostRecentDiagnosis, setSeverityTrends, setAnalysisStats]);

    // Fetch most recent routine recommendations
    const fetchMostRecentRoutineRecommendations = async () => {
        if (!user) return null;

        try {
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(
                diagnosesRef,
                where('routineRecommendations', '!=', null),
                orderBy('routineRecommendations'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const diagnosis = snapshot.docs[0].data();
            return diagnosis.routineRecommendations || null;
        } catch (error) {
            console.error('Error fetching routine recommendations:', error);
            return null;
        }
    };

    // Fetch most recent scan recommendations
    const fetchMostRecentScanRecommendations = async () => {
        if (!user) return null;

        try {
            const diagnosesRef = collection(db, `users/${user.uid}/diagnoses`);
            const q = query(
                diagnosesRef,
                where('scanRecommendations', '!=', null),
                orderBy('scanRecommendations'),
                orderBy('createdAt', 'desc'),
                limit(1)
            );
            
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const diagnosis = snapshot.docs[0].data();
            return diagnosis.scanRecommendations || null;
        } catch (error) {
            console.error('Error fetching scan recommendations:', error);
            return null;
        }
    };

    return {
        fetchRecentDiagnoses,
        fetchMostRecentDiagnosis,
        fetchSeverityTrends,
        fetchAllScans,
        calculateAnalysisStats,
        checkScanEligibility,
        refreshAnalysisData,
        fetchMostRecentRoutineRecommendations,
        fetchMostRecentScanRecommendations,
        loadRoutineRecommendations,
        loadScanRecommendations,
        loadAllRecommendations
    };
};

export default useAnalysisLoader;