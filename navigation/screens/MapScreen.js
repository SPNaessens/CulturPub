import React, { useEffect, useState } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { Dimensions, View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ScrollView, Modal, Alert, Animated} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Location from 'expo-location';
import { FIRESTORE_DB } from '../../firebaseConfig';
import { collection, query, where, getDocs, doc, getDoc } from '@firebase/firestore';
import user from '../../img/user.png'
import eventPin from '../../img/eventPin.png'
import { tags } from '../../tagCats';
import customMap from '../../customMap.json'
import { useRoute, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;

const MapScreen = ({ navigation }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [ markers, setMarkers ] = useState(null);
  const [ cards, showCards ] = useState(true);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [ cardsVisible, setCardsVisible ] = useState(false);
  const [eventData, setEventData] = useState([]);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMarkerCoordinate, setSelectedMarkerCoordinate] = useState(null);
 const [ markerCoords, setMarkerCoords ] = useState([]);

  const [selectedFilters, setSelectedFilters] = useState([]);

  const route = useRoute();
  const { eventDataCoordinates } = route.params || '';

  let mapIndex = 0;
  let mapAnimation = new Animated.Value(0);
  const _map = React.useRef(null);
  const _scrollView = React.useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      if (eventDataCoordinates && _map.current) {
        const region = {
          latitude: eventDataCoordinates.lat,
          longitude: eventDataCoordinates.lng,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        _map.current?.animateToRegion(region, 1000);
      }
    }, [eventDataCoordinates])
  );
  
  useEffect(() => {
    loadMap();
  }, []);

  const loadMap = async () => {
    await requestLocationPermission();
    try {
      const eventsRef = collection(FIRESTORE_DB, 'events');
      const q = query(eventsRef, where('coordinates', '!=', null));
      const querySnapshot = await getDocs(q);
      const markerData = [];
      const markerCoordinates = [];
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        if (eventData.coordinates && eventData.coordinates.lat && eventData.coordinates.lng) {
          markerCoordinates.push(eventData.coordinates);
          markerData.push({
            id: doc.id,
            coordinate: {
              latitude: eventData.coordinates.lat,
              longitude: eventData.coordinates.lng,
            },
            image: eventData.image,
            title: eventData.title,
            date: eventData.date,
            cardTags: eventData.tags,
            location: eventData.location,
            eventData,
          });
        }
      });
      setMarkerCoords(markerCoordinates)
      setMarkers(markerData);
      showCards(true);
    } catch (error) {
      Alert.alert('Failed to add markers');
    }
  };

  const TruncatedText = ({ text, maxLength }) => {
    if (text.length <= maxLength) {
      return <Text style={styles.s} variant="bodyMedium">{text}</Text>;
    }
    const truncatedText = text.slice(0, maxLength) + '...';
    return <Text style={styles.s} variant="bodyMedium">{truncatedText}</Text>;
  };

  const handleFilterButtonClick = (selectedCategory) => {
    if (selectedFilters.includes(selectedCategory)) {
      let filters = selectedFilters.filter((el) => el !== selectedCategory);
      setSelectedFilters(filters);
    } else {
      setSelectedFilters([...selectedFilters, selectedCategory]);
    }
  };  

  const navigateToEventLanding = (eventData) => {
    setSearchVisible(false)
    navigation.navigate('EventLanding', { eventData });
  };

  const SearchSuggestions = ({ suggestions, onSuggestionPress, eventData }) => {
    return (
      <View style=
      {{marginTop: 4, width: '100%', padding: 8, backgroundColor:'#2c2c2c'}}>
        <FlatList
          style={styles.suggestions}
          data={suggestions}
          renderItem={({ item }) => (
              <View style={{marginTop: 4, width: '100%', padding: 8, backgroundColor:'#2c2c2c'}}>
                { item.title ? (
                  <TouchableOpacity onPress={() => navigateToEventLanding(item)}>
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
    setSearchQuery(text);
  
    try {
      const q = query(
        eventRef,
        where('title', '>=', text),
        where('title', '<=', text + '\uf8ff')
      );
  
      const querySnapshot = await getDocs(q);
  
      const filteredResults = [];
      querySnapshot.forEach((doc) => {
        const eventData = doc.data();
        filteredResults.push({
          id: doc.id,
          ...eventData,
        });
      });
  
      setSearchResults(filteredResults);
    } catch (error) {
    }
  };

  const handleMapPress = (item) => {
    setSelectedMarkerCoordinate(item.coordinate);
    setCardsVisible(false);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
        alert('You havent permitted Cultur to use your location')
      return;
    }

    Location.getLastKnownPositionAsync({})
      .then((location) => {
        const { latitude, longitude } = location.coords;
        setCurrentLocation({ latitude, longitude });
      })
  };

  const filteredMarkers = markers?.filter((marker) => {
    return (
      selectedFilters.length === 0 ||
      marker.cardTags.some((tag) => selectedFilters.includes(tag))
    );
  });

  const onMarkerPress = (markerID) => {
    const index = markers.findIndex((marker) => marker.id === markerID);
    if (index >= 0) {
      const x = index * (CARD_WIDTH + 20);
      
      if (cardsVisible) {
        if (_scrollView.current) {
          _scrollView.current.scrollTo({ x: x, y: 0, animated: true });
        }
      } else {
        setCardsVisible(true);
        setSelectedMarkerId(markerID);
      }
    } else {
    }
  };
  
  useEffect(() => {
    if (cardsVisible && selectedMarkerId) {
      const index = markers.findIndex((marker) => marker.id === selectedMarkerId);
      if (index >= 0 && _scrollView.current) {
        const x = index * (CARD_WIDTH + 20);
        _scrollView.current.scrollTo({ x: x, y: 0, animated: true });
      }
    }
  }, [cardsVisible, selectedMarkerId]);

  useEffect(() => {
    mapAnimation.setValue(0);
    mapAnimation.addListener(({ value }) => {
      let index = Math.floor(value / CARD_WIDTH + 0.3);

      if (index >= markerCoords.length) {
        index = markerCoords.length - 1;
      }
      if (index < 0) {
        index = 0;
      }
      const coordinate = markers[index].coordinate;
      setSelectedMarkerCoordinate(coordinate);
      clearTimeout(regionTimeout);
      const regionTimeout = setTimeout(() => {
        if (mapIndex !== index) {
          mapIndex = index;
          _map.current.animateToRegion(
            {
              latitude: coordinate.latitude,
              longitude: coordinate.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            },
            350
          );
        }
      }, 10);
    });
  });

  const interpolations = filteredMarkers?.map((marker, index)=> {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      ((index + 1) * CARD_WIDTH),
    ];

    const scale = mapAnimation.interpolate({
      inputRange,
      outputRange: [1, 1.5 ,1 ],
      extrapolate: "clamp"
    });

    return { scale };
  });

  return (
    <View style={{ flex: 1 }}>
      <Modal
        transparent={true}
        visible={searchVisible}
        onRequestClose={() => {
          setSearchVisible(!searchVisible);
        }}>
          <View style={styles.centeredView}>
            <View style={styles.modalView}>

      <View style={{flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16}}>
        <TouchableOpacity onPress={() => setSearchVisible(!searchVisible)} style={{width: '15%'}}>
          <Ionicons style={{...styles.icon}} name='arrow-back-outline' />
        </TouchableOpacity>

        <TextInput
          style={{...styles.searchBar, width: '60%', marginTop: 8,}}
          placeholder="Search..."
          placeholderTextColor={'#2c2c2c'}
          value={searchQuery}
          autoFocus
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
        />
        <TouchableOpacity onPress={() => setSearchQuery('')} style={{padding: 12, paddingTop: 20, color: '#2c2c2c'}}>
          <Text style={{...styles.p, color:'#fff'}}>Clear</Text>
        </TouchableOpacity>
      </View>

      {searchQuery.length > 0 && searchResults.length > 0 && renderSearchSuggestions(searchResults)}
            </View>
          </View>
        </Modal>
            <View style={{position: 'absolute', top: 8, marginRight: 16, zIndex: 900, width: '100%'}}>
            <TouchableOpacity onPress={() => setSearchVisible(true)}>
                <TextInput style={{...styles.searchBar, marginHorizontal: 8}} editable={false}>
                    <Text style={styles.searchBarText} ><Ionicons name='search' style={{fontSize: 16}}/> Search...</Text>
                </TextInput>
            </TouchableOpacity>
            <ScrollView 
              horizontal 
              style={styles.tagsScroll}
              scrollEventThrottle={1}
              showsHorizontalScrollIndicator={false}
            >
              {tags.map((tag, idx) => (
                <TouchableOpacity
                  onPress={() => handleFilterButtonClick(tag.category)}
                  style={[
                    styles.headerChips,
                    selectedFilters.includes(tag.category) ? styles.activeTag : null,
                  ]}
                  key={`filters-${idx}`}
                >
                  <Text style={styles.pDark}>
                    <Ionicons name={tag.icon} /> {tag.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={{ flex: 1, ...StyleSheet.absoluteFillObject }}>
          {currentLocation && (
          <MapView
            ref={_map}
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1, ...StyleSheet.absoluteFillObject }}
            customMapStyle={customMap}
            API_KEY_HIDDEN="API_KEY_HIDDEN"
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            <Marker coordinate={currentLocation} style={{width: 64, height: 64}} resizeMode="contain">
              <Animated.View>
                <Animated.Image source={user} 
                style={styles.markerImage} 
                />
                </Animated.View>
              </Marker>

              {(markers !== null && filteredMarkers !== null) && filteredMarkers.map((marker, index) => {
                const scaleStyle = {
                  transform: [
                    {
                      scale: interpolations[index].scale,
                    },
                  ],
                };

                return (
                  <Marker key={marker.id} coordinate={marker.coordinate} onPress={() => onMarkerPress(marker.id)}>
                    <Animated.View>
                      <Animated.Image source={eventPin} style={{...styles.markerImage, ...scaleStyle}} />
                    </Animated.View>
                  </Marker>
                );
              })}
          </MapView>
        )}
        </View>

{ cardsVisible && markers && (
    <Animated.ScrollView
    ref={_scrollView}
      horizontal
      scrollEventThrottle={1}
      showHorizontalScrollIndicator={false}
      style={styles.scrollView}
      pagingEnabled
      snapToInterval={CARD_WIDTH + 20}
      snapToAlignment={'center'}
      contentContainerStyle={{
        paddingHorizontal: 10
      }}
      onScroll={Animated.event(
        [
          {
            nativeEvent: {
              contentOffset: {
                x: mapAnimation,
              }
            },
          },
        ],
        {useNativeDriver: true}
      )}
    >

{markers !== null &&
  markers.map((item) => {
    const navigateToEventLanding = async () => {
      const eventId = item.id;
      const eventsRef = collection(FIRESTORE_DB, 'events');
      const eventDocRef = doc(eventsRef, eventId);

      try {
        const eventSnapshot = await getDoc(eventDocRef);

        if (eventSnapshot.exists()) {
          const eventData = eventSnapshot.data();
          navigation.navigate('EventLanding', { eventData });
        } else {
        }
      } catch (error) {
      }
    };

    return (
      <TouchableOpacity key={item.id} activeOpacity={1} style={styles.card} onPress={() => navigateToEventLanding(eventData)}>
        <Image source={{ uri: item.image }} style={styles.cardImage} />
        <Text style={styles.pBold}>{item.title}</Text>
        <TruncatedText style={styles.pBold} maxLength={40} text={`${item.date} • ${item.location}`}></TruncatedText>
      </TouchableOpacity>
    );
  })}
</Animated.ScrollView>
  )}
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    position: "absolute",
    bottom: 80,
    left: 0,
    right: 0,
    paddingVertical: 10,
    zIndex: 5
  },
  markerImage:{
    height: 40,
    width: 40
  },
  searchBar : {
    height: 56,
    marginTop: 48,
    marginHorizontal: 8,
    backgroundColor: '#fff',
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
    color: '#2c2c2c',
    fontSize: 16,
},
centeredView: {
  flex: 1,
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
modalView: {
  width: '100%',
  height: '100%',
  backgroundColor: '#121212',
},
suggestions: {
  marginBottom: 32,
  width: '100%'
},
card: {
  elevation: 2,
  backgroundColor: "#36343B",
  borderTopLeftRadius: 5,
  borderTopRightRadius: 5,
  marginHorizontal: 10,
  height: 220,
  width: CARD_WIDTH,
  borderRadius: 12,
  overflow: 'hidden'
},
icon: {
  color: '#fff',
  padding: 20,
  fontSize: 30,
},  
cardImage: {
  width: '100%',
  height: 120,
},
headerChips: {
  flexDirection:"row",
  backgroundColor:'#fff', 
  borderRadius:20,
  padding:8,
  marginTop: 8,
  paddingHorizontal:16, 
  marginHorizontal:8,
  marginBottom: 8,
  height:40,
},
activeTag: {
  flexDirection: 'row',
  borderRadius: 50,
  paddingHorizontal: 16,
  backgroundColor: '#554eeb',
  shadowColor: '#554eeb',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 15,
  elevation: 8,
  width: 'auto',
},
h3: {
  color: '#fff',
  fontSize: 20.4,
  fontFamily: 'poppins'
},
pBold: {
  color: '#fff',
  padding: 8,
  fontSize: 16,
  fontFamily: 'poppinsBold'
},
p: {
  color: '#2c2c2c',
  fontSize: 16,
  fontFamily: 'poppins'
},
pDark: {
  color: '#22222E',
  fontSize: 16,
  fontFamily: 'poppins'
},
s: {
  color: '#cac4d0',
  paddingLeft: 8,
  fontSize: 12.6,
  fontFamily: 'poppins'
},
})

export default MapScreen;