import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, Image, Linking } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "../Order/OrderStyle";
import { useNavigation } from "@react-navigation/native";
import { Alert } from "react-native";

const StoreOrderDetail = ({ route }) => {
    const { order } = route.params; // nhận từ UserOrder
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const nav = useNavigation();
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
                action: "cancel",
                status: "cancel",
            });

            // 2. PATCH service order detail -> FAILED
            await authApis(token).patch(endpoints["update-service-order-detail"](serviceDetailId), {
                status: "failed",
            });

            alert("Đã huỷ dịch vụ thành công!");
            nav.navigate("storeOrder", { reload: true });
        } catch (err) {
            console.error("Lỗi huỷ dịch vụ:", err?.response?.data || err);
            alert("Không thể huỷ dịch vụ!");
        }
    };

    const handleUpdateServiceProcessing = async (orderId, serviceDetailId) => {
        try {
            const token = await AsyncStorage.getItem("token");

            // 1. PATCH order -> CANCEL
            await authApis(token).patch(endpoints["update-order"](orderId), {
                action: "accept",
                status: "processing",
            });

            // 2. PATCH service order detail -> FAILED
            await authApis(token).patch(endpoints["update-service-order-detail"](serviceDetailId), {
                status: "in_progress",
            });

            alert("Đã cập nhật dịch vụ thành Processing thành công!");
            nav.navigate("storeOrder", { reload: true });
        } catch (err) {
            console.error("Lỗi cập nhật dịch vụ:", err?.response?.data || err);
            alert("Không thể cập nhật dịch vụ!");
        }
    };

    const handleUpdateServiceCompleted = async (orderId, serviceDetailId) => {
        try {
            const token = await AsyncStorage.getItem("token");

            // 1. PATCH order -> CANCEL
            await authApis(token).patch(endpoints["update-order"](orderId), {
                action: "complete",
                status: "delivered",
            });

            // 2. PATCH service order detail -> FAILED
            await authApis(token).patch(endpoints["update-service-order-detail"](serviceDetailId), {
                status: "completed",
            });

            alert("Đã cập nhật dịch vụ thành Completed thành công!");
            nav.navigate("storeOrder", { reload: true });
        } catch (err) {
            console.error("Lỗi cập nhật dịch vụ:", err?.response?.data || err);
            alert("Không thể cập nhật dịch vụ!");
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
                        {/* Nút chuyển hướng sang trang chi tiết sản phẩm */}
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

                        {detail.detail.status === "pending" && order.status === "processing" && (
                            <TouchableOpacity
                                style={styles.processingButton}
                                onPress={() =>
                                    Alert.alert(
                                        "Xác nhận cập nhật",
                                        "Bạn có chắc chắn chấp nhận đơn hàng này không?",
                                        [
                                            { text: "Không", style: "cancel" },
                                            {
                                                text: "Có",
                                                style: "destructive",
                                                onPress: () => handleUpdateServiceProcessing(order.order_code, detail.detail.service_order_detail_code)
                                            }
                                        ]
                                    )
                                }
                            >
                                <Text style={styles.cancelButtonText}>Chấp nhận</Text>
                            </TouchableOpacity>
                        )}

                        {detail.detail.status === "in_progress" && order.status === "processing" && (
                            <TouchableOpacity
                                style={styles.completedButton}
                                onPress={() =>
                                    Alert.alert(
                                        "Xác nhận cập nhật",
                                        "Bạn có chắc chắn hoàn thành đơn hàng này không?",
                                        [
                                            { text: "Không", style: "cancel" },
                                            {
                                                text: "Có",
                                                style: "destructive",
                                                onPress: () => handleUpdateServiceCompleted(order.order_code, detail.detail.service_order_detail_code)
                                            }
                                        ]
                                    )
                                }
                            >
                                <Text style={styles.cancelButtonText}>Hoàn thành đơn hàng</Text>
                            </TouchableOpacity>
                        )}
                    </>
                ) : (
                    <>
                        {/* Nút chuyển hướng sang trang chi tiết sản phẩm */}
                        <TouchableOpacity
                            style={styles.detailButton}
                            onPress={() => nav.navigate("orderProductDetail", { product: detail.detail.product_info })}
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
                {complaints.length > 0 ? (
                    complaints.map((complaint) => (
                        <View key={complaint.complaint_code} style={styles.complaintCard}>
                            <Text style={styles.title}>Thông tin khiếu nại</Text>
                            <Text style={styles.value}>Người khiếu nại: {complaint.buyer.username}</Text>
                            <Text style={styles.value}>Nội dung: {complaint.message}</Text>
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

                            <TouchableOpacity
                                style={styles.cardDetailComplaint}
                                onPress={() => nav.navigate("orderComplaint", { order: order, order_detail: detail })}
                            >
                                <Text style={styles.complaintTitle}>Phản hồi khiếu nại</Text>
                            </TouchableOpacity>
                        </View>
                    ))
                ) : (
                    <TouchableOpacity style={styles.cardDetailComplaint}>
                        <Text style={styles.complaintTitle}>Không có khiếu nại</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView >
    );
};

export default StoreOrderDetail;
