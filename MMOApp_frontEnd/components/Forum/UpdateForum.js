import React, { useState, useRef, useEffect } from "react";
import { View, ScrollView, Alert } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import styles from "./ForumStyle";
import MyStyles from "../../styles/MyStyles";
import { useNavigation, useRoute } from "@react-navigation/native";

const categories = [
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "blockchain", label: "Blockchain" },
  { value: "other", label: "Nội dung khác" },
];

const UpdateForum = () => {
  const nav = useNavigation();
  const route = useRoute();
  const blog = route.params?.blog;

  const [title, setTitle] = useState(blog?.title || "");
  const [product, setProduct] = useState(blog?.product || "");
  const [category, setCategory] = useState(blog?.category || "");
  const [content, setContent] = useState(blog?.content || "");
  const [loading, setLoading] = useState(false);

  const richText = useRef();

  useEffect(() => {
    // Đồng bộ content ban đầu vào RichEditor
    if (richText.current && blog?.content) {
      richText.current.setContentHTML(blog.content);
    }
  }, [blog]);

  // Chọn ảnh từ thư viện và upload, chèn vào rich text
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
          name: "upload.jpg",
        });

        const res = await authApis(token).post(endpoints["upload-image"], form, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // Chèn ảnh vào rich text
        richText.current?.insertImage(res.data.url);
      } catch (err) {
        console.error("Lỗi upload ảnh:", err?.response?.data || err);
        Alert.alert("Lỗi", "Không thể upload ảnh!");
      }
    }
  };

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim() || !category) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề, nội dung và chọn danh mục.");
      return;
    }
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      await authApis(token).patch(endpoints["update-blog"](blog.blog_code), {
        title,
        content, // HTML richtext có thể chứa ảnh
        product: product || null,
        category,
      });

      Alert.alert("Thành công", "Cập nhật bài viết thành công!")
      nav.navigate("myBlogs", { reload: true });
    } catch (err) {
      console.error("Lỗi cập nhật blog:", err?.response?.data || err);
      Alert.alert("Lỗi", "Không thể cập nhật bài viết!");
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
        style={styles.containerCategory} // style tương tự AddForum
      >
        {categories.map((c) => (
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

      {/* Toolbar format rich text */}
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

      {/* Ô nhập nội dung rich text */}
      <RichEditor
        ref={richText}
        style={styles.richTextInput}
        placeholder="Nhập nội dung..."
        initialContentHTML={content}
        onChange={setContent}
      />

      {/* Nút cập nhật */}
      <Button mode="contained" onPress={handleUpdate} loading={loading} disabled={loading} style={styles.marginTop}>
        Cập nhật bài viết
      </Button>
    </ScrollView>
  );
};

export default UpdateForum;
