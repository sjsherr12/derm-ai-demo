import { useRoute } from "@react-navigation/native";
import { useCameraPermissions } from "expo-camera";
import { memo, useEffect } from "react";
import ScanScreenRequestCameraPermission from "./request";
import ScanScreenTakePhoto from "./scan";

const ScanScreen = () => {
    const route = useRoute();
    const [permission, requestPermission] = useCameraPermissions();

    const {isSignUp = false} = route?.params || {};

    useEffect(() => {
        if (!permission?.granted && permission?.canAskAgain) {
            requestPermission();
        }
    }, [permission]);

    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
            <ScanScreenRequestCameraPermission />
        );
    }

    return (
        <ScanScreenTakePhoto
            isSignUp={isSignUp}
        />
    );
};

export default ScanScreen;