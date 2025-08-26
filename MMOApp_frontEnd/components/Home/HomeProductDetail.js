import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Alert, } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./HomeStyle";
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";

const HomeProductDetail = ({ route, navigation }) => {
    const { product } = route.params;
    const [qty, setQty] = useState(1);
    const [voucher, setVoucher] = useState("");
    const [note, setNote] = useState("");
    const [targetUrl, setTargetUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const [unitPrice, setUnitPrice] = useState(product.price);
    const [tongGoc, setTongGoc] = useState(product.price);
    const [discount, setDiscount] = useState(0);
    const [thanhToan, setThanhToan] = useState(product.price);
    const [voucherInput, setVoucherInput] = useState("");

    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const [favorited, setFavorited] = useState(false);


    const nav = useNavigation();

    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);

    const isValidUrl = (string) => {
        const pattern = /^(https?:\/\/[^\s]+)$/;
        return pattern.test(string);
    };

    // ---- Load trạng thái yêu thích ----
    const loadFavoriteStatus = async () => {
        if (!user) return; // chưa login thì bỏ qua
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["status-favorite"](product.product_code));
            setFavorited(res.data.favourited);
        } catch (err) {
            console.error("Lỗi load favorite status:", err.response?.data || err);
        }
    };

    const handleAddFavorite = async () => {
        if (!user) {
            Alert.alert("Thông báo", "Bạn cần đăng nhập mới có thể thêm vào yêu thích");
            nav.navigate("login");
            return;
        }
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(endpoints["add-favorite"](product.product_code));

            setFavorited(res.data.message === "Đã thêm favorite");

            Alert.alert("Thông báo", res.data.message || (res.data.favourited ? "Đã thêm yêu thích" : "Đã bỏ yêu thích"));
        } catch (err) {
            console.error("Lỗi thêm vào yêu thích:", err.response?.data || err);
            Alert.alert("Lỗi", "Không thể thêm vào yêu thích!");
        }
    };

    // Gọi API check voucher
    const checkVoucher = async (code, total) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(endpoints["check-voucher"], {
                code,
                total_amount: total,
                product_code: product.product_code,
            });
            return res.data.discount_amount || 0;
        } catch (err) {
            Alert.alert("Voucher không hợp lệ", err.response?.data?.error || "Có lỗi xảy ra");
            return 0;
        }
    };

    const loadReviews = async (p = 1) => {
        try {
            if (p === 1) setLoading(true);

            const res = await Apis.get(`${endpoints["get-reviews"](product.product_code)}?page=${p}`);

            if (p === 1) {
                setReviews(res.data.results);
            } else {
                setReviews((prev) => [...prev, ...res.data.results]);
            }

            setHasMore(res.data.next !== null);
        } catch (err) {
            console.error("Lỗi load reviews:", err.response?.data || err);
        } finally {
            if (p === 1) setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        loadReviews(1);
        loadFavoriteStatus();
    }, [product.product_code]);

    const loadMore = () => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        loadReviews(nextPage);
        setPage(nextPage);
    };

    // Debounce voucher
    useEffect(() => {
        const timer = setTimeout(() => {
            setVoucher(voucherInput); // chỉ set voucher sau 0.5s ngừng gõ
        }, 1000);

        return () => clearTimeout(timer); // clear nếu còn đang nhập
    }, [voucherInput]);

    // Tính toán giá realtime
    useEffect(() => {
        const updatePrice = async () => {
            let goc = product.price * qty;
            let giam = 0;

            if (voucher) {
                giam = await checkVoucher(voucher, goc);
            }

            setUnitPrice(product.price);
            setTongGoc(goc);
            setDiscount(giam);
            setThanhToan(goc - giam);
        };

        updatePrice();
    }, [qty, voucher]);

    // ---- Đặt hàng ----
    const handleOrder = async () => {
        if (!user) {
            alert("Bạn cần đăng nhập trước khi đặt hàng!");
            nav.navigate("login");
            return;
        }

        // validate service target url
        if (product.type === "service" && !targetUrl.trim()) {
            alert("Vui lòng nhập Link dịch vụ (Target URL)!");
            return;
        }

        // validate service target url
        if (product.type === "service" && (!isValidUrl(targetUrl.trim()))) {
            alert("Link video không hợp lệ! Vui lòng dán link đầy đủ (http/https)");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");

            // Tạo order
            let orderRes = await authApis(token).post(endpoints["add-order"], {
                code: voucher || null,
            });
            let order = orderRes.data;

            // Payload cho order detail
            let detailPayload = {
                order: order.order_code,
                product: product.product_code,
                quantity: qty,
            };

            if (product.type === "service") {
                detailPayload.note = note;
                detailPayload.target_url = targetUrl;
                await authApis(token).post(endpoints["add-service-order-detail"],
                    detailPayload
                );
            } else {
                await authApis(token).post(endpoints["add-acc-order-detail"],
                    detailPayload
                );
            }

            alert("Đặt hàng thành công!");
            nav.navigate("order", { reload: true });
        } catch (err) {
            console.error("Lỗi đặt hàng:", err.response?.data || err);
            alert("Đặt hàng thất bại!");
        } finally {
            setLoading(false);
        }
    };



    // ---- Hỏi xác nhận trước khi đặt ----
    const confirmOrder = () => {
        Alert.alert(
            "Xác nhận đặt hàng",
            `Bạn có chắc muốn đặt hàng sản phẩm "${product.name}" với số lượng ${qty}?`,
            [
                { text: "Hủy", style: "cancel" },
                { text: "Đồng ý", onPress: handleOrder },
            ]
        );
    };


    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            {/* Ảnh sản phẩm */}
            <Image source={{ uri: product.image }} style={styles.imageProductDetail} />

            {/* Tên và giá */}
            <Text style={styles.name}>{product.name} | {product.store.name}</Text>
            <Text style={styles.price}>{product.price.toLocaleString()} VNĐ</Text>

            <View style={styles.favoriteBtn}>
                <TouchableOpacity style={styles.favoriteBtn} onPress={() => nav.navigate("homeStoreProduct", { store: product.store })}>
                    <Text style={styles.storeBtn}>Xem cửa hàng</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.favoriteBtn}>
                <TouchableOpacity onPress={handleAddFavorite} style={styles.favoriteBtn}>
                    <AntDesign name={favorited ? "heart" : "hearto"} size={24} color={favorited ? "red" : "black"} />
                    <Text style={styles.marginLeft}>{favorited ? "Đã yêu thích" : "Yêu thích"}</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.chatBtn}
                onPress={() =>
                    nav.navigate("chatBox", {
                        seller: product.store.seller,
                        user: user, // pass thông tin người mua hiện tại
                    })
                }
            >
                <Text style={styles.storeBtn}>💬 Chat với người bán</Text>
            </TouchableOpacity>

            <Text style={styles.subInfoProduct} >Loại: {product.type}</Text>
            <Text style={styles.subInfoProduct}>Định dạng: {product.format}</Text>
            <Text style={styles.subInfoProduct}>Bảo hành: {product.warranty_days} ngày</Text>

            {product.type !== "service" && (
                <Text style={styles.subInfoProduct}>
                    Kho: {product.available_quantity}
                </Text>
            )}

            {/* Mô tả */}
            <Text style={styles.label}>Mô tả:</Text>
            <Text style={styles.desc}>{product.description}</Text>

            {/* Nhập số lượng */}
            <Text style={styles.label}>Số lượng:</Text>
            <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(qty)}
                onChangeText={(val) => setQty(Number(val))}
            />

            {/* Nếu là service thì nhập target_url + note */}
            {product.type === "service" && (
                <>
                    <Text style={styles.label}>Link dịch vụ:</Text>
                    <TextInput
                        style={styles.input}
                        value={targetUrl}
                        onChangeText={setTargetUrl}
                        placeholder="Nhập link TikTok/YouTube/Instagram"
                    />

                    <Text style={styles.label}>Ghi chú:</Text>
                    <TextInput
                        style={styles.input}
                        value={note}
                        onChangeText={setNote}
                        placeholder="Nhập ghi chú nếu có"
                    />
                </>
            )}

            {/* Voucher */}
            <Text style={styles.label}>Mã giảm giá (nếu có):</Text>
            <TextInput
                style={styles.input}
                value={voucherInput}
                onChangeText={setVoucherInput}
                placeholder="Nhập mã voucher"
            />

            {/* Hiển thị giá realtime */}
            <View style={styles.priceBox}>
                <Text>💲 Unit Price: {unitPrice.toLocaleString()} đ</Text>
                <Text>📦 Total Amount: {tongGoc.toLocaleString()} đ</Text>
                <Text>🎟️ Discount: -{discount.toLocaleString()} đ</Text>
                <Text style={styles.finalPrice}>
                    ✅ Final Payment: {thanhToan.toLocaleString()} đ
                </Text>
            </View>

            {/* Nút đặt hàng */}
            <TouchableOpacity
                style={styles.orderBtn}
                onPress={confirmOrder}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.orderText}>Đặt hàng</Text>
                )}
            </TouchableOpacity>

            <Text style={styles.label}>Đánh giá sản phẩm:</Text>

            {loading ? (
                <ActivityIndicator size="large" color="blue" />
            ) : reviews.length === 0 ? (
                <Text>Chưa có đánh giá nào.</Text>
            ) : (
                reviews.map((r, idx) => (
                    <View key={idx} style={styles.reviewBox}>
                        <Text style={styles.reviewUser}>👤 {r.buyer.username} - ⭐ {r.rating}/5</Text>
                        <Text></Text>
                        {r.comment && <Text>{r.comment}</Text>}
                    </View>
                ))
            )}

            {hasMore && !loading && (
                <TouchableOpacity
                    onPress={loadMore}
                    disabled={loadingMore}
                    style={styles.loadMoreBtn}
                >
                    <Text style={styles.loadMoreText}>
                        {loadingMore ? "Đang tải..." : "Xem thêm"}
                    </Text>
                </TouchableOpacity>
            )}

        </ScrollView>
    );
};

export default HomeProductDetail;
