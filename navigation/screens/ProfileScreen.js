import { useEffect, useState } from 'react';
import {View, Text, TouchableOpacity, StyleSheet, ScrollView, Image} from 'react-native';
import { FIRESTORE_DB, auth } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { onSnapshot, doc } from 'firebase/firestore';
import defaultProfilePic from '../../img/dpp.jpg';
import defaultCoverPhoto from '../../img/dcp.jpg';

export default function ProfileScreen({}) {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const profileRef = doc(FIRESTORE_DB, `userProfile/${auth.currentUser.uid}`);
    const subscriber = onSnapshot(
      profileRef,
      (doc) => {
        if (doc.exists()) {
          setProfile(doc.data());
        } else {
        }
      },
      (error) => {
      }
    );
  
    return () => {
      subscriber();
    };
  }, []);

  const handleLogOut = () => {
    auth
      .signOut()
      .then(() => {
        navigation.replace('Login');
      })
      .catch((error) => alert(error.message));
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile: profile, uid: auth.currentUser.uid });
  };  

  return (
    <ScrollView style={{flexGrow: 1, paddingBottom: 200, backgroundColor: '#2B2930'}} >
      <View >
        { profile ? (
          <View>
              {profile.coverPhoto ? (
                <Image
                  source={{ uri: profile.coverPhoto }}
                  style={styles.coverPhoto}
                />
              ) : (
                <Image
                  source={defaultCoverPhoto}
                  style={styles.coverPhoto}
                />
              )}

{profile.profilePic ? (
                    <Image
                      source={{ uri: profile.profilePic }}
                      style={styles.profilePic}
                    />
                  ) : (
                    <Image
                      source={defaultProfilePic}
                      style={styles.profilePic}
                    />
                  )}

        <View style={styles.container}>                    
            <Text style={styles.h3Bold}>{profile?.userName || 'Username'}</Text>
            <Text style={styles.p}>{profile.discipline}</Text>
            <Text style={{...styles.sBold, marginTop: 16}}>Bio</Text>
            <Text style={styles.s}>{profile.bio}</Text>

              <View style={{flexDirection: 'row', marginTop: 16, marginBottom: 200}}>
                <TouchableOpacity style={styles.btn} onPress={handleEditProfile}> 
                  <Text style={styles.eventText} >Edit Profile</Text>
                </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={handleLogOut}> 
                <Text style={{...styles.eventText}} >Log Out</Text>
              </TouchableOpacity>
              </View>
            </View>
            </View>
        ) : (
          <View>
        </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
eventText: {
  color: '#fff',
  fontSize: 16,
  fontFamily: 'poppins',
  paddingHorizontal: 16,
  paddingVertical: 12
},
container: {
  flexGrow: 1,
  backgroundColor: '#2B2930',
  flex: 1,
  paddingHorizontal: 16,
  paddingTop: 16,
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  marginTop: 180,
},
button: {
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0782F9',
    width: '60%',
    marginTop: 40
},
buttonText: {
    color: '#fff',
    fontWeight: 700,
    fontSize: 16,
},
icon: {
  color: '#2c2c2c',
  padding: 20,
  fontSize: 30,
  position: 'absolute',
  top: 0,
  right: 8,
  zIndex: 5
  },
btn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  paddingHorizontal: 16,
  backgroundColor: '#554eeb',
  marginVertical: 16,
  shadowColor: '#554eeb',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.5,
  shadowRadius: 15,
  elevation: 8,
  marginRight: 8
},
btnSecondary: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  paddingVertical: 1,
  paddingHorizontal: 16,
  borderWidth: 3,
  borderColor: '#dfdfdf',
  marginVertical: 14,
  marginHorizontal: 16
},
coverPhoto: {
  width: '100%',
  aspectRatio: 16/12,
  position: 'absolute',

},
profilePic: {
  height: 96,
  width: 96,
  borderRadius: 100,
  padding: 8,
  position: 'absolute',
  top: 80,
  left: 4
},
h1: {
  color: '#FFF',
  padding: 10,
  fontSize: 33,
  fontFamily: 'poppins'
},
h2Bold: {
  color: '#FFF',
  padding: 10,
  fontSize: 26,
  fontFamily: 'poppinsBold'
},
h2: {
  color: '#FFF',
  padding: 10,
  fontSize: 26,
  fontFamily: 'poppins'
},
h3Bold: {
  color: '#fff',
  fontSize: 20.4,
  fontFamily: 'poppinsBold',
},
h3: {
  color: '#2c2c2c',
  fontSize: 20.4,
  fontFamily: 'poppins',
},
pBold: {
  color: '#FFF',
  fontSize: 16,
  fontFamily: 'poppinsBold'
},
p: {
  color: '#CAC4D0',
  fontSize: 16,
  fontFamily: 'poppins',
},
pDark: {
  color: '#22222E',
  fontSize: 16,
  fontFamily: 'poppins'
},
sBold: {
  color: '#fff',
  fontSize: 12.6,
  fontFamily: 'poppinsBold'
},
s: {
  color: '#CAC4D0',
  fontSize: 12.6,
  fontFamily: 'poppins'
},
btnP: {
  color: '#fff',
  padding: 10,
  fontSize: 16,
  fontFamily: 'poppinsBold'
},
btnPS: {
  color: '#2c2c2c',
  padding: 10,
  fontSize: 16,
  fontFamily: 'poppinsBold'
},
pBio: {
  color: '#2c2c2c',
  fontSize: 16,
  fontFamily: 'poppins',
},
})