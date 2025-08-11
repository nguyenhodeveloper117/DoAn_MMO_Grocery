import React, { useEffect, useState, useContext, useMemo } from "react";
import { View, Text, ScrollView, ActivityIndicator, Alert, Linking } from "react-native";
import { Button, TextInput } from "react-native-paper";
import RenderHTML from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import styles from "./ForumStyle";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BlogDetail = ({ route }) => {
    const { blog } = route.params;
    const { width } = useWindowDimensions();
    const user = useContext(MyUserContext);

    const [comments, setComments] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [newComment, setNewComment] = useState("");

    // Chỉ tạo object này một lần, hoặc khi blog.content đổi
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

    useEffect(() => {
        loadComments(1);
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
            const res = await authApis(token).post(endpoints["add-comment"](blog.blog_code),
                { content: newComment }
            );
            Alert.alert("Thành công", "Bình luận đã được tạo!");
            setNewComment("");
            setPage(1);
            loadComments(1); // reload trang 1 để comment mới lên đầu

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
                Tác giả: {blog.author?.username} | Danh mục: {blog.category}
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
                    <Button title={loadingMore ? "Đang tải..." : "Xem thêm bình luận"} onPress={loadMore} disabled={loadingMore}>
                        Xem thêm
                    </Button>
                )}
            </View>
        </ScrollView>
    );
};

export default BlogDetail;
