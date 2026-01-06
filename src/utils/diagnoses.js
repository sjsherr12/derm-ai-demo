import { doc, deleteDoc } from 'firebase/firestore';
import { db } from 'services/firebase/firebase';

export const deleteDiagnosis = async (userId, diagnosisId) => {
    try {
        await deleteDoc(
            doc(db, `users/${userId}/diagnoses`, diagnosisId)
        );
    } catch (error) {
        console.error('Error deleting diagnosis:', error);
        throw error;
    }
};
