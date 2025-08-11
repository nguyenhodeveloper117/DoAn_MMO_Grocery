import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/Contexts";
import styles from "./ForumStyle"
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';
import { decode } from 'html-entities';

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
  const { width } = useWindowDimensions();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const debounceTimeout = useRef(null);

  const loadMyBlogs = useCallback(async (pageNumber = 1) => {
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
          page: pageNumber,
        },
      });

      setBlogs(res.data.results || res.data);
      setPage(pageNumber);

      // Lấy count từ backend, pageSize cố định 5 theo backend
      const count = res.data.count || 0;
      const pageSize = 5;  // tương ứng với page_size backend
      setTotalPages(Math.ceil(count / pageSize) || 1);

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
      loadMyBlogs(page);
    }, 500); // đợi 0.5s sau khi gõ

    return () => clearTimeout(debounceTimeout.current);
  }, [searchText, category, user, page, loadMyBlogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyBlogs(page);
    setRefreshing(false);
  };

  const handleDeleteBlog = async (blogId) => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc chắn muốn xoá bài viết này không?",
      [
        {
          text: "Huỷ",
          style: "cancel",
        },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await authApis(token).delete(endpoints["delete-blog"](blogId));
              Alert.alert("Thông báo", "Xoá bài viết thành công");
              loadMyBlogs(page);
            } catch (err) {
              Alert.alert("Lỗi", "Xoá bài viết thất bại");
              console.error("Lỗi xoá blog:", err?.response?.data || err);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const navigateToUpdate = (blog) => {
    nav.navigate("blogUpdate", { blog });
  };

  const navigateToDetail = (blog) => {
    nav.navigate("blogDetail", { blog, isMyBlog: true });
  };

  const limitHTML = (html, maxChars) => {
    const plainText = decode(html.replace(/<[^>]+>/g, ''));
    if (plainText.length > maxChars) {
      return plainText.substring(0, maxChars) + '...';
    }
    return plainText;
  };

  // Render pagination nút trang rút gọn
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNeighbours = 1; // số trang hiển thị bên cạnh page hiện tại
    const pages = [];

    const addPage = (p) => {
      if (p <= totalPages) {
        pages.push(
          <Button
            key={p}
            mode={p === page ? "contained" : "outlined"}
            style={styles.page}
            onPress={() => {
              if (p !== page) setPage(p);
            }}
          >
            {p}
          </Button>
        );
      }
    };

    addPage(1);

    if (page > pageNeighbours + 2) {
      pages.push(
        <Text key="start-ellipsis" style={styles.pageSizeLong}>...</Text>
      );
    }

    const startPage = Math.max(2, page - pageNeighbours);
    const endPage = Math.min(totalPages - 1, page + pageNeighbours);

    for (let p = startPage; p <= endPage; p++) {
      addPage(p);
    }

    if (page < totalPages - pageNeighbours - 1) {
      pages.push(
        <Text key="end-ellipsis" style={styles.pageSizeLong}>...</Text>
      );
    }

    if (totalPages > 1) addPage(totalPages);

    return <View style={styles.viewPage}>{pages}</View>;
  };

  return (
    <ScrollView
      contentContainerStyle={MyStyles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Ô tìm kiếm */}
      <TextInput
        placeholder="Tìm kiếm bài viết..."
        value={searchText}
        onChangeText={setSearchText}
        mode="outlined"
        style={styles.marginBottom}
        right={<TextInput.Icon icon="magnify" onPress={() => loadMyBlogs(1)} />}
      />

      {/* Filter danh mục */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marginBottom}>
        {categories.map((c) => (
          <Button
            key={c.value}
            mode={category === c.value ? "contained" : "outlined"}
            style={styles.marginRight}
            onPress={() => {
              setCategory(c.value);
              setPage(1);
            }}
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
          >
            <Text style={styles.blogTitle}>{b.title}</Text>
            <Text style={styles.blogCategory}>
              Danh mục: {b.category} | Cập nhật: {new Date(b.updated_date).toLocaleDateString()}
            </Text>
            <RenderHTML
              contentWidth={width}
              source={{ html: limitHTML(b.content, 100) }}
              tagsStyles={{
                img: {
                  maxWidth: '100%',
                  height: 'auto',
                  maxHeight: 250,
                  objectFit: 'contain',
                },
              }}
            />

            <View style={styles.viewUpdateDeleteBlog}>
              <Button mode="outlined" style={styles.marginRight} onPress={() => navigateToUpdate(b)}>
                Cập nhật
              </Button>
              <Button mode="contained" style={styles.colorRed} onPress={() => handleDeleteBlog(b.blog_code)}>
                Xoá
              </Button>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* Pagination */}
      {renderPagination()}
    </ScrollView>
  );
};

export default MyForums;
