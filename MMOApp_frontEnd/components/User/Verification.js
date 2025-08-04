import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, Button } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./UserStyle";
import { useNavigation } from "@react-navigation/native";

const Verification = () => {
    const [verificationData, setVerificationData] = useState(null);
    const [cccd, setCccd] = useState("");
    const [frontId, setFrontId] = useState(null);
    const [backId, setBackId] = useState(null);
    const [portrait, setPortrait] = useState(null);
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();

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

    const handleSubmit = async () => {
        if (!cccd || !frontId || !backId || !portrait) {
            alert("Vui lòng nhập đầy đủ thông tin và ảnh!");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");

            const formData = new FormData();
            formData.append("cccd", cccd);
            formData.append("front_id", {
                uri: frontId.uri,
                type: "image/jpeg",
                name: "front.jpg",
            });
            formData.append("back_id", {
                uri: backId.uri,
                type: "image/jpeg",
                name: "back.jpg",
            });
            formData.append("portrait", {
                uri: portrait.uri,
                type: "image/jpeg",
                name: "portrait.jpg",
            });

            const res = await authApis(token).post(endpoints["create-verification"], formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setVerificationData(res.data);
        } catch (error) {
            console.error("Lỗi khi gửi xác thực:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await authApis(token).get(endpoints["get-verification"]);
                setVerificationData(res.data);
            } catch (err) {
                if (err.response?.status !== 404) {
                    console.error("Lỗi lấy xác thực:", err);
                }
            }
        };

        fetchVerification();
    }, []);

    const isComplete = verificationData &&
        verificationData.cccd &&
        verificationData.front_id &&
        verificationData.back_id &&
        verificationData.portrait;

    if (!verificationData || (!isComplete && !verificationData.cccd)) {
        return (
            <ScrollView contentContainerStyle={MyStyles.container}>
                <Text style={styles.label}>Nhập căn cước công dân</Text>
                <TextInput
                    label="CCCD"
                    value={cccd}
                    onChangeText={setCccd}
                    mode="outlined"
                    style={styles.input}
                />

                <Text style={styles.label}>Ảnh CCCD mặt trước:</Text>
                <TouchableOpacity onPress={() => pickImage(setFrontId)} style={styles.imagePicker}>
                    {frontId ? (
                        <Image source={{ uri: frontId.uri }} style={styles.imageVerification} />
                    ) : (
                        <Text style={styles.input}>Chọn ảnh</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Ảnh CCCD mặt sau:</Text>
                <TouchableOpacity onPress={() => pickImage(setBackId)} style={styles.imagePicker}>
                    {backId ? (
                        <Image source={{ uri: backId.uri }} style={styles.imageVerification} />
                    ) : (
                        <Text style={styles.input}>Chọn ảnh</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.label}>Ảnh chân dung:</Text>
                <TouchableOpacity onPress={() => pickImage(setPortrait)} style={styles.imagePicker}>
                    {portrait ? (
                        <Image source={{ uri: portrait.uri }} style={styles.imageVerification} />
                    ) : (
                        <Text style={styles.input}>Chọn ảnh</Text>
                    )}
                </TouchableOpacity>

                <Button mode="contained" onPress={handleSubmit} loading={loading} style={{ marginTop: 20 }}>
                    Gửi xác thực
                </Button>
            </ScrollView>
        );
    }
    const navigateToUpdateVerification = () => {
        nav.navigate("updateVerification", {
            verificationCode: verificationData.verification_code,
        });
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            <Text style={styles.name}>
                {verificationData.user?.first_name} {verificationData.user?.last_name}
            </Text>
            <Text style={styles.label}>Trạng thái:</Text>
            <Text style={styles.info}>{verificationData.status}</Text>

            <Text style={styles.label}>CCCD:</Text>
            <Text style={styles.info}>{verificationData.cccd}</Text>

            <Text style={styles.label}>Ảnh CCCD mặt trước:</Text>
            <Image source={{ uri: verificationData.front_id }} style={styles.imageVerification} />

            <Text style={styles.label}>Ảnh CCCD mặt sau:</Text>
            <Image source={{ uri: verificationData.back_id }} style={styles.imageVerification} />

            <Text style={styles.label}>Ảnh chân dung:</Text>
            <Image source={{ uri: verificationData.portrait }} style={styles.imageVerification} />

            <Button mode="contained" style={styles.button} onPress={navigateToUpdateVerification}>
                Cập nhật xác minh
            </Button>
        </ScrollView>
    );
};

export default Verification;
