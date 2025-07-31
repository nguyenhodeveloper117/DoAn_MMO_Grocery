import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./components/Home/Home"
import Login from "./components/User/Login";
import Register from "./components/User/Register";
import Profile from "./components/User/Profile";
import MMOForum from "./components/Forum/MMOForum";
import ChatBox from "./components/Chat/ChatBox";
import UpdateUser from "./components/User/UpdateUser";
import Verification from "./components/User/Verification";
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
      <HomeStack.Screen
        name="home"
        component={Home}
        options={({ navigation }) => ({ // Truyền navigation vào options
          title: 'Tạp hoá MMO',
          headerTitleStyle: {
            ...MyStyles.header,
          },
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate("chat")}>
              <IconButton icon="message" size={24} />
            </TouchableOpacity>
          ),
        })}
      />
      <HomeStack.Screen
        name="chat"
        component={ChatBox}
        options={{
          title: 'ChatBox',
          headerTitleStyle: {
            ...MyStyles.header,
          }
        }}
      />
    </HomeStack.Navigator>
  );
};

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
    <ProfileStack.Screen name="profileDetails" component={Profile} options={{
      title: 'Tài khoản',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ProfileStack.Screen name="updateUser" component={UpdateUser} options={{
      title: 'Cập nhật User',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ProfileStack.Screen name="kyc" component={Verification} options={{
      title: 'Xác minh KYC',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
  </ProfileStack.Navigator>
);

const ForumStack = createNativeStackNavigator();
const MMOForumNavigator = () => (
  <ForumStack.Navigator>
    <ForumStack.Screen name="forumDetails" component={MMOForum} options={{
      title: 'Diễn đàn',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
  </ForumStack.Navigator>
);

// const OrderStack = createNativeStackNavigator();
// const OrderNavigator = () => (
//   <OrderStack.Navigator>
//     <OrderStack.Screen name="orderDetails" component={OrderDetails} options={{
//       title: 'Đơn hàng đã mua',
//       headerTitleStyle: {
//         ...MyStyles.header,
//       }
//     }} />
//   </OrderStack.Navigator>
// );

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator >
      <Tab.Screen name="index" component={HomeNavigator} options={{ headerShown: false, title: "Home", tabBarIcon: () => <Icon size={30} source="home" /> }} />
      <Tab.Screen name="forum" component={MMOForumNavigator} options={{ headerShown: false, title: "Diễn đàn", tabBarIcon: () => <Icon size={30} source="forum" /> }} />
      {user === null ? <>
        <Tab.Screen name="login" component={LoginNavigator} options={{ headerShown: false, title: "Đăng nhập", tabBarIcon: () => <Icon size={30} source="account" /> }} />
      </> : <>
        {/* <Tab.Screen name="order" component={OrderNavigator} options={{ headerShown: false, title: "Đơn hàng", tabBarIcon: () => <Icon size={30} source="cart" /> }} /> */}
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