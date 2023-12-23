import React,{ useState, useEffect, useRef } from 'react';
import { View, Text,Switch, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image, Modal, Pressable, ActivityIndicator } from 'react-native';
import { FIRESTORE_DB, storage, auth} from '../../firebaseConfig';
import { collection, doc, deleteDoc, onSnapshot, setDoc, Timestamp, getDoc } from '@firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { uploadBytes, getDownloadURL, ref, deleteObject } from 'firebase/storage';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { tags } from "../../tagCats";
import uuid from 'react-native-uuid';
import { sendPushNotification } from '../pushNotifications';

export default function EditEventScreen({ navigation, route }) {
  const [ event, setEvent] = useState('');
  const [ eventDescription, setEventDescription] = useState('');
  const [ formattedDate, setFormattedDate] = useState('');
  const [ formattedTime, setFormattedTime] = useState('');
  const [ date, setDate] = useState(new Date());
  const [ time, setTime ] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [ showTimePicker, setShowTimePicker] = useState(false);
  const [ dateString, setDateString] = useState('');
  const [ timeString, setTimeString ] = useState('');
  const [ eventPoster, setEventPoster] = useState('');
  const [ image, setImage ] = useState(null);
  const [location, setLocation ] = useState('');
  const [ userName, setUserName ] = useState('');
  const [ profilePic, setProfilePic] = useState(null);
  const [ userUid, setUserUid ] = useState('');
  const [profile, setProfile] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [ tokens, setTokens ] = useState([]);
  const [ locationModalVisible, setLocationModalVisible ] = useState(false);
  const [ posting, setPosting ] = useState(false);
  const [ uploading, setUploading ] = useState(false);
  const [ attendeesLimit, setAttendeesLimit] = useState(0);
  let [ isEventFull, setIsEventFull ] = useState(false);
  const [attendees, setAttendees ] = useState(false);
  const [isOpenCallEnabled, setIsOpenCallEnabled] = useState(false);
  const [isLimitEnabled, setIsLimitEnabled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [ itemId, setItemId ] = useState('');

  const toggleOpenCall = () => setIsOpenCallEnabled(previousState => !previousState);
  const toggleLimit = () => setIsLimitEnabled(previousState => !previousState);
  const [coordinates, setCoordinates] = React.useState({
    lat: null,
    lng: null
  });

  const googlePlacesRef = useRef();
  const eventMessage = `${userName} has posted an update!`;

  const oncancelEvent = () => {
    setEvent('');
    setEventDescription('');
    setImage(null);
    setCoordinates({ lat: null, lng: null });
    setLocation('');
    setUserName('');
    setProfilePic(null);
    setUserUid('');
    setDate('');
    setTime('');
    setAttendeesLimit(0);
    setIsEventFull(false);
    setItemId('');
    navigation.goBack();
  };

  const deleteItem = async (itemId) => {
    console.log('id:', itemId)
    const ref = doc(FIRESTORE_DB, `events/${itemId}`);
    await deleteDoc(ref);
    navigation.goBack();
  };

  useEffect(() => {
    if (route.params) {
      const { event, eventDescription, image, coordinates, location, tags , attendeesLimit, oldDate, oldTime, attendees, eventId } = route.params;
      setEvent(event);
      setLocation(location);
      setCoordinates(coordinates);
      setImage(image);
      setEventDescription(eventDescription);
      setDateString(oldDate);
      setTimeString(oldTime);
      setUserName(route.params.userName || '');
      setSelectedTags(tags || []);
      setFormattedDate(oldDate);
      setFormattedTime(oldTime);
      setAttendeesLimit(attendeesLimit || 0);
      setAttendees(attendees || 0);
      setItemId(eventId);

      if (attendees >= attendeesLimit) {
        setIsEventFull(true);
      } else {
        setIsEventFull(false);
      }
    }
    updatedEventData();
    getUserProfileData();
  }, [route.params]);

  useEffect(() => {
    if (!attendeesLimit) {
      setIsEventFull(false);
    } 
    if (attendeesLimit < 0) {
      setAttendeesLimit(0);
    }
  })

  const updateEvent = async () => {
    try {
      setPosting(true)
      setUploading(true)
      const eventId = route.params.eventId;
      if (!event || !location || !date || !time || !eventDescription) {
        setPosting(false)
        setUploading(false)
        alert('You have not filled in all the mandatory fields which are marked with *');
        return;
      }
  
      const updatedEventData = {
        id: eventId,
        title: event,
        date: formattedDate,
        time: formattedTime,
        eventDescription: eventDescription,
        image: image || null,
        user: eventPoster,
        coordinates: coordinates,
        location: location,
        userName: userName || 'User name is missing',
        profilePic: profilePic || null,
        token: tokens || null,
        userUid: userUid || 'missing',
        tags: selectedTags,
        attendeesLimit: attendeesLimit || 0,
        isEventFull: isEventFull
      };
  
      const eventRef = doc(FIRESTORE_DB, 'events', eventId);
      await setDoc(eventRef, updatedEventData, { merge: true });
      const currentUser = auth.currentUser;
      const userProfileRef = doc(FIRESTORE_DB, 'userProfile', currentUser.uid);
      const userProfileDoc = await getDoc(userProfileRef);
  
      if (userProfileDoc.exists()) {
        const followedIds = userProfileDoc.data().followed;
        const notificationsRef = collection(FIRESTORE_DB, 'notifications');
        await sendPushNotification(tokens, eventMessage);
        for (const followerId of followedIds) {
          const notificationData = {
            recipientUserId: followerId || [],
            eventId: eventId,
            message: `${userName || 'Someone'} updated their event.`,
            timestamp: Timestamp.now(),
            read: false,
          };
          const notificationDocRef = doc(notificationsRef, uuid.v4());
          await setDoc(notificationDocRef, notificationData);
        }
      }
      setEvent('');
      setEventDescription('');
      setImage(null);
      setCoordinates({ lat: null, lng: null });
      setLocation('');
      setUserName('');
      setProfilePic(null);
      setUserUid('');
      setDateString('');
      setAttendeesLimit(0);
      setDateString('');
      setTimeString('');
      setSelectedTags('');
      setUploading(false);
    } catch (error) {
      Alert.alert('Failed to update event');
    }
  };
  
  const updatedEventData = () => {
    if (route.params) {
      const { event, eventDescription, image, coordinates, location } = route.params;
      setEvent(event);
      setLocation(location);
      setCoordinates(coordinates);
      setImage(image);
      setEventDescription(eventDescription);
    }
  };

  const getUserProfileData = () => {
    const profileRef = doc(FIRESTORE_DB, `userProfile/${auth.currentUser.uid}`);
    setUserUid(auth.currentUser.uid);

    const subscriber = onSnapshot(
      profileRef,
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data());
          setUserName(doc.data().userName);
          setProfilePic(doc.data().profilePic);
          setTokens(doc.data().token || []);
        } else {
        }
      },
      (error) => {
      }
    );

    return () => {
      subscriber();
    };
  };

  const toggleTagSelection = (categoryName) => {
    setSelectedTags((prevSelectedTags) => {
      if (prevSelectedTags.includes(categoryName)) {
        return prevSelectedTags.filter((tag) => tag !== categoryName);
      } else {
        return [...prevSelectedTags, categoryName];
      }
    });
  };
  
  const handlePlaceSelection = (data, details) => {
    setCoordinates({
      lat: details.geometry.location.lat,
      lng: details.geometry.location.lng,
    });
    setLocation(data.description);
    setLocationModalVisible(false);
  };

  const toggleDatepicker = () => {
    setShowPicker(!showPicker);
  };

  const toggleTimepicker = () => {
    setShowTimePicker(!showTimePicker);
  };

  const chooseImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
     const uploadURL = await uploadImageAsync(result.assets[0].uri);
     setImage(uploadURL);
  } else {
    setImage(null);
  }
  };

  const uploadImageAsync = async (uri) => {
    const blob = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });

    try {
      const storageRef = ref(storage, `images/image-${Date.now()}`)
      const result = await uploadBytes(storageRef, blob);

      blob.close();
      return await getDownloadURL(storageRef);
    }
catch (error){
  alert(`Error : ${error}`);
 }
};

const onChangeDate = (event, selectedDate) => {
  const currentDate = selectedDate || '';
  setShowPicker(false);
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const newDate = `${day}/${month}/${year}`;
  setFormattedDate(newDate);
  setDate(newDate);
  setDateString(newDate.toString());
};

const onChangeTime = (event, selectedTime) => {
  const currentTime = selectedTime || '';
  setShowTimePicker(false);
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const newTime = `${hours}:${minutes}`;
  setFormattedTime(newTime);
  setTime(newTime);
  setTimeString(newTime);
};
  
  const deleteImage = async() => {
    const deleteRef = ref(storage, image);
    try {
      deleteObject(deleteRef).then(() => {
        setImage(null);
      })
    } catch (error) {
      alert(`Error : ${error}`);
    }
  };

    return(
        <ScrollView style={{ flex: 1, backgroundColor: '#fff' }}>
        <View style={styles.form} keyboardShouldPersistTaps= {'handled'}>

        <TouchableOpacity style={{position: 'absolute', right: 8, top: 16, padding: 16, zIndex: 2}} onPress={oncancelEvent}>
        <Ionicons name="close" style={ {fontSize:40, color:'#fff', }}/>
        </TouchableOpacity>

          <Text style={styles.h2Bold}>Update Your Event</Text>
          <Text style={styles.p}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Title"
              placeholderTextColor={'#CAC4D0'}
              value={event}
              onChangeText={setEvent}
            />
            <Text style={styles.p}>Description</Text>
            <TextInput
              style={styles.input}
              placeholder="Event Description"
              placeholderTextColor={'#CAC4D0'}
              value={eventDescription}
              onChangeText={setEventDescription}
              multiline={true}
            />

<Text style={styles.p}>Location</Text>
            <TouchableOpacity onPress={() => setLocationModalVisible(true)}>
              <TextInput
                style={styles.input}
                placeholder="Event location"
                placeholderTextColor={'#CAC4D0'}
                editable={false}
                value={location}
              />
            </TouchableOpacity>

            <Text style={styles.p}>Event Image</Text>
            { !image ? (
              <>          
              <TouchableOpacity onPress={chooseImage}>
              <TextInput
                style={styles.inputBtn}
                placeholder="Upload an event image"
                placeholderTextColor="#fff"
                editable={false}
              />
            </TouchableOpacity></>
            ) : (
              <>
                {image && (
                  <View style={styles.imageContainer}>
                    <TouchableOpacity onPress={chooseImage}>
                    <Ionicons name="close-outline" style={styles.icon} onPress={deleteImage}/>
                    <Image source={{ uri: image }} style={styles.image} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

<Text style={styles.p}>Choose Date</Text>
  
  {showPicker ? (
            <DateTimePicker mode="date" display="spinner" value={date} onChange={onChangeDate} />
          ) : (
            <TouchableOpacity onPress={toggleDatepicker}>
              <TextInput
                style={styles.inputBtn}
                placeholder="Choose Date"
                placeholderTextColor="#fff"
                value={dateString}
                editable={false}
              />
            </TouchableOpacity>
          )}

      <Text style={styles.p}>Choose Time</Text>

          {showTimePicker ? (
                  <DateTimePicker mode="time" display="spinner" value={time} onChange={onChangeTime} />
                    ) : (
                      <TouchableOpacity onPress={toggleTimepicker}>
                        <TextInput
                          style={styles.inputBtn}
                          placeholder="Choose Time"
                          placeholderTextColor="#fff"
                          value={timeString}
                          editable={false}
                        />
                      </TouchableOpacity>
                    )}

                    <View style={{...styles.toggleSection, marginTop: 8}}>
                      <Text style={styles.p}>Set limit of attendees </Text>
                      <Switch
                        trackColor={{ false: '#4A4458', true: '#fff' }}
                        thumbColor={'#554eeb'}
                        ios_backgroundColor="#3e3e3e"
                        onValueChange={toggleLimit}
                        value={isLimitEnabled}
                        style={{ transform: [{ scaleX: 1 }, { scaleY: 1 }], marginLeft: 16 }}
                      />
                    </View>

                    { isLimitEnabled && (
                      <View style={{flexDirection: 'row'}}>
                      <TextInput
                      style={styles.input}
                      placeholder='Maximum attendees (optional)'
                      value={attendeesLimit.toString()}
                      keyboardType='numeric'
                      onChangeText={setAttendeesLimit}/>
                        <Ionicons name="add-circle-outline" style={{fontSize: 56,paddingHorizontal: 8,
                          color: '#fff'}} onPress={() => setAttendeesLimit(attendeesLimit + 5)}/>
                        <Ionicons name="remove-circle-outline" style={{fontSize: 56, color: '#fff'}} onPress={() => setAttendeesLimit(attendeesLimit - 5)}/>
                      </View>
                    )}

                  <View style={{...styles.toggleSection, marginTop: 16}}>
                      <Text style={styles.p}>Allow artists applications</Text>
                      <Switch
                        trackColor={{ false: '#4A4458', true: '#fff' }}
                        thumbColor={'#554eeb'}
                        onValueChange={toggleOpenCall}
                        value={isOpenCallEnabled}
                        style={{ transform: [{ scaleX: 1 }, { scaleY: 1 }], marginLeft: 16 }}
                      />
                    </View>

                    { isOpenCallEnabled && (
                      <Text style={styles.s}>Users can now apply to take part in this event by emailing you. 
                      Add any instructions or requirements you have for them in the description. The 'open-call' tag will be displayed on the event.</Text>
                    )}

            <Text style={styles.pBold}>Select tags that describe your event</Text>
  
            <View style={styles.tagsScroll}>
              {tags.map((tag,category, index) => (
                <TouchableOpacity
                key={tag.name}
                  style={[
                    styles.chipsItem,
                    selectedTags.includes(tag.name) && { backgroundColor: '#554eeb' },
                  ]}
                  onPress={() => toggleTagSelection(tag.name)}
                >
                  <Text style={styles.pDark}>
                    <Ionicons name={tag.icon} /> {tag.category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
          <View style={{flexDirection: 'row',}}>
          <TouchableOpacity style={styles.btn}> 
              <Text style={styles.eventText} onPress={updateEvent}>Update Event</Text>
            </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={oncancelEvent}> 
            <Text style={styles.p} >Cancel</Text>
          </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setModalVisible(true)} style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={styles.deleteP}>Delete Event</Text>
          </TouchableOpacity>

          </View>

          <Modal visible={posting} transparent={true}>
          <View style={styles.loadingModal}>
          {uploading ? (
            <View style={{ height: 200, width: 200, alignItems: 'center', }}>
              <ActivityIndicator animating size="large" style={{ marginTop: 90 }} />
            </View>
          ) : (
            <View>
              <Text style={styles.modalP}>Event Updated Successfully!</Text>
              <View style={{flexDirection:'row', position:'absolute', top: 120, right: 32}}>
                <Pressable onPress={() => {setPosting(false); navigation.navigate('Explore');}}>
                  <Text style={styles.btnPDark}>Ok</Text>
                </Pressable>
              </View>
            </View>
          )}
          </View>
        </Modal>

      <Modal
        animationType="slide"
        visible={locationModalVisible}
        onRequestClose={() => {
          setLocationModalVisible(!locationModalVisible);
        }}>
        <View style={styles.centeredView}>
          <View style={{flexDirection: 'row'}}>
          <TouchableOpacity style={{padding: 8}} onPress={() => setLocationModalVisible(false)}><Ionicons style={{fontSize: 32, marginTop: 12}}name='arrow-back'/></TouchableOpacity>

          <GooglePlacesAutocomplete
                placeholder="Add the Events Location"
                placeholderTextColor="#fff"
                minLength={1}
                autoFocus={true}
                returnKeyType={'default'}
                fetchDetails={true}
                value={location}
                keepResultsAfterBlur={true}
                listViewDisplayed={true}
                styles={{
                  textInput: {
                    height: 60,
                    backgroundColor: '#4A4458',
                    color: '#fff',
                    borderRadius: 16,
                    marginVertical: 8,
                    padding: 32,
                    fontSize: 16,
                    marginRight: 40
                  },
                  listView: {
                    width: '100%',
                    zIndex: 100,
                    color: '#2B2930'
                  },
                }}
                ref={googlePlacesRef}
                onPress={handlePlaceSelection}
                query={{
                  key: 'AIzaSyAz0iEGP3KLE1DXv430u4FkmbSfHPQJ6MQ',
                  language: 'en',
                }}
              />
          </View>
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
                deleteItem(itemId);}}>
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
      </ScrollView> 
    );
}

const styles = StyleSheet.create({
  pDark: {
    color: '#2c2c2c',
    fontSize: 16,
    fontFamily: 'poppins',
  },
  warningText: {
    color: '#554eeb',
    fontSize: 16,
    paddingHorizontal: 20
  },
  deleteP: {
    color: '#554eeb',
    fontSize: 16,
    fontFamily: 'poppins',
    paddingVertical: 32
  },
  modal: {
    width: '90%',
    height: '25%',
    backgroundColor: '#fff',
    elevation: 16,
    marginTop: '60%',
    marginHorizontal: 16
  },
  loadingModal: {
    height: 200, 
    backgroundColor: '#fff', 
    padding: 16, 
    marginTop: '60%', 
    marginHorizontal: 16, 
    borderRadius: 16, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, 
    shadowRadius: 5, 
    elevation: 10,
  },
toggleSection: {
  flexDirection: 'row', 
  justifyContent: 'space-between', 
  alignItems: 'center',
  borderRadius: 16,
  },
  centeredView:{
    flex:1,
    zIndex: 5,
    backgroundColor: '#121212'
  },
  form: {
    flexDirection: 'column',
    paddingTop: 40,
    padding: 16,
    flex: 1,
    backgroundColor: '#121212',
  },
  input: {
    backgroundColor: '#4A4458',
    color: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
  },
  s: {
    color: '#CAC4D0',
    marginTop: 4,
    marginBottom: 8,
    fontSize: 12.6,
    fontFamily: 'poppins',
  },
  p: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'poppins',
  },
  h2Bold: {
    color: '#fff',
    fontSize: 26,
    fontFamily: 'poppinsBold',
    letterSpacing: -1.2,
  },
  inputBtn: {
    backgroundColor: '#554eeb',
    color: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#00314B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
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
    width: '60%',
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 1,
    paddingHorizontal: 16,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: '#dfdfdf',
    marginVertical: 16,
    shadowColor: '#554eeb',
    shadowOpacity: '50%',
    marginHorizontal: 16,
    width: '35%',
  },
  tagsScroll: {
    paddingTop: 16,
    backgroundColor: '#121212',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chipsItem: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: '#E1E5E8',
    borderRadius: 20,
    padding: 8,
    paddingHorizontal: 20,
    marginRight: 8,
    marginBottom: 16,
    height: 40,
  },
  eventText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'poppins',
    padding: 16,
  },
  btnPDark: {
    color:'#2c2c2c',
    paddingTop: 16,
    fontSize: 16,
    fontFamily: 'poppinsBold',
  },
  pBold: {
    color:'#CAC4D0',
    paddingTop: 16,
    fontSize: 16,
    fontFamily: 'poppinsBold',
  },
  modalP: {
    color: '#2c2c2c',
    fontSize: 16,
    fontFamily: 'poppins',
    padding: 8
  },
  });