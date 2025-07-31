import { useState, useContext } from "react";
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { MyUserContext, MyDispatchContext } from "../../configs/Contexts";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import MyStyles from "../../styles/MyStyles";
import styles from "./UserStyle";
import AsyncStorage from "@react-native-async-storage/async-storage";


const UpdateUser = () => {
    const user = useContext(MyUserContext); // Lấy thông tin người dùng hiện tại
    const dispatch = useContext(MyDispatchContext);
    const nav = useNavigation();
    const [updatedUser, setUpdatedUser] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        password: "",
        avatar: user?.avatar || "",
    });
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const setState = (value, field) => {
        setUpdatedUser({ ...updatedUser, [field]: value });
    };

    const pickAvatar = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1],
                quality: 1,
            });

            if (!result.canceled) {
                const selectedAvatar = result.assets[0];
                setState(selectedAvatar.uri, "avatar");
            }
        } catch (error) {
            console.error("Lỗi khi chọn ảnh:", error);
        }
    };

    const updateUser = async () => {
    try {
        setLoading(true);
        let form = new FormData();

        for (let key in updatedUser) {
            if (key === "avatar" && updatedUser.avatar && !updatedUser.avatar.startsWith("http")) {
                form.append("avatar", {
                    uri: updatedUser.avatar,
                    name: updatedUser.avatar.split("/").pop(),
                    type: "image/jpeg",
                });
            } else if (key === "password" && !updatedUser.password) {
                continue; // Bỏ qua nếu không đổi mật khẩu
            } else if (key !== "avatar") {
                form.append(key, updatedUser[key]);
            }
        }

        let token = await AsyncStorage.getItem('token');
        const res = await authApis(token).patch(endpoints['update-user'](user.user_code), form, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (res.status === 200) {
            setMsg("Cập nhật thành công!");

            dispatch({
                type: "updateUser",
                payload: res.data, // Dữ liệu người dùng mới từ API
            });

            nav.goBack();
        }
    } catch (error) {
        console.error("Lỗi cập nhật:", error.response?.data || error.message);
        setMsg("Cập nhật thất bại!");
    } finally {
        setLoading(false);
    }
};


    return (
        <ScrollView contentContainerStyle={{ ...MyStyles.container }}>
            <HelperText type="error" visible={msg}>
                {msg}
            </HelperText>

            <TextInput
                label="Tên"
                value={updatedUser.first_name}
                onChangeText={(text) => setState(text, "first_name")}
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="Họ và tên lót"
                value={updatedUser.last_name}
                onChangeText={(text) => setState(text, "last_name")}
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="Email"
                value={updatedUser.email}
                onChangeText={(text) => setState(text, "email")}
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="Số điện thoại"
                value={updatedUser.phone}
                onChangeText={(text) => setState(text, "phone")}
                style={styles.input}
                mode="outlined"
            />
            <TextInput
                label="Mật khẩu mới"
                value={updatedUser.password}
                onChangeText={(text) => setState(text, "password")}
                style={styles.input}
                mode="outlined"
                secureTextEntry
            />

            <TouchableOpacity onPress={pickAvatar}>
                <Text style={styles.avatarPicker}>Chọn ảnh đại diện</Text>
            </TouchableOpacity>
            {updatedUser.avatar && (
                <Image source={{ uri: updatedUser.avatar }} style={styles.avatar} />
            )}

            <Button
                mode="contained"
                onPress={updateUser}
                loading={loading}
                disabled={loading}
                style={styles.button}
            >
                Cập nhật
            </Button>
        </ScrollView>
    );
};

export default UpdateUser;