import React, { useCallback, useContext, useEffect, useState, useRef} from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/Contexts";
import styles from "./ForumStyle"

const categories = [
  { value: "", label: "Tất cả" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "blockchain", label: "Blockchain" },
  { value: "other", label: "Nội dung khác" },
];

const MyForums = () => {
  const nav = useNavigation();
  const user = useContext(MyUserContext);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("");
  const debounceTimeout = useRef(null);

  const loadMyBlogs = useCallback(async () => {
    if (!user) return;
    if (searchText && typeof searchText !== "string") return;
    if (category && !categories.some(c => c.value === category)) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["my-blogs"], {
        params: {
          search: searchText || undefined,
          category: category || undefined,
        },
      });

      setBlogs(res.data.results || res.data);
    } catch (err) {
      console.error("Lỗi load my blogs:", err?.response?.data || err);
    } finally {
      setLoading(false);
    }
  }, [user, searchText, category]);

useEffect(() => {
    if (!user) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      loadMyBlogs();
    }, 500); // đợi 0.5s sau khi gõ

    return () => clearTimeout(debounceTimeout.current);
  }, [searchText, category, user, loadMyBlogs]);

  const navigateToUpdate = (blog) => {
    nav.navigate("blogUpdate", { blog });
  };

  const navigateToDetail = (blog) => {
    nav.navigate("blogDetail", { blog, isMyBlog: true });
  };

  return (
    <ScrollView contentContainerStyle={MyStyles.container}>
      {/* Ô tìm kiếm */}
      <TextInput
        placeholder="Tìm kiếm bài viết..."
        value={searchText}
        onChangeText={setSearchText}
        mode="outlined"
        style={styles.marginBottom}
        right={<TextInput.Icon icon="magnify" onPress={loadMyBlogs} />}
      />

      {/* Filter danh mục */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marginBottom}>
        {categories.map((c) => (
          <Button
            key={c.value}
            mode={category === c.value ? "contained" : "outlined"}
            style={styles.marginRight}
            onPress={() => setCategory(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </ScrollView>

      {/* Danh sách blog */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : blogs.length === 0 ? (
        <Text style={styles.noBlog}>Chưa có bài viết nào!</Text>
      ) : (
        blogs.map((b) => (
          <TouchableOpacity
            key={b.blog_code}
            style={styles.blogs}
            onPress={() => navigateToDetail(b)}
            onLongPress={() => navigateToUpdate(b)}
          >
            <Text style={styles.blogTitle}>{b.title}</Text>
            <Text numberOfLines={2} style={styles.blogContent}>
              {b.content}
            </Text>
            <Text style={styles.blogCategory}>
              Danh mục: {b.category} | Cập nhật: {new Date(b.updated_date).toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
};

export default MyForums;
