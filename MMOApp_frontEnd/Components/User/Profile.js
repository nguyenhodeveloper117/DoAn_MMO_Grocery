import { useContext } from "react";
import { Text, View, Image, StyleSheet, ScrollView } from "react-native";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import { Alert } from "react-native";
import MyStyles from "../../styles/MyStyles";
import styles from "./UserStyle";
import AsyncStorage from "@react-native-async-storage/async-storage";


const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();

    const onBecomeSeller = async () => {
        if (!user.is_verified) {
            Alert.alert("Thông báo", "Bạn cần xác minh KYC trước khi trở thành người bán.");
            return;
        }

        if (user.role !== "customer") {
            Alert.alert("Thông báo", "Bạn cần phải có vai trò customer để nâng cấp thành người bán.");
            return;
        }

        Alert.alert(
            "Xác nhận",
            "Bạn có chắc chắn muốn trở thành người bán? Việc trở thành người bán đồng nghĩa với bạn đồng ý với các điều khoản và chính sách của chúng tôi!",
            [
                {
                    text: "Huỷ",
                    style: "cancel"
                },
                {
                    text: "Đồng ý",
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem("token");
                            let res = await authApis(token).patch(endpoints["become-seller"]);
                            if (res.status === 200) {
                                dispatch({
                                    type: "updateUser",
                                    payload: { ...user, role: "seller" }
                                });
                                Alert.alert("Thành công", "Bạn đã trở thành người bán!");
                            }
                        } catch (err) {
                            console.error(err);
                            Alert.alert("Lỗi", "Có lỗi xảy ra khi cập nhật vai trò.");
                        }
                    }
                }
            ]
        );
    };



    const logout = () => {
        dispatch({
            "type": "logout"
        });

        nav.navigate("index");
    };

    const navigateToKYC = () => {
        nav.navigate("kyc");
    };

    const navigateToUserDetails = () => {
        nav.navigate("updateUser");
    };

    const navigateToTerms = () => {
        nav.navigate("terms");
    }

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: user?.avatar }} style={styles.avatar} />
                <Text style={styles.name}>{user?.first_name} {user?.last_name}</Text>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.info}>👤 Username: {user?.username}</Text>
                <Text style={styles.info}>📧 Email: {user?.email}</Text>
                <Text style={styles.info}>📞 SĐT: {user?.phone}</Text>
                <Text style={styles.info}>🛡️ Vai trò: {user?.role}</Text>
                <Text style={styles.info}>💰 Số dư: {user?.balance} VND</Text>
                <Text style={styles.info}>✅ Verified: {user?.is_verified ? "Đã xác minh" : "Chưa xác minh"}</Text>
            </View>

            <View style={styles.buttonContainer}>
                <Button onPress={navigateToUserDetails} mode="contained" style={styles.editButton}>
                    Chỉnh sửa thông tin
                </Button>
                <Button onPress={navigateToKYC} mode="contained" style={styles.kycButton}>
                    Xác minh KYC
                </Button>
                <Button onPress={onBecomeSeller} mode="contained" style={styles.becomeSellerButton}>
                    Trở thành người bán
                </Button>
                <Button onPress={navigateToTerms} mode="contained" style={styles.termsButton}>
                    Điều khoản và Chính sách
                </Button>
                <Button onPress={logout} mode="contained" style={styles.logoutButton}>
                    Đăng xuất
                </Button>
            </View>
        </ScrollView>
    );
};

export default Profile;