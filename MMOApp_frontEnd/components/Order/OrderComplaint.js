import React, { useState } from "react";
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from "react-native";
import { TextInput, Button, Text } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import styles from "./OrderStyle";

const OrderComplaint = ({ route, navigation }) => {
    const { order } = route.params || {};
    const [message, setMessage] = useState("");
    const [images, setImages] = useState([null, null, null]);
    const [videoUrl, setVideoUrl] = useState(""); // link video
    const [loading, setLoading] = useState(false);

    // chọn ảnh
    const pickImage = async (index) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            const newImages = [...images];
            newImages[index] = result.assets[0];
            setImages(newImages);
        }
    };

    const isValidUrl = (string) => {
        const pattern = /^(https?:\/\/[^\s]+)$/;
        return pattern.test(string);
    };

    const submitComplaint = async () => {
        if (!message.trim()) {
            alert("Vui lòng nhập nội dung khiếu nại!");
            return;
        }
        if (!images[0]) {
            alert("Vui lòng chọn ít nhất 1 ảnh minh chứng!");
            return;
        }

        if (!videoUrl.trim()) {
            alert("Vui lòng dán link video minh chứng!");
            return;
        }
        
        if (!isValidUrl(videoUrl.trim())) {
            alert("Link video không hợp lệ! Vui lòng dán link đầy đủ (http/https).");
            return;
        }

        try {
            setLoading(true);
            let formData = new FormData();

            formData.append("order_code", order.order_code);
            formData.append("message", message);

            // ảnh
            images.forEach((img, idx) => {
                if (img?.uri) {
                    let uri = img.uri;
                    let filename = uri.split("/").pop();
                    let type = img.type || "image/jpeg";

                    formData.append(`evidence_image${idx + 1}`, {
                        uri,
                        name: filename,
                        type,
                    });
                }
            });

            // video link
            if (videoUrl.trim()) {
                formData.append("evidence_video", videoUrl.trim());
            }

            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(endpoints["add-complaint"], formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 201) {
                alert("Gửi khiếu nại thành công!");
                navigation.goBack();
            }
        } catch (err) {
            console.error("Lỗi gửi khiếu nại:", err.response?.data || err);
            alert("Có lỗi xảy ra khi gửi khiếu nại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            <Text style={styles.title}>Khiếu nại đơn hàng #{order?.order_code}</Text>

            <TextInput
                label="Nội dung khiếu nại"
                mode="outlined"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                style={styles.marginBottom}
            />

            <Text style={styles.labelComplaint}>Ảnh minh chứng (tối thiểu 1 ảnh)</Text>
            {images.map((img, idx) => (
                <TouchableOpacity key={idx} onPress={() => pickImage(idx)} style={styles.uploadBtn}>
                    <Text style={styles.whiteText}>
                        {img ? `Đổi Ảnh ${idx + 1}` : `Chọn Ảnh ${idx + 1}`}
                    </Text>
                </TouchableOpacity>
            ))}
            <View style={styles.previewRow}>
                {images.map(
                    (img, idx) =>
                        img && <Image key={idx} source={{ uri: img.uri }} style={styles.previewImg} />
                )}
            </View>

            <Text style={styles.labelComplaint}>Link video minh chứng</Text>
            <TextInput
                label="Dán link video (OneDrive, Drive, Icloud...)"
                mode="outlined"
                value={videoUrl}
                onChangeText={setVideoUrl}
                style={styles.marginBottom}
            />

            <Button
                mode="contained"
                onPress={submitComplaint}
                loading={loading}
                disabled={loading}
                style={styles.submitBtn}
            >
                Gửi Khiếu Nại
            </Button>
        </ScrollView>
    );
};

export default OrderComplaint;
