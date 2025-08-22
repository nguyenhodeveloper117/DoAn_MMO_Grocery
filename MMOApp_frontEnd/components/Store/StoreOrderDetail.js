import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
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
                        <Text>Sản phẩm: {detail.detail.product_info?.name} | {detail.detail.product_info?.store.name}</Text>
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
        </ScrollView>
    );
};

export default StoreOrderDetail;
