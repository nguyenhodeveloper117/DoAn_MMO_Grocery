import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { useNavigation } from "@react-navigation/native";
import styles from "./StoreStyle";
import { Dimensions } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";

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

// Hàm lấy ngày hôm nay (0h00 -> 23h59)
const getTodayRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return { start, end };
};

const StoreOrder = () => {
    const screenWidth = Dimensions.get("window").width;
    const nav = useNavigation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [stats, setStats] = useState(null);

    const { start, end } = getTodayRange();
    const [startDate, setStartDate] = useState(start.toISOString());
    const [endDate, setEndDate] = useState(end.toISOString());

    const debounceTimeout = useRef(null);

    const loadOrders = useCallback(async (pageNumber = 1, append = false) => {
        if (append && pageNumber > totalPages) return;
        if (!append) setLoading(true);

        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["store-order"], {
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

    // hàm load thống kê
    const loadStats = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["store-stat"], {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                },
            });
            setStats(res.data);
        } catch (err) {
            console.error("Lỗi load stats:", err?.response?.data || err);
        }
    }, [startDate, endDate]);

    // khi mount -> load cả orders và stats
    useEffect(() => {
        loadOrders(1, false);
        loadStats();
    }, []);


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
        await loadStats();
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

    // component hiển thị thống kê
    const renderStats = () => {
        if (!stats) return null;

        return (
            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Thống kê</Text>
                <Text>
                    Từ: {new Date(startDate).toLocaleDateString("vi-VN")} -{" "}
                    Đến: {new Date(endDate).toLocaleDateString("vi-VN")}
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 8 }}>
                    <View style={styles.width50}>
                        <Text>Tổng số đơn: {stats.total_orders}</Text>
                    </View>
                    <View style={styles.width50}>
                        <Text>Tổng doanh thu: {stats.total_revenue}đ</Text>
                    </View>
                    <View style={styles.width50}>
                        <Text>Đơn account: {stats.acc_orders}</Text>
                        <Text>({stats.acc_revenue}đ)</Text>
                    </View>
                    <View style={styles.width50}>
                        <Text>Đơn dịch vụ: {stats.service_orders}</Text>
                        <Text>({stats.service_revenue}đ)</Text>
                    </View>
                </View>

                {/* Biểu đồ */}
                <BarChart
                    data={{
                        labels: ["Tổng", "Account", "Dịch vụ"],
                        datasets: [
                            {
                                data: [
                                    stats.total_orders || 0,
                                    stats.acc_orders || 0,
                                    stats.service_orders || 0,
                                ],
                            },
                        ],
                    }}
                    width={screenWidth - 100} // trừ margin
                    height={220}
                    yAxisLabel=""
                    chartConfig={{
                        backgroundColor: "#ffffff",
                        backgroundGradientFrom: "#ffffff",
                        backgroundGradientTo: "#ffffff",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    style={styles.diagram}
                />

                <PieChart
                    data={[
                        {
                            name: "Account",
                            revenue: stats.acc_revenue || 0,
                            color: "#36A2EB",
                            legendFontColor: "#000",
                            legendFontSize: 12,
                        },
                        {
                            name: "Dịch vụ",
                            revenue: stats.service_revenue || 0,
                            color: "#FF6384",
                            legendFontColor: "#000",
                            legendFontSize: 12,
                        },
                    ]}
                    width={screenWidth - 100}
                    height={220}
                    accessor={"revenue"} // field dùng để tính %
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                    }}
                    absolute // hiện giá trị tuyệt đối thay vì %
                />
            </View>
        );
    };

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
                    {/* Chọn thời gian */}
                    <TextInput
                        label="Ngày bắt đầu"
                        value={startDate}
                        onChangeText={setStartDate}
                        mode="outlined"
                        style={styles.marginBottom}
                    />
                    <TextInput
                        label="Ngày kết thúc"
                        value={endDate}
                        onChangeText={setEndDate}
                        mode="outlined"
                        style={styles.marginBottom}
                    />
                    <Button mode="contained" onPress={loadStats} style={styles.marginBottom}>
                        Lọc thống kê
                    </Button>

                    {/* Quick range filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.marginBottom}
                        contentContainerStyle={styles.marginRight}
                    >
                        {[7, 30, 90].map(days => (
                            <Button
                                key={days}
                                mode="outlined"
                                style={styles.marginRight}
                                onPress={() => {
                                    const now = new Date();
                                    const start = new Date();
                                    start.setDate(now.getDate() - days + 1); // trừ bớt ngày
                                    setStartDate(start.toISOString());
                                    setEndDate(now.toISOString());
                                    loadStats();
                                }}
                            >
                                {days} ngày gần nhất
                            </Button>
                        ))}
                    </ScrollView>

                    {renderStats()}



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

export default StoreOrder;
