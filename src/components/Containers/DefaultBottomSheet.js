import { View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { BottomSheetModalProvider, BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } = require("@gorhom/bottom-sheet");
const { useRef, useCallback, useEffect } = require("react");

const DefaultBottomSheet = ({
    isOpen,
    onClose,
    snapPoints,
    defaultSnapIndex = 0,
    style,
    children,
    header
}) => {
    const insets = useSafeAreaInsets();
    const bottomSheetRef = useRef(null);
    const screenHeight = Dimensions.get('window').height;
    const maxHeight = screenHeight * 0.9;
    const Container = snapPoints ? BottomSheetView : BottomSheetScrollView;

    const handleOpen = useCallback(() => {
        bottomSheetRef.current?.present();
    }, []);

    const handleClose = useCallback(() => {
        bottomSheetRef.current?.dismiss();
        onClose(); // ensure onClose is called when programmatically closed
    }, [onClose]);

    const handleSheetChanges = useCallback((index) => {
        if (index === -1) {
            onClose(); // only notify parent when fully closed
        }
    }, [onClose]);

    const renderBackdrop = useCallback(
        (props) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={defaultSnapIndex}
                onPress={handleClose}
                style={{
                    zIndex:1,
                    backgroundColor:'rgba(0,0,0,.5)',
                    ...style?.backdrop,
                }}
            />
        ),
        [handleClose, defaultSnapIndex]
    );

    useEffect(() => {
        if (isOpen) {
            handleOpen();
        } else {
            handleClose();
        }
    }, [isOpen, handleOpen, handleClose]);

    return (
        <BottomSheetModalProvider
        >
            <BottomSheetModal
                ref={bottomSheetRef}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                enableDynamicSizing={snapPoints ? false : true}
                maxDynamicContentSize={maxHeight}
                {...(snapPoints && {snapPoints:snapPoints})}
                index={defaultSnapIndex}
                backgroundStyle={{
                    borderRadius:16,
                    ...style?.background,
                }}
                handleIndicatorStyle={{
                    backgroundColor:'#fff', // just get rid by default.
                    ...style?.handleIndicator,
                }}
                handleComponent={header}
                containerStyle={{
                    zIndex: 9999,
                    elevation: 9999,
                }}
            >
                <Container
                    style={{
                        flex:1,
                        height:'100%',
                        ...style?.container,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    <View
                        style={{
                            flex:1,
                            paddingBottom:insets.bottom,
                        }}
                    >
                        {children}
                    </View>
                </Container>
            </BottomSheetModal>
        </BottomSheetModalProvider>
    );
};

export default DefaultBottomSheet;