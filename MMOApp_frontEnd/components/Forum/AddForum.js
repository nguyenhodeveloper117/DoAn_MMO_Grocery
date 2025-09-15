import React, { useState, useRef } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Button, TextInput, Menu } from "react-native-paper";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import styles from "./ForumStyle";
import MyStyles from "../../styles/MyStyles";
import { useNavigation } from "@react-navigation/native";

const categories = [
    { value: "tiktok", label: "TikTok" },
    { value: "facebook", label: "Facebook" },
    { value: "youtube", label: "YouTube" },
    { value: "instagram", label: "Instagram" },
    { value: "blockchain", label: "Blockchain" },
    { value: "other", label: "Nội dung khác" },
];

const AddForum = () => {
    const [title, setTitle] = useState("");
    const [product, setProduct] = useState("");
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const richText = useRef();
    const nav = useNavigation();

    // Chọn ảnh từ thư viện
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            mediaTypes: ImagePicker.MediaType,
            quality: 1,
        });

        if (!result.canceled) {
            try {
                const uri = result.assets[0].uri;
                const token = await AsyncStorage.getItem("token");

                let form = new FormData();
                form.append("image", {
                    uri,
                    type: "image/jpeg",
                    name: "upload.jpg"
                });

                const res = await authApis(token).post(endpoints["upload-image"], form, {
                    headers: { "Content-Type": "multipart/form-data" }
                });

                // Chèn ảnh vào rich text
                richText.current?.insertImage(res.data.url);

            } catch (err) {
                console.error("Lỗi upload ảnh:", err?.response?.data || err);
                Alert.alert("Lỗi", "Không thể upload ảnh!");
            }
        }
    };

    const generateWithAI = async () => {
        if (!title.trim()) {
            Alert.alert("Lỗi", "Vui lòng nhập tiêu đề trước khi gợi ý AI!");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(endpoints["ai-suggest"], {
                title,
                category,   // bạn có thể gửi thêm nếu muốn
                keywords: product, // hoặc bỏ nếu không dùng
            });

            const aiContent = res.data.suggested_content;

            // Chèn thẳng vào RichEditor
            richText.current?.setContentHTML(aiContent);
            setContent(aiContent);

        } catch (err) {
            console.error("Lỗi AI:", err?.response?.data || err);
            Alert.alert("Lỗi", "Không thể tạo nội dung với AI!");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || !category) {
            Alert.alert("Lỗi", "Vui lòng nhập tiêu đề, nội dung và chọn danh mục.");
            return;
        }
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints["create-blog"], {
                title,
                content, // HTML chứa cả ảnh
                product: product || null,
                category,
            });
            Alert.alert("Thành công", "Bài viết đã được tạo!");
            nav.navigate("blogPost", { reload: true });
        } catch (err) {
            console.error("Lỗi tạo blog:", err?.response?.data || err);
            Alert.alert("Lỗi", "Không thể tạo bài viết!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={MyStyles.container}>
            {/* Tiêu đề */}
            <TextInput
                label="Tiêu đề"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                style={styles.marginBottom}
            />

            {/* Sản phẩm liên quan */}
            <TextInput
                label="Sản phẩm liên quan"
                value={product}
                onChangeText={setProduct}
                mode="outlined"
                style={styles.marginBottom}
            />

            {/* Chọn danh mục */}
            <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.containerCategory} // minHeight tránh bị co lại
            >
                {categories.map(c => (
                    <Button
                        key={c.value}
                        mode={category === c.value ? "contained" : "outlined"}
                        style={{ marginRight: 8 }}
                        onPress={() => setCategory(c.value)}
                    >
                        {c.label}
                    </Button>
                ))}
            </ScrollView>

            {/* Toolbar format */}
            <RichToolbar
                editor={richText}
                actions={[
                    actions.setBold,
                    actions.setItalic,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.insertLink,
                    actions.insertImage,
                ]}
                onPressAddImage={pickImage}
            />

            <Button
                mode="outlined"
                onPress={generateWithAI}
                loading={loading}
                disabled={loading}
                style={styles.marginTop}
            >
                AI gợi ý nội dung
            </Button>

            {/* Ô nhập nội dung rich text */}
            <RichEditor
                ref={richText}
                style={styles.richTextInput}
                placeholder="Nhập nội dung..."
                initialContentHTML={content}
                onChange={setContent}
            />

            {/* Nút đăng */}
            <Button
                mode="contained"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
                style={styles.marginTop}
            >
                Đăng bài
            </Button>
        </ScrollView>
    );

};

export default AddForum;
