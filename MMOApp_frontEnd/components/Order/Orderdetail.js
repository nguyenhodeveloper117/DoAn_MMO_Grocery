import React, { useEffect, useState } from "react";
import { TextInput, Button, View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Image, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./OrderStyle";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";

const OrderDetail = ({ route }) => {
    const { order } = route.params; // nhận từ UserOrder
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();
    const [review, setReview] = useState("");
    const [rating, setRating] = useState(5);
    const [complaints, setComplaints] = useState([]);


    useEffect(() => {
        const loadDetail = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await authApis(token).get(endpoints["get-order-detail"](order.order_code));
                setDetail(res.data);
            } catch (err) {
                console.error("Lỗi load order detail:", err?.response?.data || err);
            } finally {
                setLoading(false);
            }
        };
        loadDetail();
    }, [order]);

    // Load complaint khi vào màn chi tiết đơn hàng
    useEffect(() => {
        const loadComplaints = async () => {
            try {
                const token = await AsyncStorage.getItem("token");
                const res = await authApis(token).get(endpoints["get-complaints"](order.order_code));
                if (res.data) {
                    setComplaints(res.data);  // lưu toàn bộ mảng
                }
            } catch (err) {
                console.error("Lỗi load complaint:", err?.response?.data || err);
            }
        };
        loadComplaints();
    }, [order]);

    const handleCancelService = async (orderId, serviceDetailId) => {
        try {
            const token = await AsyncStorage.getItem("token");

            // 1. PATCH order -> CANCEL
            await authApis(token).patch(endpoints["update-order"](orderId), {
                status: "cancel",
            });

            // 2. PATCH service order detail -> FAILED
            await authApis(token).patch(endpoints["update-service-order-detail"](serviceDetailId), {
                status: "failed",
            });

            alert("Đã huỷ dịch vụ thành công!");
            nav.navigate("userOrder", { reload: true });
        } catch (err) {
            console.error("Lỗi huỷ dịch vụ:", err?.response?.data || err);
            alert("Không thể huỷ dịch vụ!");
        }
    };

    const handleAddReview = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            await authApis(token).post(endpoints["add-review"], {
                product_code: detail.detail.product_info?.product_code,
                order_code: order.order_code,
                rating: rating,
                comment: review,
            });
            alert("Đã gửi đánh giá thành công!");
            setReview("");
            setRating(5);
        } catch (err) {
            console.error("Lỗi đánh giá sản phẩm", err?.response?.data || err);
            alert("Bạn đã đánh giá sản phẩm này rồi!");
        }
    };


    if (loading) return <ActivityIndicator style={styles.marginTop} />;

    if (!detail) {
        return <Text style={styles.center}>Không tìm thấy chi tiết đơn hàng</Text>;
    }

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            {/* Order info */}
            <View style={styles.cardDetail}>
                <Text style={styles.title}>Thông tin đơn hàng</Text>
                <Text>Mã đơn: {order.order_code}</Text>
                <Text>Trạng thái: {order.status}</Text>
                <Text>Ngày tạo: {new Date(order.created_date).toLocaleString()}</Text>
                <Text>Ngày cập nhật: {new Date(order.updated_date).toLocaleString()}</Text>
            </View>

            {/* Detail */}
            <View style={styles.cardDetail}>
                <Text style={styles.title}>Chi tiết</Text>
                {detail.type === "service" ? (
                    <>
                        <TouchableOpacity
                            style={styles.detailButton}
                            onPress={() => nav.navigate("homeProductDetail", { product: detail.detail.product_info })}
                        >
                            <Text style={styles.detailButtonText}><Text>Sản phẩm: {detail.detail.product_info?.name}</Text></Text>
                        </TouchableOpacity>
                        <Text>Loại: {detail.detail.product_info?.type}</Text>
                        <Text>Target URL: {detail.detail.target_url}</Text>
                        <Text>Số lượng: {detail.detail.quantity}</Text>
                        <Text>Giá: {detail.detail.unit_price}đ</Text>
                        <Text>Giảm giá: {detail.detail.discount_amount}đ</Text>
                        <Text>Tổng: {detail.detail.total_amount}đ</Text>
                        <Text>Trạng thái dịch vụ: {detail.detail.status}</Text>
                        <Text>Ngày hoàn thành: {detail.detail.delivered_at
                            ? new Date(detail.detail.delivered_at).toLocaleString()
                            : "Chưa có"}</Text>

                        {detail.detail.status === "pending" && order.status === "processing" && (
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() =>
                                    Alert.alert(
                                        "Xác nhận huỷ",
                                        "Bạn có chắc chắn muốn huỷ dịch vụ này không?",
                                        [
                                            { text: "Không", style: "cancel" },
                                            {
                                                text: "Có",
                                                style: "destructive",
                                                onPress: () => handleCancelService(order.order_code, detail.detail.service_order_detail_code)
                                            }
                                        ]
                                    )
                                }
                            >
                                <Text style={styles.cancelButtonText}>Huỷ dịch vụ</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <>
                        {/* Nút chuyển hướng sang trang chi tiết sản phẩm */}
                        <TouchableOpacity
                            style={styles.detailButton}
                            onPress={() => nav.navigate("homeProductDetail", { product: detail.detail.product_info })}
                        >
                            <Text style={styles.detailButtonText}><Text>Sản phẩm: {detail.detail.product_info?.name}</Text></Text>
                        </TouchableOpacity>
                        <Text>Loại: {detail.detail.product_info?.type}</Text>
                        <Text>Số lượng: {detail.detail.quantity}</Text>
                        <Text>Giá: {detail.detail.unit_price}đ</Text>
                        <Text>Giảm giá: {detail.detail.discount_amount}đ</Text>
                        <Text>Tổng: {detail.detail.total_amount}đ</Text>
                        <Text>Nội dung: {detail.detail.content_delivered}</Text>
                    </>
                )}
            </View>

            <View style={styles.cardDetail}>
                <Text style={styles.title}>Đánh giá sản phẩm</Text>

                <View style={styles.row}>
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setRating(star)}>
                            <Text style={{ fontSize: 24, color: star <= rating ? "gold" : "gray" }}>★</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Nhập đánh giá..."
                    value={review}
                    onChangeText={setReview}
                    multiline
                />
                <Button title="Gửi đánh giá" onPress={handleAddReview} />
            </View>

            <View style={styles.cardDetail}>
                {complaints.length > 0 ? (
                    complaints.map((complaint) => (
                        <View key={complaint.complaint_code} style={styles.complaintCard}>
                            <Text style={styles.title}>Thông tin khiếu nại</Text>
                            <Text style={styles.value}>Nội dung: {complaint.message}</Text>
                            <Text style={styles.value}>Người khiếu nại: {complaint.buyer.username}</Text>
                            <Text style={styles.value}>Quyết định: {complaint.decision}</Text>
                            <Text style={styles.value}>
                                Đã giải quyết: {complaint?.resolved ? "Đã giải quyết" : "Chưa giải quyết"}
                            </Text>
                            <Text style={styles.value}>
                                Giải quyết bởi: {complaint?.admin?.first_name} {complaint?.admin?.last_name}
                            </Text>

                            {complaint?.evidence_video && (
                                <TouchableOpacity onPress={() => Linking.openURL(complaint.evidence_video)} style={styles.marginTop}>
                                    <Text style={{ color: "blue", textDecorationLine: "underline" }}>
                                        Xem video minh chứng
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {complaint?.evidence_image1 && <Image source={{ uri: complaint.evidence_image1 }} style={styles.complaintImg} />}
                            {complaint?.evidence_image2 && <Image source={{ uri: complaint.evidence_image2 }} style={styles.complaintImg} />}
                            {complaint?.evidence_image3 && <Image source={{ uri: complaint.evidence_image3 }} style={styles.complaintImg} />}
                        </View>
                    ))
                ) : (
                    <TouchableOpacity
                        style={styles.cardDetailComplaint}
                        onPress={() => nav.navigate("orderComplaint", { order: order, order_detail: detail })}
                    >
                        <Text style={styles.complaintTitle}>Khiếu nại</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

export default OrderDetail;
