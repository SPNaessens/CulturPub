import { useFonts } from 'expo-font';

const FontLoader = ({ children }) => {
  const [fontsLoaded] = useFonts({
    'poppinsBold': require('../assets/fonts/Poppins-Bold.ttf'),
    'poppins': require('../assets/fonts/Poppins-Regular.ttf')
  });

  return fontsLoaded ? children : null;
};

export default FontLoader;