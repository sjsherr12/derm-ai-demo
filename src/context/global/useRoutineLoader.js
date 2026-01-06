import { useData } from './DataContext';

const useRoutineLoader = () => {
    const { fetchRoutineProducts } = useData();

    return { fetchRoutineProducts };
};

export default useRoutineLoader;
