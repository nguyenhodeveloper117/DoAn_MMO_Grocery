import React, { useState, useEffect } from "react";
import { useContext } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./HomeStyle";
import { useNavigation } from "@react-navigation/native";

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

    const nav = useNavigation();

    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);

    // Gọi API check voucher
    const checkVoucher = async (code, total) => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(endpoints["check-voucher"], {
                code,
                total_amount: total,
            });
            return res.data.discount_amount || 0;
        } catch (err) {
            return 0;
        }
    };

    // Tính toán giá realtime
    useEffect(() => {
        const updatePrice = async () => {
            let goc = product.price * qty;
            let giam = 0;

            if (voucher && voucher.trim() !== "") {
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

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");

            // Tạo order
            let orderRes = await authApis(token).post(endpoints["add-order"], {
                voucher_code: voucher || null,
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
            nav.navigate("home", { reload: true });
        } catch (err) {
            console.error("Lỗi đặt hàng:", err.response?.data || err);
            alert("Đặt hàng thất bại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            {/* Ảnh sản phẩm */}
            <Image source={{ uri: product.image }} style={styles.imageProductDetail} />

            {/* Tên và giá */}
            <Text style={styles.name}>{product.name}</Text>
            <Text style={styles.price}>{product.price.toLocaleString()} VNĐ</Text>
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
                value={voucher}
                onChangeText={setVoucher}
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
                onPress={handleOrder}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.orderText}>Đặt hàng</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
};

export default HomeProductDetail;
