import React, { useCallback, useContext, useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { MyUserContext } from "../../configs/Contexts";
import styles from "./ForumStyle"
import RenderHTML from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

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
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [category, setCategory] = useState("");
    const user = useContext(MyUserContext);
    const debounceTimeout = useRef(null);
    const { width } = useWindowDimensions();
    const [refreshing, setRefreshing] = useState(false);


    const loadBlogs = useCallback(async () => {
        if (searchText && typeof searchText !== "string") return;
        if (category && !categories.some(c => c.value === category)) return;

        setLoading(true);
        try {
            const res = await Apis.get(endpoints["get-blogs"], {
                params: {
                    search: searchText || undefined,
                    category: category || undefined,
                },
            });

            setBlogs(res.data.results || res.data);
        } catch (err) {
            console.error("Lỗi load blogs:", err?.response?.data || err);
        } finally {
            setLoading(false);
        }
    }, [searchText, category]);

    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
        debounceTimeout.current = setTimeout(() => {
            loadBlogs();
        }, 500); // đợi 0.5s sau khi gõ

        return () => clearTimeout(debounceTimeout.current);
    }, [searchText, category, loadBlogs]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadBlogs();
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

    const navigateToUpdate = (blog) => {
        nav.navigate("blogUpdate", { blog });
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {/* Ô tìm kiếm */}
            <TextInput
                placeholder="Tìm kiếm bài viết..."
                value={searchText}
                onChangeText={setSearchText}
                mode="outlined"
                style={styles.marginBottom}
                right={<TextInput.Icon icon="magnify" onPress={loadBlogs} />}
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

            {/* Nút điều hướng */}
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

            {/* Danh sách blog */}
            {loading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : blogs.length === 0 ? (
                <Text style={styles.noBlog}>Chưa có bài viết nào!</Text>
            ) : (
                blogs.map((b) => (
                    <TouchableOpacity key={b.blog_code} style={styles.blogs} onPress={() => navigateToBlogDetail(b)}>
                        <Text style={styles.blogTitle}>{b.title}</Text>
                        <Text style={styles.blogCategory}>
                            Danh mục: {b.category} | Tác giả: {b.author?.username}
                        </Text>
                        <RenderHTML
                            contentWidth={width}
                            source={{ html: b.content }}
                            tagsStyles={{
                                img: {
                                    maxWidth: '100%',
                                    height: 'auto',
                                    maxHeight: 250,
                                    objectFit: 'contain',
                                },
                            }}
                        />
                    </TouchableOpacity>
                ))
            )}
        </ScrollView>
    );
};

export default MMOForum;
