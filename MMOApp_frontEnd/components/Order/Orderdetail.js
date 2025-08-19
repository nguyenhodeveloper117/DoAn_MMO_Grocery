import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";

const OrderDetail = ({ route }) => {
    const { order } = route.params; // nhận từ UserOrder
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);

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

    if (loading) return <ActivityIndicator style={{ marginTop: 20 }} />;

    if (!detail) {
        return <Text style={styles.center}>Không tìm thấy chi tiết đơn hàng</Text>;
    }

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            {/* Order info */}
            <View style={styles.card}>
                <Text style={styles.title}>Thông tin đơn hàng</Text>
                <Text>Mã đơn: {order.order_code}</Text>
                <Text>Trạng thái: {order.status}</Text>
                <Text>Ngày tạo: {new Date(order.created_date).toLocaleString()}</Text>
                <Text>Ngày cập nhật: {new Date(order.updated_date).toLocaleString()}</Text>
            </View>

            {/* Detail */}
            <View style={styles.card}>
                <Text style={styles.title}>Chi tiết</Text>
                {detail.type === "account" ? (
                    <>
                        <Text>Sản phẩm: {detail.detail.product_info?.name}</Text>
                        <Text>Số lượng: {detail.detail.quantity}</Text>
                        <Text>Giá: {detail.detail.unit_price}đ</Text>
                        <Text>Giảm giá: {detail.detail.discount_amount}đ</Text>
                        <Text>Tổng: {detail.detail.total_amount}đ</Text>
                        <Text>Nội dung: {detail.detail.content_delivered}</Text>
                    </>
                ) : (
                    <>
                        <Text>Sản phẩm: {detail.detail.product_info?.name}</Text>
                        <Text>Target URL: {detail.detail.target_url}</Text>
                        <Text>Số lượng: {detail.detail.quantity}</Text>
                        <Text>Giá: {detail.detail.unit_price}đ</Text>
                        <Text>Giảm giá: {detail.detail.discount_amount}đ</Text>
                        <Text>Tổng: {detail.detail.total_amount}đ</Text>
                        <Text>Trạng thái dịch vụ: {detail.detail.status}</Text>
                        <Text>Ngày hoàn thành: {detail.detail.delivered_at 
                            ? new Date(detail.detail.delivered_at).toLocaleString() 
                            : "Chưa có"}</Text>
                    </>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 12,
        color: "#333",
    },
    label: {
        fontSize: 14,
        color: "#555",
        marginBottom: 4,
    },
    value: {
        fontSize: 15,
        fontWeight: "500",
        color: "#111",
        marginBottom: 8,
    },
    status: {
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 6,
        alignSelf: "flex-start",
    },
    total: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#e63946",
        marginTop: 8,
    },
    center: {
        textAlign: "center",
        marginTop: 30,
        fontSize: 14,
        color: "#777",
    },
});


export default OrderDetail;
