import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { FIRESTORE_DB, auth} from '../firebaseConfig';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });


const PushNotificationHandler = () => {
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    const projectId = "6e41445c-7418-4423-89e0-c1e5ad43ebad";

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
          setNotification(notification);
        });
        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        });
    
        return () => {
          Notifications.removeNotificationSubscription(notificationListener.current);
          Notifications.removeNotificationSubscription(responseListener.current);
        };
      }, []);

      async function registerForPushNotificationsAsync() {
        let token;
    
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
          });
        }
    
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
          }
          token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
          updateProfileWithPushToken(token);
        } else {
          alert('Must use physical device for Push Notifications');
        }
    
        return token;
      }
    
      async function updateProfileWithPushToken(token) {
        try {
          const userUid = auth.currentUser ? auth.currentUser.uid : null;
          const profileRef = doc(FIRESTORE_DB, `userProfile/${userUid}`);
          if ( userUid !== null ) {await updateDoc(profileRef, { expoPushToken: token || 'no token' });}
        } catch (error) {
        }
      }
}

export default PushNotificationHandler;