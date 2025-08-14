import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/Contexts";
import styles from "./ForumStyle";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { decode } from "html-entities";

const categories = [
  { value: "", label: "Tất cả" },
  { value: "tiktok", label: "TikTok" },
  { value: "facebook", label: "Facebook" },
  { value: "youtube", label: "YouTube" },
  { value: "instagram", label: "Instagram" },
  { value: "blockchain", label: "Blockchain" },
  { value: "other", label: "Nội dung khác" },
];

const MMOForum = () => {
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
  const [likeCounts, setLikeCounts] = useState({});

  const debounceTimeout = useRef(null);

  const loadLikeCount = async (blogId) => {
    try {
      const res = await Apis.get(endpoints["get-like"](blogId));
      setLikeCounts((prev) => ({
        ...prev,
        [blogId]: res.data.like_count || 0,
      }));
    } catch (err) {
      console.error(`Lỗi load like count cho blog ${blogId}:`, err?.response?.data || err);
    }
  };

  const loadBlogs = useCallback(
    async (pageNumber = 1) => {
      if (searchText && typeof searchText !== "string") return;
      if (category && !categories.some((c) => c.value === category)) return;

      setLoading(true);
      try {
        const res = await Apis.get(endpoints["get-blogs"], {
          params: {
            search: searchText || undefined,
            category: category || undefined,
            page: pageNumber,
          },
        });

        const blogsData = res.data.results || res.data;
        setBlogs(blogsData);
        setPage(pageNumber);

        // Lấy count từ backend, pageSize cố định 5 theo backend
        const count = res.data.count || 0;
        const pageSize = 5;
        setTotalPages(Math.ceil(count / pageSize) || 1);

        // Load like count cho từng blog
        blogsData.forEach((b) => loadLikeCount(b.blog_code));
      } catch (err) {
        console.error("Lỗi load blogs:", err?.response?.data || err);
      } finally {
        setLoading(false);
      }
    },
    [searchText, category]
  );


  useEffect(() => {
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      loadBlogs(page);
    }, 500);

    return () => clearTimeout(debounceTimeout.current);
  }, [searchText, category, page, loadBlogs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBlogs(page);
    setRefreshing(false);
  };

  const navigateMyBlogs = () => {
    nav.navigate("myBlogs");
  };

  const navigateToCreate = () => {
    nav.navigate("blogCreate");
  };

  const navigateToBlogDetail = (blog) => {
    nav.navigate("blogDetail", { blog });
  };

  // Khi search text thay đổi
  const onSearchChange = (text) => {
    setSearchText(text);
    setPage(1); // reset page
  };

  // Khi đổi category
  const onCategoryChange = (value) => {
    setCategory(value);
    setPage(1); // reset page
  };

  // Giới hạn text bỏ thẻ HTML
  const limitHTML = (html, maxChars) => {
    const plainText = decode(html.replace(/<[^>]+>/g, ""));
    if (plainText.length > maxChars) return plainText.substring(0, maxChars) + "...";
    return plainText;
  };

  // Render pagination nút trang rút gọn
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNeighbours = 1; // số trang hiển thị bên cạnh page hiện tại
    const pages = [];

    const addPage = (p) => {
      if (p <= totalPages) {  // tránh trường hợp trang vượt tổng trang
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
        <Text key="start-ellipsis" style={styles.pageSizeLong}>
          ...
        </Text>
      );
    }

    const startPage = Math.max(2, page - pageNeighbours);
    const endPage = Math.min(totalPages - 1, page + pageNeighbours);

    for (let p = startPage; p <= endPage; p++) {
      addPage(p);
    }

    if (page < totalPages - pageNeighbours - 1) {
      pages.push(
        <Text key="end-ellipsis" style={styles.pageSizeLong}>
          ...
        </Text>
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
      {/* Search */}
      <TextInput
        placeholder="Tìm kiếm bài viết..."
        value={searchText}
        onChangeText={onSearchChange}
        mode="outlined"
        style={styles.marginBottom}
        right={<TextInput.Icon icon="magnify" onPress={() => loadBlogs(1)} />}
      />

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.marginBottom}>
        {categories.map((c) => (
          <Button
            key={c.value}
            mode={category === c.value ? "contained" : "outlined"}
            style={styles.marginRight}
            onPress={() => onCategoryChange(c.value)}
          >
            {c.label}
          </Button>
        ))}
      </ScrollView>

      {/* Buttons */}
      {user && (
        <View style={styles.viewButtons}>
          <Button mode="contained" onPress={navigateToCreate} style={styles.buttonAdd}>
            Tạo bài viết
          </Button>
          <Button mode="contained" onPress={navigateMyBlogs} style={styles.buttonMyBlog}>
            Bài viết của tôi
          </Button>
        </View>
      )}

      {/* Blog list */}
      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : blogs.length === 0 ? (
        <Text style={styles.noBlog}>Chưa có bài viết nào!</Text>
      ) : (
        blogs.map((b) => (
          <TouchableOpacity
            key={b.blog_code}
            style={styles.blogs}
            onPress={() => navigateToBlogDetail(b)}
          >
            <Text style={styles.blogTitle}>{b.title}</Text>
            <Text style={styles.blogCategory}>
              Danh mục: {b.category} | Tác giả: {b.author?.username} | Ngày tạo: {new Date(b.created_date).toLocaleDateString()}
            </Text>
            

            <RenderHTML
              contentWidth={width}
              source={{ html: limitHTML(b.content, 100) }}
              tagsStyles={{
                img: {
                  maxWidth: "100%",
                  height: "auto",
                  maxHeight: 250,
                  objectFit: "contain",
                },
              }}
            />
            <Text style={styles.marginTop}>
              ❤️ {likeCounts[b.blog_code] ?? 0} lượt thích
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* Pagination */}
      {renderPagination()}
    </ScrollView>
  );
};

export default MMOForum;
