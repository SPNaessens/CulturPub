import React,{ useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Image, ActivityIndicator } from 'react-native';
import { FIRESTORE_DB, storage,} from '../../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { uploadBytes, getDownloadURL, ref, deleteObject } from 'firebase/storage';

export default EditProfileScreen = ({ navigation, route }) => {
  const [ bio, setBio ] = useState('');
  const [ discipline, setDiscipline ] = useState('');
  const [ profilePic, setProfilePic ] = useState(null);
  const [ coverPhoto, setCoverPhoto ] = useState(null);
  const [ userName, setUserName ] = useState('');
  const [ isLoading, setIsLoading] = useState(false);
  const [ isLoadingProfile, setIsLoadingProfile] = useState(false);

  const deleteImage = async(imageURL) => {
    const deleteRef = ref(storage, imageURL);
    try {
      deleteObject(deleteRef).then(() => {
        setCoverPhoto(null);
        setProfilePic(null);
      })
    } catch (error) {
      alert(`Error : ${error}`);
    }
  };

  const onCancelProfile = () => {
    setBio('');
    setProfilePic(null);
    setCoverPhoto(null);
    setUserName('');
    setDiscipline('');
    navigation.goBack();
  }
  
  useEffect(() => {
    if (route.params?.profile) {
      const { bio, profilePic, coverPhoto, userName, discipline } = route.params.profile;
      setBio(bio);
      setProfilePic(profilePic);
      setCoverPhoto(coverPhoto);
      setUserName(userName);
      setDiscipline(discipline);
    }
  }, [route.params?.profile]);

  const chooseProfilePic = async () => {
    setIsLoadingProfile(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
     const uploadURL = await uploadProfilePic(result.assets[0].uri);
     setProfilePic(uploadURL);
     setImage(uploadURL);
     setInterval(() => {
      setIsLoading(false);
     }, 2000);
  } else {
    setProfilePic(null);
    setInterval(() => {
      setIsLoadingProfile(false);
     }, 2000);
  }
  };

  const chooseCoverPhoto = async () => {
    setIsLoading(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
     const uploadURL = await uploadCoverPhoto(result.assets[0].uri);
     setCoverPhoto(uploadURL);
     setInterval(() => {
      setIsLoading(false);
     }, 2000);
  } else {
    setCoverPhoto(null);
    setInterval(() => {
      setIsLoading(false);
     }, 2000);
  }
  };

  const uploadCoverPhoto = async (uri) => {
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
      const storageRef = ref(storage, `userCoverPhoto/image-${Date.now()}`)
      const result = await uploadBytes(storageRef, blob);

      blob.close();
      return await getDownloadURL(storageRef);
    }
catch (error){
  alert(`Error : ${error}`);
 }
};

  const uploadProfilePic = async (uri) => {
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
      const storageRef = ref(storage, `userProfilePic/image-${Date.now()}`)
      const result = await uploadBytes(storageRef, blob);

      blob.close();
      return await getDownloadURL(storageRef);
    }
catch (error){
  alert(`Error : ${error}`);
 }
};
  
const updateProfile = async () => {
  try {
    if (!route.params?.uid) {
      return;
    }

    const profileRef = doc(FIRESTORE_DB, `userProfile/${route.params.uid}`);
    const updatedProfileData = {
      bio: bio || 'NO BIO YET!!!',
      profilePic: profilePic || null,
      coverPhoto: coverPhoto || null,
      userName: userName || 'User name is missing',
      discipline: discipline || 'No Discipline Addded Yet',
    };

    await updateDoc(profileRef, updatedProfileData);
    setBio('');
    setProfilePic(null);
    setCoverPhoto(null);
    setUserName('');
    setDiscipline('');
    navigation.goBack();
  } catch (error) {
    Alert.alert('Failed to update profile!');
  }
};

  return(
    <ScrollView>
      <View style={styles.container}>

        <View style={styles.form}>
        <TouchableOpacity style={{position: 'absolute', right: 8, top: 0, padding: 16, zIndex: 2}} onPress={onCancelProfile}>
        <Ionicons name="close" style={ {fontSize:40, color:'#fff', }}/>
        </TouchableOpacity>
        <Text style={styles.h2Bold}>Update Your Profile</Text>
        <Text style={styles.p}>Username</Text>
        <TextInput
              style={styles.input}
              placeholder="UserName"
              placeholderTextColor="#fff"
              value={userName}
              onChangeText={setUserName}
            />
            <Text style={styles.p}>Discipline</Text>
        <TextInput
              style={styles.input}
              placeholder="What is your discipline?"
              placeholderTextColor="#fff"
              value={discipline}
              onChangeText={setDiscipline}
              />
            <Text style={styles.p}>Bio</Text>
            <TextInput
              style={styles.input}
              placeholder="Write your bio"
              placeholderTextColor="#fff"
              value={bio}
              onChangeText={setBio}
            />

        <Text style={styles.p}>Profile Picture</Text>
          { !profilePic ? (
            <>
            {isLoadingProfile ? (
              <View style={{ height: 200, alignContent: 'center',  }}>
                <ActivityIndicator animating size="large" style={{marginTop: 90}} />
              </View>
              
            ) : (     
            <TouchableOpacity onPress={chooseProfilePic}>
              <TextInput
                style={styles.inputBtn}
                placeholder="Choose profile picture"
                placeholderTextColor="#fff"
                editable={false}
              />
          </TouchableOpacity>)}</>
          ) : (
            <>
              {profilePic && (
                <TouchableOpacity onPress={chooseProfilePic}>
                  <View style={styles.imageContainer}>
                    <Ionicons name="close-outline" style={styles.icon} onPress={() => deleteImage(profilePic)}/>
                    <Image source={{ uri: profilePic }} style={styles.image} />
                  </View>
                </TouchableOpacity>

              )}
            </>
          )}

      <Text style={styles.p}>Cover Photo</Text>

          { !coverPhoto ? (
            <>
            {isLoading ? (
              <View style={{ height: 200, alignContent: 'center',  }}>
                <ActivityIndicator animating size="large" style={{marginTop: 90}} />
              </View>
              
            ) : (
          <TouchableOpacity onPress={chooseProfilePic}>
              <TextInput
                style={styles.inputBtn}
                placeholder="Choose cover photo"
                placeholderTextColor="#fff"
                editable={false}
              />
          </TouchableOpacity>
          )}
          </>
          ) : (
            <>
              {coverPhoto && (
                <TouchableOpacity onPress={chooseCoverPhoto}>
                  <View style={styles.imageContainer}>
                    <Ionicons name="close-outline" style={styles.icon} onPress={() => deleteImage(coverPhoto)} />
                    <Image source={{ uri: coverPhoto }} style={styles.image} />
                  </View>
                </TouchableOpacity>

              )}
            </>
          )}

          <View style={{flexDirection: 'row',}}>
          <TouchableOpacity style={styles.btn} onPress={updateProfile}> 
            <Text style={styles.eventText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary}> 
            <Text style={styles.p} onPress={onCancelProfile}>Cancel</Text>
          </TouchableOpacity>
          </View>
          </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    height: '100%',
  },
  form: {
    flexDirection: 'column',
    marginTop: 32,
    marginBottom: 64,
    padding: 20,
  },
  inputBtn: {
    backgroundColor: '#530DE9',
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
  input: {
    backgroundColor: '#4A4458',
    color: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
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
  icon: {
    color: '#fff',
    fontSize: 40,
    position: 'absolute',
    zIndex: 2,
    top: 8,
    right: 8,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: '100%',
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
  eventText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'poppins',
    padding: 16,
  },
});