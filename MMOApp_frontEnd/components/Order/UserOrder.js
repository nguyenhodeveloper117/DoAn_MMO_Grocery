import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import styles from "./OrderStyle";
import MyStyles from "../../styles/MyStyles";
import { useNavigation } from "@react-navigation/native";

const statuses = [
    { value: "", label: "Tất cả" },
    { value: "processing", label: "Đang xử lý" },
    { value: "delivered", label: "Đã giao" },
    { value: "complained", label: "Bị khiếu nại" },
    { value: "refunded", label: "Đã hoàn tiền" },
    { value: "completed", label: "Hoàn thành" },
    { value: "cancel", label: "Huỷ" },
];

const pageSize = 5;

const UserOrder = () => {
    const nav = useNavigation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const debounceTimeout = useRef(null);

    const loadOrders = useCallback(async (pageNumber = 1, append = false) => {
        if (append && pageNumber > totalPages) return;
        if (!append) setLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["my-order"], {
                params: {
                    search: searchText || undefined,
                    status: status || undefined,
                    page: pageNumber,
                },
            });

            const data = res.data.results || res.data;
            setOrders(prev => append ? [...prev, ...data] : data);
            setPage(pageNumber);

            const count = res.data.count || 0;
            setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
        } catch (err) {
            console.error("Lỗi load orders:", err?.response?.data || err);
        } finally {
            if (!append) setLoading(false);
        }
    }, [searchText, status, totalPages]);

    // debounce search
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            loadOrders(1, false);
        }, 500);
        return () => clearTimeout(debounceTimeout.current);
    }, [searchText, status]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadOrders(1, false);
        setRefreshing(false);
    };

    const loadMore = () => {
        if (!loading && page < totalPages) {
            loadOrders(page + 1, true);
        }
    };

    const renderItem = ({ item }) => (
    <TouchableOpacity
        style={styles.card}
        onPress={() => nav.navigate("orderDetail", { order: item })}
    >
        <View style={styles.flex1}>
            <Text style={styles.code}>Mã đơn: {item.order_code}</Text>
            <Text style={styles.status}>Trạng thái: {item.status}</Text>
            <Text style={styles.date}>
                Ngày tạo: {new Date(item.created_date).toLocaleString()} | 
                Ngày cập nhật: {new Date(item.updated_date).toLocaleString()}
            </Text>
        </View>
    </TouchableOpacity>
);


    return (
        <FlatList
            data={orders}
            keyExtractor={(item, index) => `${item.order_code}_${index}`} // Tránh key bị trùng
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={MyStyles.container}
            ListFooterComponent={page < totalPages && <ActivityIndicator />}
            ListEmptyComponent={<Text style={styles.center}>Không có đơn hàng nào</Text>}
            ListHeaderComponent={
                <View>
                    {/* Search */}
                    <TextInput
                        placeholder="Tìm mã đơn hàng..."
                        value={searchText}
                        onChangeText={setSearchText}
                        mode="outlined"
                        style={styles.marginBottom}
                        right={<TextInput.Icon icon="magnify" onPress={() => loadOrders(1, false)} />}
                    />

                    {/* Status filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.marginBottom}
                        contentContainerStyle={styles.marginRight}
                    >
                        {statuses.map(item => (
                            <Button
                                key={item.value}
                                mode={status === item.value ? "contained" : "outlined"}
                                style={styles.marginRight}
                                onPress={() => setStatus(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </ScrollView>
                </View>
            }
        />
    );
};

export default UserOrder;
