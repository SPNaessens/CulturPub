import React,{ useState, useEffect } from 'react'
import { Text, StyleSheet, View, TextInput, TouchableOpacity, Image, Alert } from 'react-native'
import { auth, signInWithEmailAndPassword,createUserWithEmailAndPassword, FIRESTORE_DB } from '../../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { TabView, TabBar } from 'react-native-tab-view';
import logoforlogin from '../../img/logoforlogin.png';
import { getExpoPushTokenAsync } from 'expo-notifications';
import { sendPasswordResetEmail } from 'firebase/auth';

const LoginScreen = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [userName, setUserName] = useState('')
    const [ resetModal, setResetModal ] = useState(false);
    const navigation = useNavigation()
    const [index, setIndex] = React.useState(0);
    const [routes] = React.useState([
      { key: 'first', title: 'Login' },
      { key: 'second', title: 'Register' },
    ]);

    const projectId = "6e41445c-7418-4423-89e0-c1e5ad43ebad";

    useEffect(() => {
      
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                navigation.replace('TabNavigator')
            }
        })

        return unsubscribe
    }, []);

    const changePassword = async () => {
      try {
        if (!email) {
          Alert.alert('Write your email in the email field to reset the password.');
        }
        await sendPasswordResetEmail(auth, email);
      } catch (error) {
      }
    };
    

    async function updateProfileWithPushToken(token) {
        try {
          const userUid = auth.currentUser ? auth.currentUser.uid : null;
          const profileRef = doc(FIRESTORE_DB, `userProfile/${userUid}`);
          if ( userUid !== null ) {await updateDoc(profileRef, { expoPushToken: token || 'no token' });}
        } catch (error) {
        }
      }

    const renderScene = ({ route }) => {
        switch (route.key) {
          case 'first':
            return (
                <View style={styles.formContainer} behavior="padding">
                <View style={styles.inputContainer}>
                    <TextInput 
                    placeholder="Email" 
                    placeholderTextColor={'#fff'} 
                    value={email} 
                    onChangeText={text => setEmail(text.trim())}
                    style={styles.input}
                    />
                </View>
                <View style={styles.inputContainer}>
                    <TextInput 
                    placeholder="Password"
                    placeholderTextColor={'#fff'} 
                    value={password} 
                    onChangeText={text => setPassword(text)}
                    style={styles.input}
                    secureTextEntry
                    />
                </View>
                    <TouchableOpacity onPress={handleLogin} style={styles.button}>
                        <Text style={styles.buttonText}>Login</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.reset} onPress={() => changePassword()}>

                      <Text style={styles.forgotP}>Reset Password</Text>
                    </TouchableOpacity>
              </View>
            );
          case 'second':
            case 'second':
              return (
                <View style={styles.formContainer} behavior="padding">
                    <View style={styles.inputContainer}>
                        <TextInput placeholder="Email" 
                        placeholderTextColor={'#fff'} 
                        value={email} 
                        onChangeText={text => setEmail(text.trim())}
                        style={styles.input}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput placeholder="Password"
                        placeholderTextColor={'#fff'} 
                        value={password} 
                        onChangeText={text => setPassword(text)}
                        style={styles.input}
                        secureTextEntry
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <TextInput placeholder="Username"
                        placeholderTextColor={'#fff'} 
                        value={userName} 
                        onChangeText={text => setUserName(text)}
                        style={styles.input}
                        />
                    </View>

                        <TouchableOpacity onPress={handleSignUp} style={styles.button}>
                            <Text style={[ styles.buttonText]}>Register</Text>
                        </TouchableOpacity>
                </View>
              );
          default:
            return null;
        }
      };

    const handleLogin = () => {
        signInWithEmailAndPassword(auth, email, password)
          .then(async (userCredentials) => {
            const user = userCredentials.user;
            const profileRef = doc(FIRESTORE_DB, `userProfile/${user.uid}`);
            const profileData = {
              bio: 'Write your bio here',
              profilePic: null,
              coverPhoto: null,
            };
            const profileSnapshot = await getDoc(profileRef);
            if (!profileSnapshot.exists()) {
              await setDoc(profileRef, profileData);
            }
          })
          .catch((error) => {
            alert('Wrong Email or Password!');
          });
      };

      const handleSignUp = async () => {
        if (userName === '') {
            alert('Please enter a username.');
            return;
          }
        try {
          const userCredentials = await createUserWithEmailAndPassword(auth, email, password, userName);
          const user = userCredentials.user;
          const expoPushToken = await getExpoPushTokenAsync({projectId});
          const userProfileRef = doc(FIRESTORE_DB, `userProfile/${user.uid}`);
          const userProfileData = {
            bio: 'NO BIO YET',
            profilePic: null,
            coverPhoto: null,
            userName: userName,
            uid: user.uid,
            expoPushToken: expoPushToken.data || 'No token :-(',
            followed: [],
            following: [],
            email: user.email,
          };
          await setDoc(userProfileRef, userProfileData);
          updateProfileWithPushToken(expoPushToken);
        } catch (error) {
          alert(error.message);
        }
      };

    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image source={logoforlogin} style={styles.loginLogo}/>
            </View>
            <View style={styles.loginTabs}>
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
        </View>
    )
}

export default LoginScreen

const styles = StyleSheet.create({
    forgotP: {
      color: '#fff',
      fontSize: 16,
      fontFamily: 'poppins',
      paddingVertical: 32
    },
    reset: {
      width: '100%', alignItems: 'center', justifyContent: 'center' 
    },
    p: {
      color: '#CAC4D0',
      fontSize: 16,
      fontFamily: 'poppins',
    },
    imageContainer: {
        width: '100%',
        height: '20%',
        marginTop: '60%',
        justifyContent: 'center',
        alignItems: 'center'
    },
    formContainer: {
        justifyContent: 'center',
        alignItems: 'flex-start',
        flexGrow: 1,
        backgroundColor: '#2B2930',
        paddingVertical: 10,
        paddingHorizontal: 16,
        width: '100%',
        position: 'absolute',
        top: 16,
    },
    loginLogo:{ 
        width: 350, 
        height: 88, 
        marginVertical: 48
    },
    loginTabs: {
        width: '100%',
        height: '100%',
        backgroundColor: '#2B2930',
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flexGrow: 1,
        backgroundColor: '#121212',
        paddingVertical: 10,
    },
    inputContainer: {
        backgroundColor: '#4A4458',
        color: '#2c2c2c',
        borderRadius: 16,
        marginBottom: 16,
        padding: 16,
        width: '100%'
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        paddingVertical: 4,
        paddingHorizontal: 16,
        backgroundColor: '#554eeb',
        width: '50%',
        height: 56
    },
    buttonText: {
        color: '#fff',
        padding: 10,
        fontSize: 16,
        fontFamily: 'poppinsBold'
    },
    input: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'poppins'
    }
});