import React,{ useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, TouchableOpacity, Image} from 'react-native';
import { TabView, TabBar } from 'react-native-tab-view';
import {query, where, collection, onSnapshot, doc, getDoc, getDocs} from 'firebase/firestore';
import { FIRESTORE_DB, auth } from '../../firebaseConfig';
import { Card} from 'react-native-paper';
import nothing from '../../img/nothing.png';
import Icon from 'react-native-vector-icons/Ionicons';

const HomeScreen = ({ navigation}) => {
  const [events, setEvents] = useState([]);
  const [ organisedEvents, setOrganisedEvents ] = useState([]);
  const [regedEvents, setRegedEvents] = useState([]);
  const [userProfileData, setUserProfileData] = useState(null);

  const [index, setIndex] = React.useState(0);
  const [routes] = React.useState([
    { key: 'first', title: 'Tickets' },
    { key: 'second', title: 'Organised' },
  ]);

  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return (
          <ScrollView style={{paddingTop: 8}}>
            {regedEvents.length > 0 ? (
              regedEvents.map((event) => renderRegedEvent({ RegedItem: event }))
            ) : (
              <Card style={{...styles.card, padding: 16, width: 300}}>
              <Text style={styles.h3Bold}>Not attending any events yet!</Text>
              <Image source={nothing} style={{height: 200, width: 200}}/>
            </Card>
            )}
            <View style={{height: 200}}></View>
          </ScrollView>
        );
      case 'second':
        case 'second':
          return (
            <View>
              <ScrollView style={{ paddingTop: 8}}>
              {organisedEvents.length > 0 ? (
                organisedEvents.map((event) => renderOrganisedEvent({ organisedItem: event }))
              ) : (
                <Card style={{...styles.card, padding: 16, width: 300}}>
                <Text style={styles.h3Bold}>No organised events yet!</Text>
                <Image source={nothing} style={{height: 200, width: 200}}/>
              </Card>
              )}
              <View style={{height: 200}}></View>
            </ScrollView>
            </View>
          );
      default:
        return null;
    }
  };

  const getRegedEvents = async () => {
    try {
      const regedEventIds = userProfileData.regedEvents || [];
      const regedEvents = [];

      for (const eventId of regedEventIds) {
        const eventRef = doc(FIRESTORE_DB, 'events', eventId);
        const eventSnapshot = await getDoc(eventRef);
        if (eventSnapshot.exists()) {
          regedEvents.push({
            id: eventId,
            ...eventSnapshot.data(),
          });
        }
      }

      setRegedEvents(regedEvents);
    } catch (error) {
      console.error('Error fetching registered events:', error);
    }
  };

  const updateOrganisedEvents = async () => {
    const userId = auth.currentUser?.uid;
    const q = query(
      collection(FIRESTORE_DB, 'events'),
      where('userUid', '==', userId)
    );

    try {
      const querySnapshot = await getDocs(q);
      const userOrganisedEvents = [];
      querySnapshot.forEach((doc) => {
        userOrganisedEvents.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setOrganisedEvents(userOrganisedEvents);
    } catch (error) {
      console.error('Error fetching organised events:', error);
    }
  };

  useEffect(() => {
    const getProfileData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const userProfileRef = doc(FIRESTORE_DB, 'userProfile', userId);
          const userProfileSnapshot = await getDoc(userProfileRef);
          if (userProfileSnapshot.exists()) {
            const userProfileData = userProfileSnapshot.data();
            setUserProfileData(userProfileData);
          }
        }
      } catch (error) {
        console.error('Error fetching user profile data:', error);
      }
    };

    getProfileData();
  }, [userProfileData]);

  const toEventLanding = (navigation, eventData, regedEvents, isEventRegistered) => {
    navigation.navigate('EventLanding', { eventData, regedEvents, isEventRegistered });
  };
  
const TruncatedText = ({ text, maxLength }) => {
  if (text.length <= maxLength) {
    return <Text style={styles.s} variant="bodyMedium">{text}</Text>;
  }
  const truncatedText = text.slice(0, maxLength) + '...';
  return <Text style={styles.s} variant="bodyMedium">{truncatedText}</Text>;
};

useEffect(() => {
  if (userProfileData) {
    const eventRef = collection(FIRESTORE_DB, 'events');
    const eventSubscriber = onSnapshot(eventRef, {
      next: (snapshot) => {
        const events = [];
        snapshot.docs.forEach((doc) => {
          events.push({
            id: doc.id,
            ...doc.data(),
          });
        });
        setEvents(events);
      },
    });

    getRegedEvents();
    updateOrganisedEvents();

    return () => {
      eventSubscriber();
    };
  }
}, [userProfileData]);


  const renderOrganisedEvent = ({ organisedItem }) => {
    const navigateToEventLanding = () => {
      const eventId = organisedItem.id;
      const originalEvent = events.find(event => event.id === eventId);
      
      if (originalEvent) {
        toEventLanding(navigation, originalEvent, organisedEvents);
      } else {
      }
    };
  
    if (!organisedItem) {
      return null; 
    }
    return (
      <View key={organisedItem.id}>
        <Card style={styles.regCard} onPress={navigateToEventLanding}>
          <Text style={styles.h3Bold}>{organisedItem.title}</Text>
            <Text style={styles.p} numberOfLines={1}>{`${organisedItem.date} • ${organisedItem.location}`}</Text>
          <Card.Content>
            <TruncatedText style={styles.p} text={organisedItem.eventDescription} maxLength={125} />
          </Card.Content>
        </Card>

      </View>
    );
  };

  const renderRegedEvent = ({ RegedItem }) => {
    const navigateToEventLanding = () => {
      const eventId = RegedItem.id;
      const originalEvent = events.find(event => event.id === eventId);
      
      if (originalEvent) {
        const isEventRegistered = regedEvents.some(id => id === eventId);
        toEventLanding(navigation, originalEvent, regedEvents, isEventRegistered);
      }
    };
  
    return (
      <View key={RegedItem.id}>
        <Card style={styles.regCard} onPress={navigateToEventLanding}>
          <Text style={styles.h3Bold}  >{RegedItem.title}</Text>
          <Text numberOfLines={1} style={styles.p} >{`${RegedItem.date} • ${RegedItem.location}`}</Text>
          <Card.Content><Text style={styles.s} numberOfLines={3}>{RegedItem.eventDescription}</Text></Card.Content>
        </Card>
      </View>
    );
  };
  
  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
    <View style={styles.headerContainer}>
      <Text style={styles.h1Bold}>Your Events</Text>
    </View>
    <TabView
    navigationState={{ index, routes }}
    renderScene={renderScene}
    onIndexChange={setIndex}
    renderTabBar={props =>
      <TabBar
        {...props}
        indicatorStyle={{ backgroundColor: '#554eeb' }}
        style={{ backgroundColor: '#121212' }}
        labelStyle={{ color: '#fff', fontFamily: 'poppinsBold' }}
      />
    }
    />
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    color: '#fff',
    padding: 20,
    fontSize: 34,
  },  
  card: {
    marginBottom: 10,
    marginHorizontal: 8,
    backgroundColor: '#2B2930'
  },
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 16,
    width: '60%',
    height: '25%',
  },
  btnP: {
    color: '#fff',
    padding: 10,
    fontSize: 16,
    fontFamily: 'poppins',
  },
  headerContainer: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    paddingTop: 24,
    width: '100%',
    zIndex: 1000
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 1,
    paddingHorizontal: 16,
    backgroundColor: '#554eeb',
    marginVertical: 16,
    width: '40%',
    marginHorizontal: 8,
    zIndex: 20
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#dfdfdf',
    marginVertical: 8,
    marginHorizontal: 8
  },
  headerContain: {
    flexDirection: 'row',
    alignItems: 'center', 
  },
  h1Bold: {
    color: '#fff',
    paddingTop: 8,
    paddingLeft: 8,
    fontSize: 33,
    fontFamily: 'poppinsBold',
    letterSpacing: -1.2
  },
  h2Bold: {
    color: '#CAC4D0',
    paddingHorizontal: 16,
    fontSize: 26,
    fontFamily: 'poppinsBold',
    letterSpacing: -1.2
  },
  h3Bold: {
    color: '#fff',
    fontSize: 20.4,
    fontFamily: 'poppinsBold',
    paddingHorizontal: 12,
    paddingTop: 8
  },
  h3: {
    color: '#fff',
    fontSize: 20.4,
    fontFamily: 'poppins',
    paddingHorizontal: 12,
    paddingTop: 8,
    marginBottom: 8
  },
  p: {
    color: '#CAC4D0',
    fontSize: 16,
    fontFamily: 'poppins',
    paddingHorizontal:14
  },
  s: {
    color: '#CAC4D0',
    fontSize: 12.6,
    fontFamily: 'poppins'
  },
  regCard: {
    marginBottom: 8,
    marginHorizontal: 8,
    backgroundColor: '#2B2930',
  },
});

export default HomeScreen