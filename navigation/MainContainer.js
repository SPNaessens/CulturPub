
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';


import HomeScreen from './screens/HomeScreen';
import CreateEventScreen from './screens/CreateEventScreen';
import AlertsScreen from './screens/AlertsScreen';
import ProfileScreen from './screens/ProfileScreen';
import ExploreScreen from './screens/ExploreScreen';
import LoginScreen from './screens/LoginScreen';
import EventLandingPage from './screens/EventLandingScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import ProfileLandingScreen from './screens/ProfileLandingScreen';
import EditEventScreen from './screens/EditEventScreen';
import MapScreen from './screens/MapScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const ExploreName = 'Explore';
const HomeName = 'My Events';
const createEventName = 'Create Event';
const alertsName = 'Alerts';
const profileName = 'Profile';
const editEventName = 'EditEvent';
const loginName = 'Login';
const eventLandingName = 'EventLanding';
const editProfileName = 'EditProfile';
const profileLandingname = 'profileLanding';
const mapName = 'Map';

export default function MainContainer() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
      <Stack.Screen name={loginName} component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name='TabNavigator' component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name={createEventName} component={CreateEventScreen} options={{ headerShown: false }} />
        <Stack.Screen name={editEventName} component={EditEventScreen} options={{ headerShown: false }} />
        <Stack.Screen name={HomeName} component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name={eventLandingName} component={EventLandingPage} options={{ headerShown: false }} />
        <Stack.Screen name={editProfileName} component={EditProfileScreen} options={{ headerShown: false }} />
        <Stack.Screen name={profileLandingname} component={ProfileLandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name={ExploreName} component={ExploreScreen} options={{headerShown: false }} />
        <Stack.Screen name={mapName} component={MapScreen} options={{headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName={ExploreName}
      screenOptions={({ route }) => ({
        tabBarStyle: { position: 'absolute', backgroundColor:'#36343B', height: 72, borderRadius: 50, margin: 4, borderTopWidth:0 },
        tabBarShowLabel: true,
        tabBarLabelStyle: {marginTop: -5, marginBottom: 6, color: '#fff'},
        activeTintColor: '#fff',
        inactiveTintColor: '#fff',
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          let rn = route.name;

          if (rn === HomeName) {
            iconName = focused ? 'calendar' : 'calendar-outline';
            color= focused ? '#fff' : '#fff';
          } else if (rn === ExploreName) {
            iconName = focused ? 'compass' : 'compass-outline';
            color= focused ? '#fff' : '#fff';
          }else if (rn === createEventName) {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
            color= focused ? '#fff' : '#fff';
            size= 45;
          }  else if (rn === alertsName) {
            iconName = focused ? 'notifications' : 'notifications-outline';
            color= focused ? '#fff' : '#fff';
          } else if (rn === profileName) {
            iconName = focused ? 'person' : 'person-outline';
            color= focused ? '#fff' : '#fff';
          }

          return <Icon name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name={ExploreName} component={ExploreScreen} options={{ headerShown: false }} />
      <Tab.Screen name={HomeName} component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen name={createEventName} component={CreateEventScreen} options={{ headerShown: false}} />
      <Tab.Screen name={alertsName} component={AlertsScreen} options={{ headerShown: false }} />
      <Tab.Screen name={profileName} component={ProfileScreen} options={{ headerShown: false }} />
      <Tab.Screen name={mapName} component={MapScreen} options={{ headerShown: false, tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}
