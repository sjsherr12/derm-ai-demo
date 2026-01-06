import { useRef } from 'react';
import { Animated } from 'react-native';

const useScalePressAnimation = ({
  minScale = 0.95,
  maxScale = 1,
  duration = 150,
  useNativeDriver = true,
} = {}) => {
  const scaleValue = useRef(new Animated.Value(maxScale)).current;

  const handlePressIn = () => {
    Animated.timing(scaleValue, {
      toValue: minScale,
      duration,
      useNativeDriver,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scaleValue, {
      toValue: maxScale,
      duration,
      useNativeDriver,
    }).start();
  };

  return {
    scale: scaleValue,
    handlePressIn,
    handlePressOut,
  };
};

export default useScalePressAnimation;