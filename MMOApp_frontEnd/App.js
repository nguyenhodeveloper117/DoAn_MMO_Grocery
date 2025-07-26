import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./components/Home/Home";
import Login from "./components/User/Login";
import Register from "./components/User/Register";
import Profile from "./components/User/Profile";
import ForgotPassword from "./components/User/ForgotPassword";
import MyStyles from "./styles/MyStyles";
import { TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, IconButton } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "./configs/Contexts";
import { useContext, useReducer } from "react";
import MyUserReducer from "./reducers/MyUserReducer";



const HomeStack = createNativeStackNavigator();
const HomeNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="home" component={Home} options={{
        title: 'Tạp hoá MMO',
        headerTitleStyle: {
          ...MyStyles.header,
        },
        headerRight: () => (
            <TouchableOpacity onPress={() => console.log('Nhắn tin')}>
              <IconButton icon="message" size={24} />
            </TouchableOpacity>
          ),
        }} 
      />
    </HomeStack.Navigator>
  );
}

const LoginStack = createNativeStackNavigator();
const LoginNavigator = () => (
  <LoginStack.Navigator>
    <LoginStack.Screen name="loginScreen" component={Login} options={{
      title: 'Đăng nhập',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <LoginStack.Screen name="forgotPassword" component={ForgotPassword} options={{
      title: 'Quên mật khẩu',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <LoginStack.Screen name="register" component={Register} options={{
      title: 'Đăng ký',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
  </LoginStack.Navigator>
);

const ProfileStack = createNativeStackNavigator();
const ProfileNavigator = () => (
  <ProfileStack.Navigator>
    <ProfileStack.Screen name="profile" component={Profile} options={{
      title: 'Tài khoản',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
  </ProfileStack.Navigator>
);

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator >
      <Tab.Screen name="index" component={HomeNavigator} options={{ headerShown: false, title: "Sản phẩm", tabBarIcon: () => <Icon size={30} source="home" /> }} />

      {user === null ? <>
        <Tab.Screen name="login" component={LoginNavigator} options={{ headerShown: false, title: "Đăng nhập", tabBarIcon: () => <Icon size={30} source="account" /> }} />
      </> : <>
        <Tab.Screen name="profile" component={ProfileNavigator} options={{ headerShown: false, title: "Tài khoản", tabBarIcon: () => <Icon size={30} source="account" /> }} />
      </>}
    </Tab.Navigator>
  );
}

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <NavigationContainer>
          <TabNavigator />
        </NavigationContainer>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
}

export default App;