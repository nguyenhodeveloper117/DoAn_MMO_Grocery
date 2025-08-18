import React, { useEffect, useState, useContext, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, Linking, TouchableOpacity } from "react-native";
import { Button, TextInput } from "react-native-paper";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import styles from "./ForumStyle";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BlogDetail = ({ route }) => {
    const { blog } = route.params;
    const { width } = useWindowDimensions();
    const user = useContext(MyUserContext);
    const nav = useNavigation();
    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [likeCount, setLikeCount] = useState(0);
    const [liked, setLiked] = useState(false);

    const renderSource = useMemo(() => ({ html: blog.content }), [blog.content]);
    const renderTagsStyles = useMemo(() => ({
        img: {
            maxWidth: '100%',
            height: 'auto',
            maxHeight: 250,
            objectFit: 'contain',
        },
    }), []);

    const loadComments = async (p = 1) => {
        try {
            if (p === 1) setLoading(true);
            const res = await Apis.get(`${endpoints["get-blog-comments"](blog.blog_code)}?page=${p}`);
            if (p === 1) {
                setComments(res.data.results);
            } else {
                setComments((prev) => [...prev, ...res.data.results]);
            }
            setHasMore(res.data.next !== null);
        } catch (err) {
            console.error("Lỗi load comments:", err);
        } finally {
            if (p === 1) setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadLikeCount = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            let api = token ? authApis(token) : Apis;
            const res = await api.get(endpoints["get-like"](blog.blog_code));
            setLikeCount(res.data.like_count);
            setLiked(res.data.liked); // <= set luôn trạng thái
        } catch (err) {
            console.error(err);
        }
    };

    const handleLike = async () => {
        if (!user) {
            Alert.alert("Thông báo", "Bạn cần đăng nhập mới có thể thích bài viết");
            nav.navigate("login");
            return;
        }
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(endpoints["add-like"](blog.blog_code));
            setLikeCount(res.data.like_count || 0);
            setLiked(res.data.message === "Đã thích");
        } catch (err) {
            console.error("Lỗi like blog:", err.response?.data || err);
        }
    };

    useEffect(() => {
        loadComments(1);
        loadLikeCount();
    }, []);

    const loadMore = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        loadComments(nextPage);
        setPage(nextPage);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        try {
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints["add-comment"](blog.blog_code),
                { content: newComment }
            );
            Alert.alert("Thành công", "Bình luận đã được tạo!");
            setNewComment("");
            setPage(1);
            loadComments(1);
        } catch (err) {
            console.error("Lỗi thêm comment:", err.response?.data || err);
        }
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            {/* Chi tiết blog */}
            <Text style={styles.blogDetailTitle}>
                {blog.title}
            </Text>
            <Text style={styles.blogCategory}>
                Tác giả: {blog.author?.username} | Danh mục: {blog.category} | Ngày tạo: {new Date(blog.created_date).toLocaleDateString()} | Ngày cập nhật: {new Date(blog.created_date).toLocaleDateString()}
            </Text>

            <RenderHTML
                contentWidth={width}
                source={renderSource}
                tagsStyles={renderTagsStyles}
            />

            <Text style={styles.productBLogTitle}>Sản phẩm liên quan: </Text>
            <Text
                style={styles.link}
                onPress={() => {
                    if (blog.product) {
                        Linking.openURL(blog.product).catch(err =>
                            console.error("Không thể mở link: ", err)
                        );
                    }
                }}
            >
                {blog.product}
            </Text>

            {/* Nút Like */}
            <TouchableOpacity
                onPress={handleLike}
                style={styles.like}
            >
                <AntDesign name={liked ? "heart" : "hearto"} size={24} color={liked ? "red" : "black"} />
                <Text style={{ marginLeft: 5 }}>{likeCount} lượt thích</Text>
            </TouchableOpacity>

            {/* Form comment */}
            {user && (
                <View style={styles.marginTop}>
                    <TextInput placeholder="Nhập bình luận..." value={newComment} onChangeText={setNewComment} mode="outlined" />
                    <Button style={styles.buttonAddComment} onPress={handleAddComment} mode="contained">Gửi</Button>
                </View>
            )}

            {/* Danh sách comment */}
            <View style={{ marginTop: 20 }}>
                <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
                    Bình luận
                </Text>
                {loading ? (
                    <ActivityIndicator size="large" color="blue" />
                ) : comments.length === 0 ? (
                    <Text>Chưa có bình luận nào</Text>
                ) : (
                    comments.map((c) => (
                        <View
                            key={c.blog_comment_code}
                            style={{
                                paddingVertical: 8,
                                borderBottomWidth: 1,
                                borderBottomColor: "#ddd",
                            }}
                        >
                            <Text style={{ fontWeight: "bold" }}>{c.author?.username}</Text>
                            <Text>{c.content}</Text>
                        </View>
                    ))
                )}

                {hasMore && !loading && (
                    <Button
                        onPress={loadMore}
                        disabled={loadingMore}
                        mode="outlined"
                        style={{ marginTop: 10 }}
                    >
                        {loadingMore ? "Đang tải..." : "Xem thêm bình luận"}
                    </Button>
                )}
            </View>
        </ScrollView>
    );
};

export default BlogDetail;
