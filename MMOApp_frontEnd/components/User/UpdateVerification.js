import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useRoute } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import styles from "./UserStyle";

const UpdateVerification = () => {
    const [cccd, setCccd] = useState("");
    const [frontId, setFrontId] = useState(null);
    const [backId, setBackId] = useState(null);
    const [portrait, setPortrait] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const route = useRoute();

    const verificationCode = route.params?.verificationCode;

    const pickImage = async (setter) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setter(result.assets[0]);
        }
    };

    const handleUpdate = async () => {
        if (!cccd && !frontId && !backId && !portrait) {
            Alert.alert("Thông báo", "Vui lòng cập nhật ít nhất một thông tin.");
            return;
        }

        try {
            setLoading(true);

            const formData = new FormData();
            if (cccd) formData.append("cccd", cccd);
            if (frontId) {
                formData.append("front_id", {
                    uri: frontId.uri,
                    type: "image/jpeg",
                    name: "front.jpg",
                });
            }
            if (backId) {
                formData.append("back_id", {
                    uri: backId.uri,
                    type: "image/jpeg",
                    name: "back.jpg",
                });
            }
            if (portrait) {
                formData.append("portrait", {
                    uri: portrait.uri,
                    type: "image/jpeg",
                    name: "portrait.jpg",
                });
            }
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).patch(endpoints["update-verification"](verificationCode), formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            Alert.alert("Thành công", "Cập nhật thông tin xác minh thành công.");
            nav.navigate("profileDetails");
        } catch (error) {
            console.error("Lỗi cập nhật:", error);
            Alert.alert("Lỗi", "Không thể cập nhật thông tin xác minh.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            <Text style={styles.label}>Cập nhật CCCD (nếu cần):</Text>
            <TextInput
                label="CCCD mới"
                value={cccd}
                onChangeText={setCccd}
                mode="outlined"
                style={styles.input}
            />

            <Text style={styles.label}>Cập nhật ảnh CCCD mặt trước:</Text>
            <TouchableOpacity onPress={() => pickImage(setFrontId)} style={styles.imagePicker}>
                {frontId ? (
                    <Image source={{ uri: frontId.uri }} style={styles.imageVerification} />
                ) : (
                    <Text style={styles.input}>Chọn ảnh</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.label}>Cập nhật ảnh CCCD mặt sau:</Text>
            <TouchableOpacity onPress={() => pickImage(setBackId)} style={styles.imagePicker}>
                {backId ? (
                    <Image source={{ uri: backId.uri }} style={styles.imageVerification} />
                ) : (
                    <Text style={styles.input}>Chọn ảnh</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.label}>Cập nhật ảnh chân dung:</Text>
            <TouchableOpacity onPress={() => pickImage(setPortrait)} style={styles.imagePicker}>
                {portrait ? (
                    <Image source={{ uri: portrait.uri }} style={styles.imageVerification} />
                ) : (
                    <Text style={styles.input}>Chọn ảnh</Text>
                )}
            </TouchableOpacity>

            <Button mode="contained" onPress={handleUpdate} loading={loading} style={{ marginTop: 20 }}>
                Gửi cập nhật
            </Button>
        </ScrollView>
    );
};

export default UpdateVerification;