import { useCameraPermissions } from "expo-camera";
import ProductScanScreenRequestCameraPermission from "./request";
import ProductScanScreenTakePhoto from "./scan";
import { useEffect } from "react";

const ProductScanScreen = () => {
    const [permission, requestPermission] = useCameraPermissions();

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
            <ProductScanScreenRequestCameraPermission />
        );
    }

    return (
        <ProductScanScreenTakePhoto
        />
    );
}

export default ProductScanScreen;