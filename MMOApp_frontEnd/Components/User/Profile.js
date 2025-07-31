import { useContext } from "react";
import { Text, View, Image, StyleSheet, ScrollView } from "react-native";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import styles from "./UserStyle";


const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();

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
            </View>

            <View style={styles.buttonContainer}>
                <Button onPress={navigateToUserDetails} mode="contained" style={styles.editButton}>
                    Chỉnh sửa thông tin
                </Button>
                <Button onPress={navigateToKYC} mode="contained" style={styles.kycButton}>
                    Xác minh KYC
                </Button>
                <Button onPress={logout} mode="contained" style={styles.logoutButton}>
                    Đăng xuất
                </Button>
            </View>
        </ScrollView>
    );
};

export default Profile;