import { useEffect, useState} from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image} from 'react-native';
import { FIRESTORE_DB, auth} from '../../firebaseConfig';
import {query, where, collection, onSnapshot, doc, updateDoc, getDoc} from 'firebase/firestore';
import nothing from '../../img/nothing.png';
import { Card } from 'react-native-paper';

export default function AlertsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  
  const markAsRead = async (item) => {
    try {
      const notificationDocRef = doc(FIRESTORE_DB, 'notifications', item.notificationId);
      await updateDoc(notificationDocRef, {
        read: true,
      });
    } catch (error) {
    }
  };

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    const notificationsRef = collection(FIRESTORE_DB, 'notifications');
  
    if (userId) {
      
      const userNotificationsQuery = query(
        notificationsRef,
        where('recipientUserId', '==', userId) 
      );

      const unsubscribe = onSnapshot(userNotificationsQuery, (querySnapshot) => {
        const fetchedNotifications = [];
  
        querySnapshot.forEach((doc) => {
          const notificationData = doc.data();
          if (notificationData.recipientUserId === userId) {
            fetchedNotifications.push({
              notificationId: doc.id,
              ...notificationData,
            });
          }
        });
  
        setNotifications(fetchedNotifications.reverse());
      });
      return () => {
        unsubscribe();
      };

    }
  }, []);



  const toEventLanding = async (item) => {
    try {
      const eventDataRef = doc(FIRESTORE_DB, 'events', item.eventId);
      const eventDataSnapshot = await getDoc(eventDataRef);
  
      if (eventDataSnapshot.exists()) {
        const eventData = eventDataSnapshot.data();
        navigation.navigate('EventLanding', { eventData });
        await markAsRead(item);
      } else {
        alert('This event is no longer available.');
      }
      
    } catch (error) {
    }
  };

  return (
<View style={styles.container}>
  <Text style={styles.h1Bold}>Notifications</Text>
  {notifications.length === 0 ? (
        <Card style={{...styles.card, padding: 16, width: 300}}>
        <Text style={styles.h3Bold}>No notifications yet!</Text>
        <Image source={nothing} style={{height: 200, width: 200}}/>
      </Card>
  ) : (
    <FlatList
      data={notifications}
      scrollEnabled={true}
      keyExtractor={(item) => item.notificationId}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => toEventLanding(item)}
          style={[
            styles.listItem,
            { backgroundColor: item.read ? '#121212' : '#2B2930' },
          ]}
        >
          <View style={styles.alertMessage}>
            <Text style={styles.p}>{item.message}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  )}
</View>

  );
}

const styles = StyleSheet.create({
  alertMessage: {
    paddingHorizontal: 16, 
    paddingVertical: 16, 
    borderBottomColor: '#dfdfdf'
  },
  container: {
    backgroundColor: '#121212',
    height: '100%',
    paddingTop: 40,
    paddingHorizontal: 8,
    position: 'relative',
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0782F9',
    width: '60%',
    marginTop: 40,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  topNav: {
    backgroundColor: '#22222E',
    color: '#fff',
    height: 100,
    width: '100%',
    position: 'absolute',
    top: 30,
    left: 0,
    padding: 10,
  },
  h3Bold: {
    color: '#fff',
    fontSize: 20.4,
    marginTop: 4,
    fontFamily: 'poppinsBold',
  },
  h2Bold: {
    color: '#2c2c2c',
    fontSize: 26,
    fontFamily: 'poppinsBold',
  },
  h1Bold: {
    color: '#fff',
    paddingTop: 8,
    paddingLeft: 8,
    fontSize: 33,
    fontFamily: 'poppinsBold',
    letterSpacing: -1.2
  },
  h2: {
    color: '#2c2c2c',
    fontSize: 26,
    fontFamily: 'poppins',
  },
  p: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'poppins',
  },
  s: {
    color: '#8193A2',
    fontSize: 12.6,
    fontFamily: 'poppins',
  },
  card: {
    marginBottom: 10,
    marginHorizontal: 8,
    backgroundColor: '#2B2930'
  },
});
