import { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ScrollView, Modal, Pressable, Alert, ImageBackground } from 'react-native';
import { FIRESTORE_DB, auth } from '../../firebaseConfig';
import {query, where, collection, deleteDoc, onSnapshot, doc, updateDoc, getDoc, getDocs} from 'firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from 'react-native-paper';
import RBSheet from 'react-native-raw-bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { tags } from "../../tagCats";
import * as Location from 'expo-location';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import customMap from '../../customMap.json'
import user from '../../img/user.png';
import nothing from '../../img/nothing.png';

const ExploreScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState();
  const [events, setEvents] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [ActionSheetVisible, setActionSheetVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [ markers, setMarkers ] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [ mapLoaded, setMapLoaded ] = useState(false);

  const sheet = useRef();
  const artsEvents = events.filter((event) => event.tags.includes('Art'));
  const stageEvents = events.filter((event) => event.tags.includes('Theatre' || 'Stage' || 'Film' || 'Storytelling' || 'Music'));
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const todaysEvents = events.filter((event) => event.date === today);

  const workshopEvents = events.filter((event) => [
    'Fashion', 'Workshops', 'Food'
  ].some(tag => event.tags.includes(tag)));

  const opencallEvents = events.filter((event) => event.tags.includes('Open-Call'));
  
  const eventsByCat = selectedFilters.length === 0 ? events : events.filter((event) => 
  selectedFilters.some((tag) => event.tags.includes(tag)));

const toEventLanding = (navigation, eventData, regedEvents, isEventRegistered) => {
    setSearchVisible(false);
    setSearchQuery('');
    navigation.navigate('EventLanding', { eventData, regedEvents, isEventRegistered });
  };

  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("You haven't permitted Cultur to use your location");
        return;
      }
  
      try {
        const location = await Location.getCurrentPositionAsync({});
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
        await loadMap();
      } catch (error) {
        Alert.alert('Error:', error.message);
      }
    };
    requestLocationPermission();
  }, []);
  
  const loadMap = async () => {
    try {
      const eventsRef = collection(FIRESTORE_DB, 'events');
      const q = query(eventsRef, where('coordinates', '!=', null));
      const querySnapshot = await getDocs(q);
      const markerData = [];
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        if (eventData.coordinates && eventData.coordinates.lat && eventData.coordinates.lng) {
          markerData.push({
            id: doc.id,
            coordinate: {
              latitude: eventData.coordinates.lat,
              longitude: eventData.coordinates.lng,
            },
          });
        }
      });
      setMarkers(markerData);
      setMapLoaded(true);
    } catch (error) {
      Alert.alert('Failed to add markers:', error.message);
    }
  };

  const handleTagFilter = (selectedCategory) => {
    if (selectedFilters.includes(selectedCategory)) {
      let filters = selectedFilters.filter((el) => el !== selectedCategory);
      setSelectedFilters(filters);
    } else {
      setSelectedFilters([...selectedFilters, selectedCategory]);
    }
  };

  const SearchSuggestions = ({ suggestions, onSuggestionPress }) => {
    return (
      <View>
        <FlatList
          style={styles.suggestions}
          data={suggestions}
          renderItem={({ item }) => (

              <View style={{marginTop: 4, width: '100%', padding: 8, backgroundColor:'#2c2c2c'}}>
                { item.title ? (
                  <TouchableOpacity onPress={() => toEventLanding(navigation, item, events)}>
                    <Text style={styles.h3}><Icon name="easel" style={{fontSize: 20.4}}/> {item.title}</Text>
                  </TouchableOpacity>
                ):(
                  <TouchableOpacity onPress={() => navigateToProfile(item.uid)}>
                    <Text style={styles.h3}><Icon name="person" style={{fontSize: 20.4}}/> {item.userName}</Text>
                  </TouchableOpacity>
                )}
              </View>
          )}
          keyExtractor={(item) => item.id.toString()}
        />
      </View>
    );
  };

  const renderSearchSuggestions = (suggestions, onSuggestionPress) => {
    return (
        <SearchSuggestions
          suggestions={suggestions}
          onSuggestionPress={(selectedSuggestion) => {
          }}
        />
    );
  };

  const handleSearch = async (text) => {
    const eventRef = collection(FIRESTORE_DB, 'events');
    const profileRef = collection(FIRESTORE_DB, 'userProfile');
    setSearchQuery(text);
    try {
      const eventQuery = query(
        eventRef,
        where('title', '>=', text),
        where('title', '<=', text + '\uf8ff')
      );
  
      const profileQuery = query(
        profileRef,
        where('userName', '>=', text),
        where('userName', '<=', text + '\uf8ff')
      );
  
      const eventSnapshot = await getDocs(eventQuery);
      const profileSnapshot = await getDocs(profileQuery);
  
      const filteredResults = [];
  
      eventSnapshot.forEach((doc) => {
        const eventData = doc.data();
        filteredResults.push({
          id: doc.id,
          ...eventData,
        });
      });
  
      profileSnapshot.forEach((doc) => {
        const profileData = doc.data();
        filteredResults.push({
          id: doc.id,
          ...profileData,
        });
      });
  
      setSearchResults(filteredResults);
    } catch (error) {
    }
  };
  
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

  const deleteItem = async (itemId) => {
    const ref = doc(FIRESTORE_DB, `events/${itemId}`);
    await deleteDoc(ref);
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

  useEffect(() => {
    const eventRef = collection(FIRESTORE_DB, 'events');
    const subscriber = onSnapshot(eventRef, {
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
  
    return () => subscriber();
  }, []);
  
  const renderEvent = ({ item }) => {
    const currentUserId = auth.currentUser?.uid;
    const isCurrentUserEventPoster = item.userUid === currentUserId;
    const isEventFull = item.isEventFull

    if (isEventFull) {
      return null;
    }
  
    return (
      <Card style={styles.card} key={item.id} onPress={() => toEventLanding(navigation, item, events)}>        
          <View style={styles.imageContainer}>
            <ImageBackground source={{ uri: item.image }} style={styles.eventImage}>
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.5)', 'rgba(0, 0, 0, 0.2)', 'transparent']}
              style={styles.gradient}
              start={[0.5, 0]}
              end={[0.5, 0.5]}
            >
              </LinearGradient>
          </ImageBackground>
            <TouchableOpacity style={styles.cardProfile} onPress={() => navigateToProfile(item.userUid)}>
              <Image source={{ uri: item.profilePic }} style={styles.cardProfile} />
              </TouchableOpacity>

              {isCurrentUserEventPoster && (
              <TouchableOpacity
                style={styles.meatballContainer}
                onPress={() => {
                  setSelectedItem(item);
                  sheet.current.open();
                }}
              >
                <Icon name='ellipsis-vertical' style={styles.meatball} />
              </TouchableOpacity>
            )}
        </View>
        <View style={{height:220}}>
          <Card.Content>
            <Text numberOfLines={1} style={styles.h3Bold}>{item.title}</Text>
            <Text numberOfLines={1} style={styles.p}>{item.date}, {item.time} • {item.location}</Text>
            </Card.Content>

          <Card.Content>
            <Text numberOfLines={3} style={styles.s}  >{item.eventDescription}</Text>
          </Card.Content>
          <View style={styles.tagContainer}>
            {item.tags?.slice(0, 2).map((tag, index) => (
              <TouchableOpacity key={index} style={styles.chipsItem}>
                <Text style={styles.pLight}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Card>
    );
  };
  
  return (
    <View >
      <View style={styles.headerContainer}>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container} stickyHeaderIndices={[0]} stickyHeaderHiddenOnScroll={true}>
      <TouchableOpacity onPress={() => setSearchVisible(true)} >
                <TextInput style={styles.searchBar} editable={false}>
                    <Text style={styles.searchBarText} ><Icon name='search' style={{fontSize: 16}}/> Search...</Text>
                </TextInput>
            </TouchableOpacity>
        <TouchableOpacity activeOpacity={1} onPress={() => navigation.navigate('Map')}>
          <View style={styles.exploreMap}>
            <Text style={styles.toMapBtn}><Icon name='map-outline' style={{...styles.p, color:'#fff'}}/> Open Map </Text>
            {currentLocation && (
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.mapLanding}
                  scrollEnabled={false}
                  API_KEY_HIDDEN="API_KEY_HIDDEN"
                  overflow='HIDDEN'
                  initialRegion={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                  }}
                  customMapStyle={customMap}
                >
                {currentLocation && (
                  <Marker coordinate={currentLocation} >
                  <Image source={user} style={{ height: 32, width: 32}}/>
                  </Marker>)}

                  {markers && (
                    markers.map((marker) => (
                      <Marker
                        key={marker.id}
                        coordinate={marker.coordinate}
                      />
                    ))
                  )}

                </MapView>
                )}
          </View>
        </TouchableOpacity>

<Text style={styles.h2Bold}>On Today</Text>
<ScrollView
  horizontal 
  style={styles.eventsScroll}
  scrollEventThrottle={1}
  showsHorizontalScrollIndicator={false}
>
  {todaysEvents.length > 0 ? (
    todaysEvents.slice(0, 10).map((event) => (
      <View key={event.id} style={styles.eventCard}>
        {renderEvent({ item: event })}
      </View>
    ))
  ) : (
    <Card style={{...styles.card, padding: 16, width: 300}}>
      <Text style={styles.h3Bold}>Nothing here yet!</Text>
      <Image source={nothing} style={{height: 200, width: 200}}/>
    </Card>
  )}
</ScrollView>

<Text style={styles.h2Bold}>Visual Arts</Text>
  <ScrollView
    horizontal 
    style={styles.eventsScroll}
    scrollEventThrottle={1}
    showsHorizontalScrollIndicator={false}
  >
    {artsEvents.length > 0 &&
      artsEvents.slice(0, 10).map((event) => (
        <View key={event.id} style={styles.eventCard}>
          {renderEvent({ item: event })}
        </View>
      ))
    }
  </ScrollView>

<Text style={styles.h2Bold}>Stage And Performance</Text>
<ScrollView
    horizontal 
    style={styles.eventsScroll}
    scrollEventThrottle={1}
    showsHorizontalScrollIndicator={false}
  >
    {artsEvents.length > 0 &&
      stageEvents.slice(0, 10).map((event) => (
        <View key={event.id} style={styles.eventCard}>
          {renderEvent({ item: event })}
        </View>
      ))
    }
  </ScrollView>

  <Text style={styles.h2Bold}>Workshops And Social</Text>
  <ScrollView
    horizontal 
    style={styles.eventsScroll}
    scrollEventThrottle={1}
    showsHorizontalScrollIndicator={false}
  >
    {workshopEvents.length > 0 &&
      workshopEvents.slice(0, 10).map((event) => (
        <View key={event.id} style={styles.eventCard}>
          {renderEvent({ item: event })}
        </View>
      ))
    }
  </ScrollView>

  <Text style={styles.h2Bold}>Open Calls</Text>
<ScrollView
    horizontal 
    style={styles.eventsScroll}
    scrollEventThrottle={1}
    showsHorizontalScrollIndicator={false}
  >
    {opencallEvents.length > 0 &&
      opencallEvents.slice(0, 10).map((event) => (
        <View key={event.id} style={styles.eventCard}>
          {renderEvent({ item: event })}
        </View>
      ))
    }
  </ScrollView>

<Text style={styles.h2Bold}>Events By Category</Text>
    <ScrollView 
    horizontal 
    style={styles.tagsScroll}
    scrollEventThrottle={1}
    showsHorizontalScrollIndicator={false}
  >
    {tags.map((tag, idx) => (
      <TouchableOpacity
        onPress={() => handleTagFilter(tag.category)}
        style={[
          styles.headerChips,
          selectedFilters.includes(tag.category) ? styles.activeTag : null,
        ]}
        key={`filters-${idx}`}
      >
        <Text style={styles.pDark}>
          <Icon name={tag.icon} /> {tag.category}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>

  <ScrollView
    horizontal 
    style={styles.eventsScroll}
    scrollEventThrottle={1}
    showsHorizontalScrollIndicator={false}
  > 
    {eventsByCat.length > 0 &&
          eventsByCat.slice(0, 10).map((event) => (
            <View key={event.id} style={styles.eventCard}>
              {renderEvent({ item: event })}
            </View>
          ))
        }
  </ScrollView>

</ScrollView>

      <Modal
        transparent={true}
        visible={searchVisible}
        onRequestClose={() => {
          setSearchVisible(!searchVisible);
        }}>
            <View style={styles.modalView}>

      <View style={{flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 8, borderRadius: 16}}>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)} style={{width: '15%'}}>
          <Icon style={styles.icon} name='arrow-back-outline' />
        </TouchableOpacity>

        <TextInput
          style={{...styles.searchBar, width: '60%', marginTop: 8,}}
          placeholder="Search..."
          placeholderTextColor={'#fff'}
          value={searchQuery}
          autoFocus
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
        />
        <TouchableOpacity onPress={() => setSearchQuery('')} style={{padding: 12, paddingTop: 20, color: '#fff'}}>
          <Text style={styles.p}>Clear</Text>
        </TouchableOpacity>
      </View>

              {searchQuery.length > 0 && searchResults.length > 0 && renderSearchSuggestions(searchResults)}
            </View>
        </Modal>
        
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={{...styles.modal, padding: 16, borderRadius: 16}}>
            <Text style={styles.pDark}>Are you sure you want to delete this event?</Text>
            <View style={{flexDirection:'row', position:'absolute', top: '80%', right: 32}}>
            <Pressable
              style={[styles.button, styles.buttonClose]}
              onPress={() => {setModalVisible(!modalVisible)
                deleteItem(selectedItem?.id);}}>
              <Text style={styles.warningText}>Confirm</Text>
            </Pressable>
            <Pressable
              onPress={() => setModalVisible(!modalVisible)}>
              <Text style={styles.pDark}>Cancel</Text>
            </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <RBSheet
        customStyles={{ container: styles.sheet }}
        height={300}
        openDuration={250}
        ref={sheet}
        onClose={() => setActionSheetVisible(false)}
      >
        <View>
          <TouchableOpacity onPress={() => editEvent(selectedItem)}>
            <View style={styles.btn}>
              <Text style={styles.btnP}>Edit</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
          onPress={() => {setModalVisible(true);
            sheet.current.close();}}
          >
            <View style={styles.btnSecondary}>
              <Text style={styles.btnP}>Delete</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.bodyGap} />
        </View>
      </RBSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  exploreMap: {
  borderRadius: 16,
  marginHorizontal: 8,
  marginTop: 16, 
  height: 200, 
  overflow: 'hidden'
},
  toMapBtn: {
  backgroundColor: '#554eeb',
  color:'#fff',
  position: 'absolute', 
  bottom: 16,
  right: 16,
  zIndex:3,
  fontSize: 16,
  paddingHorizontal: 16,
  paddingVertical: 8,
  borderRadius: 10
},
  eventCard: {
    width: 350,
    height: 410,
  },
  headerContainer: {
    position:'absolute',
    width: '100%',
    top: 0,
    left: 0,
    zIndex: 1000
  },
mapLanding: {
    height: '100%',
    width: '100%',
  },
searchBar : {
    height: 56,
    marginTop: 48,
    marginHorizontal: 8,
    backgroundColor: '#36343B',
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 16,
    width: 'auto',
},
searchBarText: {
    color: '#fff',
    fontSize: 16,
},
  suggestions: {
    marginBottom: 32,
    width: '100%'
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#121212',
    paddingVertical: 8,
    paddingBottom: 140
  },
  eventImage: {
    width: '100%',
    aspectRatio: 16/9,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    zIndex: 0
  },
  card: {
    marginBottom: 10,
    marginHorizontal: 8,
    backgroundColor: '#2B2930'
  },
  icon: {
    color: '#fff',
    padding: 20,
    fontSize: 30,
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
    shadowColor: '#554eeb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 8,
    marginHorizontal: 8
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
    marginVertical: 8,
    marginHorizontal: 8
  },
  sheet: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    backgroundColor: '#2B2930',
  },
  meatball: {
    color:'#fff',
    fontSize: 24,
    padding: 10,
    position: 'absolute',
    top: -175,
    right: 15
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    color: '#36343B'
  },
  modalView: {
    width: '100%',
    height: '100%',
    backgroundColor: '#121212',
  },
  modal: {
    width: '80%',
    height: '20%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 16,
  },
  warningText: {
    color: '#554eeb',
    fontSize: 16,
    paddingHorizontal: 20
  },
  meatballContainer: {
    marginLeft: 'auto',
  },
  cardProfile: {
    height: 32,
    width: 32,
    borderRadius: 50,
    padding: 20,
    position: 'absolute',
    left: 8,
    top: 8,
    zIndex: 1,
  },
  tagsScroll: {
    paddingLeft: 8,
    backgroundColor: '#121212',
  },
  activeTag: {
    flexDirection: 'row',
    borderRadius: 50,
    paddingHorizontal: 16,
    backgroundColor: '#554eeb',
    shadowColor: '#554eeb',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 16,
    width: 'auto',
  },
  headerChips: {
    flexDirection:"row",
    backgroundColor:'#fff', 
    borderRadius:20,
    padding:8,
    paddingHorizontal:16, 
    marginRight: 8,
    marginBottom: 8,
    height:40,
  },
  chipsItem: {
    flexDirection:"row",
    justifyContent: 'flex-start',
    borderColor:'#CAC4D0',
    borderWidth: 2, 
    borderRadius:50,
    paddingVertical: 4,
    paddingHorizontal:20, 
    marginHorizontal:8,
    marginVertical: 8,
    marginBottom: 16,
    height:40,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  h1Bold: {
    color: '#fff',
    paddingLeft: 8,
    fontSize: 33,
    letterSpacing: -1.5,
    marginTop: 8,
    fontFamily: 'poppinsBold',
  },
  h2Bold: {
    color: '#fff',
    paddingHorizontal: 16,
    fontSize: 26,
    letterSpacing: -1.2,
    marginTop: 16,
    fontFamily: 'poppinsBold',
  },
  h3Bold: {
    color: '#fff',
    fontSize: 20.4,
    marginTop: 4,
    fontFamily: 'poppinsBold',
  },
  h3: {
    color: '#fff',
    fontSize: 20.4,
    padding: 8,
    fontFamily: 'poppins',
  },
  p: {
    color: '#CAC4D0',
    marginTop: 0,
    fontSize: 16,
    fontFamily: 'poppins',
  },
  btnP: {
    color: '#fff',
    padding: 10,
    fontSize: 16,
    fontFamily: 'poppins',
  },
    btnPDark: {
    color: '#2c2c2c',
    fontSize: 16,
    fontFamily: 'poppins',
  },
  pDark: {
    color: '#2c2c2c',
    fontSize: 16,
    fontFamily: 'poppins',
  },
  pLight: {
    color: '#CAC4D0',
    fontSize: 16,
    fontFamily: 'poppins',
  },
  s: {
    color: '#CAC4D0',
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12.6,
    fontFamily: 'poppins',
  },
  imageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden'
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
});

export default ExploreScreen