import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FIRESTORE_DB, auth } from '../../firebaseConfig';
import { onSnapshot, doc, updateDoc, getDoc } from 'firebase/firestore';

export default function ProfileLandingScreen({ navigation, route }) {
    const { userProfile } = route.params;
    const [ updatedFollowing, setUpdatedFollowing ] = useState([]);
    const [ isUserFollowed, setIsUserFollowed ] = useState(false);

    useEffect(() => {
      const unsubscribe = onSnapshot(doc(FIRESTORE_DB, 'userProfile', auth.currentUser.uid), (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userProfileData = docSnapshot.data();
          const updatedFollowing = userProfileData.following || [];
          setUpdatedFollowing(updatedFollowing);
          setIsUserFollowed(updatedFollowing.includes(userProfile.uid));
        }
      });
  
      return () => {
        unsubscribe();
      };
    }, [userProfile.uid]);

    const handleFollow = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const followedUserId = route.params.userProfile.uid;
          const userProfileRef = doc(FIRESTORE_DB, 'userProfile', userId);
          const followedUserProfileRef = doc(FIRESTORE_DB, 'userProfile', followedUserId);
          const userProfileSnapshot = await getDoc(userProfileRef);
          const followedUserProfileSnapshot = await getDoc(followedUserProfileRef);
    
          if (userProfileSnapshot.exists() && followedUserProfileSnapshot.exists()) {
            const userProfileData = userProfileSnapshot.data();
            const followedUserProfileData = followedUserProfileSnapshot.data();
            const updatedFollowing = userProfileData.following || [];
            updatedFollowing.push(followedUserId);
            const updatedTokens = userProfileData.tokens || [];
            updatedTokens.push(userProfileData.expoPushToken || '');
            await updateDoc(followedUserProfileRef, {
              tokens: updatedTokens,
              followed: updatedFollowing
            });
    
            await updateDoc(userProfileRef, { following: updatedFollowing });
          }
        }
      } catch (error) {
      }
    };

    const handleUnfollow = async (unFollowUserId) => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userId = user.uid;
          const userProfileRef = doc(FIRESTORE_DB, 'userProfile', userId);
          const userProfileSnapshot = await getDoc(userProfileRef);
    
          if (userProfileSnapshot.exists()) {
            const userProfileData = userProfileSnapshot.data();
            const updatedFollowing = userProfileData.following || [];
            const filteredFollowing = updatedFollowing.filter(id => id !== unFollowUserId);
            await updateDoc(userProfileRef, { following: filteredFollowing });
          }
        }
      } catch (error) {
      }
    };
    
  
    return (
      <ScrollView style={{backgroundColor: '#2B2930'}}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconContainer} >
          <Ionicons style={styles.icon} name="arrow-back-outline" />
        </TouchableOpacity>
        <View>
        {userProfile?.coverPhoto && (
          <Image source={{ uri: userProfile.coverPhoto }} style={styles.coverPhoto} />
        )}
                {userProfile?.profilePic && (
          <Image source={{ uri: userProfile.profilePic }} style={styles.profilePic} />
        )}
        </View>
  
  <View style={styles.container}>
        <Text style={styles.h3Bold}>{userProfile.userName || 'Username'}</Text>
        <Text style={styles.pBold}>Bio</Text>
        <Text style={styles.p}>{userProfile?.bio}</Text>

        <View style={styles.btnContainer}>
        {isUserFollowed ? (
            <TouchableOpacity style={styles.btnSecondary} onPress={ () => handleUnfollow(route.params.userProfile.uid)}>
              <Text style={styles.btnP}>Unfollow</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.btn} onPress={handleFollow}>
              <Text style={styles.btnP}>Follow</Text>
            </TouchableOpacity>
          )}
        </View>
        </View>
      </ScrollView>
    );
  }
  
const styles = StyleSheet.create({
  iconContainer:{
    borderRadius: 100,
    backgroundColor: '#2B2930',
    opacity: .5,
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
btnContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  marginTop: 10,
  marginBottom: 100
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
    btn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      paddingHorizontal: 16,
      backgroundColor: '#554eeb',
      marginVertical: 16,
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
      marginHorizontal: 8
    },
    btnText: {
      fontSize: 17,
      lineHeight: 24,
      fontWeight: '600',
      color: '#2c2c2c',
    },
    coverPhoto: {
      width: '100%',
      aspectRatio: 16/12,
      position: 'absolute',
    
    },
    profilePic: {
      height: 112,
      width: 112,
      borderRadius: 100,
      padding: 8,
      position: 'absolute',
      top: 60,
      right: 16,
      zIndex: 5
    },
    h1Bold: {
      color: '#FFF',
      padding: 10,
      fontSize: 33,
      fontFamily: 'poppinsBold'
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
      color: '#FFF',
      paddingTop: 16,
      fontSize: 20.4,
      fontFamily: 'poppinsBold'
    },
    h3: {
      color: '#fff',
      fontSize: 20.4,
      fontFamily: 'poppins',
      marginLeft: 128,
      marginTop: 16
    },
    pBold: {
      color: '#fff',
      paddingTop: 16,
      fontSize: 16,
      fontFamily: 'poppinsBold',
    },
    p: {
      color: '#fff',
      paddingTop: 8,
      fontSize: 16,
      fontFamily: 'poppins',
    },
    btnP: {
      color: '#fff',
      padding: 10,
      fontSize: 16,
      fontFamily: 'poppins'
    },
    s: {
      color: '#8193A2',
      fontSize: 12.6,
      fontFamily: 'poppins'
    },
    });