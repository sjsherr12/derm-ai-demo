import { addDoc, collection, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from 'services/firebase/firebase';

export const addRoutineProduct = async (userId, routineData) => {
    try {
        const docRef = await addDoc(
            collection(db, `users/${userId}/routineProducts`),
            {
                ...routineData,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        );
        
        return docRef.id;
    } catch (error) {
        console.error('Error adding routine product:', error);
        throw error;
    }
};

export const updateRoutineProduct = async (userId, routineItemId, updates) => {
    try {
        await updateDoc(
            doc(db, `users/${userId}/routineProducts`, routineItemId),
            {
                ...updates,
                updatedAt: new Date(),
            }
        );
    } catch (error) {
        console.error('Error updating routine product:', error);
        throw error;
    }
};

export const deleteRoutineProduct = async (userId, routineItemId) => {
    try {
        await deleteDoc(
            doc(db, `users/${userId}/routineProducts`, routineItemId)
        );
    } catch (error) {
        console.error('Error deleting routine product:', error);
        throw error;
    }
};