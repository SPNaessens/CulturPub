import * as React from 'react';
import MainContainer from './navigation/MainContainer';
import FontLoader from './navigation/FontLoader'
import PushNotificationHandler from './navigation/PushNotificationHandler'
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from "react-native";

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PushNotificationHandler />
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
      <FontLoader>
        <MainContainer />
      </FontLoader>
    </GestureHandlerRootView>
  );
}

export default App;