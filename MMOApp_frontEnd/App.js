import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Home from "./components/Home/Home"
import Login from "./components/User/Login";
import Register from "./components/User/Register";
import Profile from "./components/User/Profile";
import MMOForum from "./components/Forum/MMOForum";
import UpdateUser from "./components/User/UpdateUser";
import Verification from "./components/User/Verification";
import ForgotPassword from "./components/User/ForgotPassword";
import MyStyles from "./styles/MyStyles";
import { TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Icon, IconButton, PaperProvider } from "react-native-paper";
import { MyDispatchContext, MyUserContext } from "./configs/Contexts";
import { useContext, useReducer } from "react";
import MyUserReducer from "./reducers/MyUserReducer";
import Terms from "./components/User/Terms";
import UpdateVerification from "./components/User/UpdateVerification";
import StoreSeller from "./components/Store/StoreSeller";
import UpdateStore from "./components/Store/UpdateStore";
import AddProduct from "./components/Store/AddProduct";
import ProductDetail from "./components/Store/ProductDetail";
import UpdateProduct from "./components/Store/UpdateProduct";
import AddForum from "./components/Forum/AddForum";
import UpdateForum from "./components/Forum/UpdateForum";
import MyForums from "./components/Forum/MyForums";
import ForumDetail from "./components/Forum/ForumDetail";
import Voucher from "./components/Store/VoucherStore";
import Stock from "./components/Store/Stock";
import HomeProductDetail from "./components/Home/HomeProductDetail";
import UserOrder from "./components/Order/UserOrder";
import OrderDetail from "./components/Order/Orderdetail";
import StoreOrder from "./components/Store/StoreOrder";
import StoreOrderDetail from "./components/Store/StoreOrderDetail";
import FavoriteProducts from "./components/User/FavouriteProduct";
import OrderComplaint from "./components/Order/OrderComplaint";
import HomeStoreProduct from "./components/Home/HomeStoreProduct";
import ConversationList from "./components/Chat/ConversationList";
import ChatBox from "./components/Chat/ChatBox";
import FlashMessage from "react-native-flash-message";
import Transaction from "./components/User/Transaction";




const HomeStack = createNativeStackNavigator();
const HomeNavigator = () => {
  const user = useContext(MyUserContext);
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="home" component={Home} options={({ navigation }) => ({
        title: 'Tạp hoá MMO',
        headerTitleStyle: {
          ...MyStyles.header,
        },
        headerRight: () => (
          user ? (
            <TouchableOpacity onPress={() => navigation.navigate("conversationList")}>
              <IconButton icon="message" size={24} />
            </TouchableOpacity>
          ) : null
        ),
      })} />
      <HomeStack.Screen
        name="conversationList" component={ConversationList} options={{
          title: 'Các cuộc trò chuyện',
          headerTitleStyle: {
            ...MyStyles.header,
          }
        }} />
      <HomeStack.Screen
        name="chatBox" component={ChatBox} options={{
          title: 'Cuộc trò chuyện',
          headerTitleStyle: {
            ...MyStyles.header,
          }
        }} />
      <LoginStack.Screen name="homeProductDetail" component={HomeProductDetail} options={{
        title: 'Chi tiết sản phẩm',
        headerTitleStyle: {
          ...MyStyles.header,
        }
      }} />
      <LoginStack.Screen name="homeStoreProduct" component={HomeStoreProduct} options={{
        title: 'Gian hàng người bán',
        headerTitleStyle: {
          ...MyStyles.header,
        }
      }} />
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
    <ProfileStack.Screen name="terms" component={Terms} options={{
      title: 'Điều khoản và Chính sách',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ProfileStack.Screen name="updateVerification" component={UpdateVerification} options={{
      title: 'Cập nhật xác minh',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ProfileStack.Screen name="favoriteProducts" component={FavoriteProducts} options={{
      title: 'Sản phẩm đã thích',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ProfileStack.Screen name="homeProductDetail" component={HomeProductDetail} options={{
      title: 'Chi tiết sản phẩm',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <LoginStack.Screen name="homeStoreProduct" component={HomeStoreProduct} options={{
      title: 'Gian hàng người bán',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <HomeStack.Screen
      name="chatBox" component={ChatBox} options={{
        title: 'Cuộc trò chuyện',
        headerTitleStyle: {
          ...MyStyles.header,
        }
      }} />
    <HomeStack.Screen
      name="transaction" component={Transaction} options={{
        title: 'Giao dịch',
        headerTitleStyle: {
          ...MyStyles.header,
        }
      }} />
  </ProfileStack.Navigator>
);

const ForumStack = createNativeStackNavigator();
const MMOForumNavigator = () => (
  <ForumStack.Navigator>
    <ForumStack.Screen name="blogPost" component={MMOForum} options={{
      title: 'Diễn đàn',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ForumStack.Screen name="myBlogs" component={MyForums} options={{
      title: 'Bài viết của bạn',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ForumStack.Screen name="blogCreate" component={AddForum} options={{
      title: 'Tạo bài viết',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ForumStack.Screen name="blogUpdate" component={UpdateForum} options={{
      title: 'Cập nhật bài viết',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <ForumStack.Screen name="blogDetail" component={ForumDetail} options={{
      title: 'Chi tiết bài viết',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
  </ForumStack.Navigator>
);

const StoreStack = createNativeStackNavigator();
const StoreNavigator = () => (
  <StoreStack.Navigator>
    <StoreStack.Screen name="storeSeller" component={StoreSeller} options={{
      title: 'Cửa hàng',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <StoreStack.Screen name="updateStore" component={UpdateStore} options={{
      title: 'Chỉnh sửa gian hàng',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <StoreStack.Screen name="addProduct" component={AddProduct} options={{
      title: 'Tạo sản phẩm',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <StoreStack.Screen name="productDetail" component={ProductDetail} options={{
      title: 'Chi tiết sản phẩm',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <StoreStack.Screen name="updateProduct" component={UpdateProduct} options={{
      title: 'Cập nhật sản phẩm',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <StoreStack.Screen name="stocks" component={Stock} options={{
      title: 'Kho sản phẩm',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <StoreStack.Screen name="vouchers" component={Voucher} options={{
      title: 'Quản lí voucher',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <StoreStack.Screen name="storeOrder" component={StoreOrder} options={{
      title: 'Quản lí đơn hàng',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <OrderStack.Screen name="storeOrderDetail" component={StoreOrderDetail} options={{
      title: 'Chi tiết đơn hàng',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <OrderStack.Screen name="homeProductDetail" component={HomeProductDetail} options={{
      title: 'Chi tiết sản phẩm',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <OrderStack.Screen name="orderComplaint" component={OrderComplaint} options={{
      title: 'Khiếu nại',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <LoginStack.Screen name="homeStoreProduct" component={HomeStoreProduct} options={{
      title: 'Gian hàng người bán',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <HomeStack.Screen
      name="chatBox" component={ChatBox} options={{
        title: 'Cuộc trò chuyện',
        headerTitleStyle: {
          ...MyStyles.header,
        }
      }} />
  </StoreStack.Navigator>
);

const OrderStack = createNativeStackNavigator();
const UserOrderNavigator = () => (
  <OrderStack.Navigator>
    <OrderStack.Screen name="userOrder" component={UserOrder} options={{
      title: 'Đơn hàng của tôi',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <OrderStack.Screen name="orderDetail" component={OrderDetail} options={{
      title: 'Chi tiết đơn hàng',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <OrderStack.Screen name="homeProductDetail" component={HomeProductDetail} options={{
      title: 'Chi tiết sản phẩm',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <OrderStack.Screen name="orderComplaint" component={OrderComplaint} options={{
      title: 'Khiếu nại',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <LoginStack.Screen name="homeStoreProduct" component={HomeStoreProduct} options={{
      title: 'Gian hàng người bán',
      headerTitleStyle: {
        ...MyStyles.header,
      }
    }} />
    <HomeStack.Screen
      name="chatBox" component={ChatBox} options={{
        title: 'Cuộc trò chuyện',
        headerTitleStyle: {
          ...MyStyles.header,
        }
      }} />
  </OrderStack.Navigator>
);

const Tab = createBottomTabNavigator();
const TabNavigator = () => {
  const user = useContext(MyUserContext);
  return (
    <Tab.Navigator >
      <Tab.Screen name="index" component={HomeNavigator} options={{ headerShown: false, title: "Home", tabBarIcon: () => <Icon size={30} source="home" /> }} />
      <Tab.Screen name="forum" component={MMOForumNavigator} options={{ headerShown: false, title: "Diễn đàn", tabBarIcon: () => <Icon size={30} source="forum" /> }} />
      {user === null ? <>
        <Tab.Screen name="login" component={LoginNavigator} options={{ headerShown: false, title: "Đăng nhập", tabBarIcon: () => <Icon size={30} source="account" /> }} />
      </> : (
        <>
          {user?.role === "seller" && (
            <Tab.Screen name="store" component={StoreNavigator} options={{ headerShown: false, title: "Cửa hàng", tabBarIcon: () => <Icon size={30} source="store" /> }} />
          )}
          <Tab.Screen name="order" component={UserOrderNavigator} options={{ headerShown: false, title: "Đơn hàng", tabBarIcon: () => <Icon size={30} source="cart" /> }} />
          <Tab.Screen name="profile" component={ProfileNavigator} options={{ headerShown: false, title: "Tài khoản", tabBarIcon: () => <Icon size={30} source="account" /> }} />
        </>
      )}
    </Tab.Navigator>
  );
};

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <PaperProvider>
          <NavigationContainer>
            <TabNavigator />
          </NavigationContainer>
          <FlashMessage position="top" />
        </PaperProvider>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>
  );
}

export default App;