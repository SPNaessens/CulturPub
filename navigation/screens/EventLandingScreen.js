import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Modal, Pressable, FlatList, Linking } from 'react-native';
import { FIRESTORE_DB, auth } from '../../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import customMap from '../../customMap.json'
import nothing from '../../img/nothing.png';
import { Card } from 'react-native-paper';

export default function EventLandingPage({navigation}) {
  const route = useRoute();
  const { eventData} = route.params;
  const [ regModal, setRegModal ] = useState(false);
  const [ regModalCancel, setRegModalCancel ] = useState(false);
  const [regedEvents, setRegedEvents] = useState([]);
  let [ isEventRegistered, setIsEventRegistered ] = useState(false);
  const [guestListVisible, setGuestListVisible ] = useState(false);
  const [ guestListData, setGuestListData ] = useState([]);
  const isUserOrganiser = eventData.userUid === auth.currentUser.uid;
  const isEventFull = eventData.isEventFull;
  const isOpenCall = eventData.isOpenCallEnabled;

  const fetchUserProfile = async (uid) => {
    try {
      const profileRef = doc(FIRESTORE_DB, 'userProfile', uid);
      const profileSnapshot = await getDoc(profileRef);
  
      if (profileSnapshot.exists()) {
        const userProfile = profileSnapshot.data();
        return userProfile;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const navigateToProfile = async (uid) => {
    const userProfile = await fetchUserProfile(uid);
    if (userProfile) {
      navigation.navigate('profileLanding', { userProfile });
    }
  };

  const editEvent = (item) => {
    navigation.navigate('EditEvent', {
      eventId: item.id,
      event: item.title,
      eventDescription: item.eventDescription,
      image: item.image,
      oldDate: item.date,
      oldTime: item.time,
      location: item.location,
      coordinates: item.coordinates,
      username: item.userName,
      tags: item.tags,
      attendeesLimit: item.attendeesLimit,
      attendees: item.attendees,

      onUpdate: async (updatedEvent) => {
        const eventRef = doc(FIRESTORE_DB, `events/${item.id}`);
        await updateDoc(eventRef, updatedEvent);
        sheet.current.close();
      },
    });
  };

  const getGuestList = async () => {
    const listRef = doc(FIRESTORE_DB, 'events', eventData.id);
    const guestListSnapshot = await getDoc(listRef);
    if (guestListSnapshot.exists()) {
      const guestListData = guestListSnapshot.data();
      return guestListData.guestList || [];
    }
  };  

  const getRegedEvents = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userProfileRef = doc(FIRESTORE_DB, 'userProfile', userId);
        const userProfileSnapshot = await getDoc(userProfileRef);
        if (userProfileSnapshot.exists()) {
          const userProfileData = userProfileSnapshot.data();
          return userProfileData.regedEvents || [];
        }
      }
      return [];
    } catch (error) {
      return [];
    }
  };
  
  useEffect(() => {
    async function fetchData() {
      const guestlist = await getGuestList();
      const registeredEvents = await getRegedEvents();
      setGuestListData(guestlist)
      setRegedEvents(registeredEvents);
      setIsEventRegistered(registeredEvents.includes(eventData.id));
      checkEventFullStatus(eventData.id);
    }
    fetchData();
  }, [eventData.id]);

  const deleteRegedEvent = async (eventId) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userProfileRef = doc(FIRESTORE_DB, 'userProfile', userId);
        const userProfileSnapshot = await getDoc(userProfileRef);
        if (userProfileSnapshot.exists()) {
          const userProfileData = userProfileSnapshot.data();
          const eventRef = doc(FIRESTORE_DB, 'events', eventId);
          const eventSnapshot = await getDoc(eventRef);
  
          if (eventSnapshot.exists()) {
            const eventAttendeesData = eventSnapshot.data();
            const updatedAttendees = eventAttendeesData.attendees - 1;
            const attendeesLimitData = eventAttendeesData.attendeesLimit;
            await updateDoc(eventRef, { attendees: updatedAttendees });
            const updatedRegedEvents = userProfileData.regedEvents.filter(id => id !== eventId);
            await updateDoc(userProfileRef, { regedEvents: updatedRegedEvents });

            checkEventFullStatus(eventId);
            setRegModalCancel(false);
            setIsEventRegistered(false);
          }
        }
      }
    } catch (error) {
    }
  };

  const checkEventFullStatus = async (eventId) => {
    try {
      const eventRef = doc(FIRESTORE_DB, 'events', eventId);
      const eventSnapshot = await getDoc(eventRef);
      if (eventSnapshot.exists()) {
        const eventData = eventSnapshot.data();
        const attendeesLimit = eventData.attendeesLimit || 0;
        const currentAttendees = eventData.attendees || 0;

        if (attendeesLimit > 0 && currentAttendees < attendeesLimit) {
          await updateDoc(eventRef, { isEventFull: false });
        } else if (attendeesLimit > 0 && currentAttendees >= attendeesLimit) {
          await updateDoc(eventRef, { isEventFull: true });
        }
      }
    } catch (error) {
    }
  };
   
  const handleRegister = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userId = user.uid;
        const userProfileRef = doc(FIRESTORE_DB, 'userProfile', userId);
        const eventRef = doc(FIRESTORE_DB, 'events', eventData.id)
        const eventSnapshot = await getDoc(eventRef);
        const userProfileSnapshot = await getDoc(userProfileRef);
        if (userProfileSnapshot && eventSnapshot.exists()) {
          const userProfileData = userProfileSnapshot.data();
          const eventAttendeesData = eventSnapshot.data();
          const eventAttendees = eventAttendeesData.attendees;
          const updatedRegedEvents = userProfileData.regedEvents || [];
          const userNameForGL = userProfileData.userName;
          updatedRegedEvents.push(route.params.eventData.id);
          const guestList = eventAttendeesData.guestList || [];
          guestList.push(userNameForGL);
          await updateDoc(eventRef, { attendees: eventAttendees + 1, guestList: guestList });
          await updateDoc(userProfileRef, { regedEvents: updatedRegedEvents});
          checkEventFullStatus(eventData.id);
          setIsEventRegistered(true)
          setRegModal(false);
        }
      }
    } catch (error) {
    }
  };  

  return(
    <ScrollView>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconContainer} >
          <Ionicons style={styles.icon} name="arrow-back-outline" />
        </TouchableOpacity>
      <Image source={{ uri: eventData.image }} style={styles.image} />
      <View style={styles.container}>
        <Text style={styles.h3Bold}>{eventData.title}</Text>
        <Text style={styles.p}>{eventData.date} • {eventData.location}.</Text>

        <View style={styles.tagContainer}>
          {eventData.tags?.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.chipsItem}>
                <Text style={styles.pDark}>{tag}</Text>
              </TouchableOpacity>
            ))}
        </View>

        <Text style={styles.sBold}>Description </Text>
        <Text style={{...styles.s, marginBottom: 8}}>{eventData.eventDescription} </Text>

        <TouchableOpacity onPress={() => navigateToProfile(eventData.userUid)}>
        <Text style={styles.p}>Posted by {eventData.userName}</Text>
        </TouchableOpacity>
        
          <View style={styles.btnContainer}>
            {isUserOrganiser ? (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity style={styles.btn} onPress={() => setGuestListVisible(true)}>
                  <Text style={styles.btnP}>Guestlist</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => editEvent(eventData)}>
                  <Text style={styles.btnP}>Edit</Text>
                </TouchableOpacity>
              </View>
            ) : isEventRegistered ? (
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setRegModalCancel(true)}>
                <Text style={styles.btnP}>Cancel</Text>
              </TouchableOpacity>
            ) : isEventFull ? (
              <View style={styles.full}>
                <Text style={styles.p}>No tickets left!</Text>
              </View>
            ) : (
              <View style={{flexDirection: 'row'}}>
                <TouchableOpacity style={styles.btn} onPress={() => setRegModal(true)}>
                <Text style={styles.btnP}>Attend</Text>
              </TouchableOpacity>
              { isOpenCall ? (
                <TouchableOpacity style={styles.btnSecondary}   onPress={() => {
                  const organizerEmail = eventData.email || '';
                  
                  const subject = eventData.title;
              
                  const emailUrl = `mailto:${organizerEmail}?subject=${subject}`;
                  Linking.openURL(emailUrl);
                }}>
                <Text style={styles.p}>Apply</Text>
              </TouchableOpacity>
              ) : (null)}
              </View>
            )}
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Map', { eventDataCoordinates: eventData.coordinates || [] })} style={{ borderRadius: 16, height: 200, width: '100%', overflow: 'hidden', marginBottom: 100}}>
        
        {eventData.coordinates.lat !== null && eventData.coordinates.lng !== null && (
        <MapView 
          provider={PROVIDER_GOOGLE}
          style={styles.mapLanding}
          scrollEnabled={false}
          customMapStyle={customMap}
          API_KEY_HIDDEN="API_KEY_HIDDEN"
          initialRegion={{
            latitude: eventData.coordinates.lat,
            longitude: eventData.coordinates.lng,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        >
          <Marker coordinate={{
            latitude: eventData.coordinates.lat,
            longitude: eventData.coordinates.lng,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}/>
        </MapView>
)}
</TouchableOpacity>

      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={regModal}
        onRequestClose={() => {
          setRegModal(!regModal);
        }}>
          <View style={styles.centeredView}>
          <View style={styles.modal}>
              <Text style={{...styles.p, color: '#2c2c2c'}}>You are registering to attend {eventData.title} at {eventData.date}.</Text>
              <View style={{flexDirection:'row', position:'absolute', top: 150, right: 32}}>
                  <Pressable
                  onPress={() => setRegModal(!regModal)}>
                  <Text style={styles.warningText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={() => handleRegister()}>
                  <Text style={styles.confirmText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
        animationType="slide"
        transparent={true}
        visible={regModalCancel}
        onRequestClose={() => {
          setRegModal(!regModalCancel);
        }}>
          <View style={styles.centeredView}>
          <View style={styles.modal}>
              <Text style={{...styles.p, color: '#2c2c2c'}}>Do you want to cancel your registration for {eventData.title} at {eventData.date}?</Text>
              <View style={{flexDirection:'row', position:'absolute', top: 150, right: 32}}>
                  <Pressable
                  onPress={() => setRegModalCancel(!regModalCancel)}>
                  <Text style={styles.warningText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={() => deleteRegedEvent(eventData.id)}>
                  <Text style={styles.confirmText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
        visible={guestListVisible}
        transparent={false}
        onRequestClose={() => {
          setGuestListVisible(false);
        }}>

    <View style={{ height: '120%',paddingBottom: 200, backgroundColor: '#121212'}}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => setGuestListVisible(false)}>
          <Ionicons name="close" style={ {fontSize:32, color:'#fff', }}/>
        </TouchableOpacity>
      <Text style={styles.h2Bold}>Guestlist</Text>
      <FlatList
        data={guestListData}
        scrollEnabled={true}
        ListEmptyComponent={() => (
          <Card style={{...styles.card, padding: 16, width: 300}}>
            <Text style={styles.h3Bold}>No guests yet!</Text>
            <Image source={nothing} style={{height: 200, width: 200}}/>
          </Card>
        )}
        renderItem={({ item }) => (
          <View style={styles.guestListItem}>
            <Text style={styles.h3}>{item}</Text>
          </View>
        )}
/>

    </View>
        </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    card: {
    marginBottom: 10,
    marginHorizontal: 8,
    backgroundColor: '#2B2930'
  },
  guestListItem: {
  paddingHorizontal: 16, 
  paddingVertical: 16, 
  borderBottomWidth: 1,
   borderBottomColor: '#dfdfdf', 
  flexDirection: 'row'
},
  closeBtn: { 
  position: 'absolute', 
  right: 8, 
  top: 0, 
  padding: 16, 
  zIndex: 2, 
  backgroundColor: '#121212'
},
  confirmText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontFamily: 'poppinsBold',
  },
  warningText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontFamily: 'poppins',
    paddingHorizontal: 24
  },
  iconContainer:{
    borderRadius: 100,
    backgroundColor: '#2B2930',
    opacity: .8,
    position: 'absolute',
    top: 32,
    left: 16,
    zIndex: 2,
  },
  icon: {
    color: '#fff',
    padding: 12,
    fontSize: 30,
    },
  imageContainer: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    aspectRatio: 16/12,
    position: 'absolute',
  },
  chipsItem: {
    flexDirection:"row",
    justifyContent: 'flex-start',
    backgroundColor:'#E1E5E8', 
    borderRadius:20,
    padding:8,
    paddingHorizontal:20, 
    marginHorizontal:4,
    marginVertical: 8,
    marginBottom: 16,
    height:40,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  btnContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 16,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#2B2930',
    height: '100%',
    padding: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 200,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 1,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#dfdfdf',
    marginHorizontal: 24
  },
  btnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    backgroundColor: '#a6a6a6',
    marginVertical: 16,
    marginHorizontal: 16,
    shadowColor: '#554eeb',
    shadowOpacity: '50%',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 32,
    backgroundColor: '#554eeb',
    shadowColor: '#554eeb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
    width: 'auto',
  },
  mapLanding: {
    width: '100%',
    height: '100%',
    marginTop: 8
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 16,
    width: '80%',
    height: '25%',
    backgroundColor: '#fff',
  },
  h1Bold: {
    color: '#FFF',
    padding: 10,
    fontSize: 33,
    fontFamily: 'poppinsBold',
  },
  h1: {
    color: '#FFF',
    padding: 10,
    fontSize: 33,
    fontFamily: 'poppins',
  },
  h2Bold: {
    color: '#fff',
    padding: 10,
    fontSize: 26,
    fontFamily: 'poppinsBold',
  },
  full: {
    color: '#2c2c2c',
    fontSize: 26,
    fontFamily: 'poppins',
    borderRadius: 16,
    paddingVertical: 1,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#dfdfdf',
    marginVertical: 16,
    shadowColor: '#554eeb',
    shadowOpacity: '50%',
    marginRight: 8,
  },
  h3Bold: {
    color: '#fff',
    padding: 10,
    fontSize: 20.4,
    fontFamily: 'poppinsBold',
  },
  h3: {
    color: '#fff',
    paddingHorizontal: 8,
    fontSize: 20.4,
    fontFamily: 'poppins',
  },
  pBold: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'poppinsBold',
  },
  btnP: {
    color: '#fff',
    padding: 10,
    fontSize: 16,
    fontFamily: 'poppins',
  },
  btnPDark: {
    color: '#2c2c2c',
    padding: 10,
    fontSize: 16,
    fontFamily: 'poppins',
  },
  p: {
    color: '#CAC4D0',
    paddingHorizontal: 8,
    fontSize: 16,
    fontFamily: 'poppins',
    marginVertical: 4,
  },
  pDark: {
    color: '#22222E',
    fontSize: 16,
    fontFamily: 'poppins',
  },
  sBold: {
    color: '#fff',
    paddingHorizontal: 8,
    fontSize: 12.6,
    fontFamily: 'poppinsBold',
  },
  s: {
    color: '#CAC4D0',
    paddingHorizontal: 8,
    fontSize: 12.6,
    fontFamily: 'poppins',
  },
  });