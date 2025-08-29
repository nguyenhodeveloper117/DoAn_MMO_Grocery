import React, { useState, useEffect, useContext, useRef, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { Button, TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import styles from "./UserStyle";
import MyStyles from "../../styles/MyStyles";

const Transaction = () => {
    const user = useContext(MyUserContext);

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [filterType, setFilterType] = useState("");

    const debounceRef = useRef(null);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    const loadTransactions = useCallback(
        async (query = "", type = "", pageNum = 1) => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const token = await AsyncStorage.getItem("token");
                const params = {};
                if (query) params.search = query;
                if (type) params.type = type;
                params.page = pageNum;

                const res = await authApis(token).get(endpoints["my-transactions"], { params });

                if (pageNum === 1) setTransactions(res.data.results);
                else setTransactions((prev) => [...prev, ...res.data.results]);

                setHasNext(!!res.data.next);
            } catch (err) {
                console.error("Lỗi load transactions:", err?.response?.data || err);
            } finally {
                setLoading(false);
            }
        },
        [user]
    );

    // chạy lần đầu
    useEffect(() => {
        loadTransactions(searchText, filterType, 1);
    }, [loadTransactions]);

    // debounce search + filter
    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            loadTransactions(searchText, filterType, 1);
            setPage(1);
        }, 500);

        return () => clearTimeout(debounceRef.current);
    }, [searchText, filterType, loadTransactions]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadTransactions(searchText, filterType, 1);
        setRefreshing(false);
    };

    const loadMore = () => {
        if (hasNext && !loading) {
            const nextPage = page + 1;
            setPage(nextPage);
            loadTransactions(searchText, filterType, nextPage);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={[styles.product, styles.viewRenderItem]}>
            <View style={styles.flex1}>
                <Text style={styles.productTitle}>
                    #{item.transaction_code} - {item.type.toUpperCase()}
                </Text>
                <Text style={styles.productDes}>Số tiền: {item.amount} VND</Text>
                {item.note ? (
                    <Text style={styles.productDes}>Ghi chú: {item.note}</Text>
                ) : null}
                <Text style={styles.productCategory}>
                    Ngày: {new Date(item.created_date).toLocaleString()}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading && transactions.length === 0)
        return <ActivityIndicator size="large" color="blue" />;

    return (
        <View style={MyStyles.container}>
            {/* Ô tìm kiếm */}
            <TextInput
                placeholder="Tìm theo mã giao dịch..."
                value={searchText}
                onChangeText={setSearchText}
                mode="outlined"
                style={styles.marginBottom}
                right={<TextInput.Icon icon="magnify" />}
            />

            {/* Filter loại giao dịch */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.marginBottom}
                contentContainerStyle={styles.marginRight}
            >
                {[
                    { label: "Tất cả", value: "" },
                    { label: "Nạp tiền", value: "deposit" },
                    { label: "Rút tiền", value: "withdraw" },
                    { label: "Hoàn tiền", value: "refund" },
                    { label: "Mua hàng", value: "purchase" },
                    { label: "Nhận tiền bán", value: "receive" },
                ].map((item) => (
                    <Button
                        key={item.value}
                        mode={filterType === item.value ? "contained" : "outlined"}
                        style={styles.marginRight}
                        onPress={() => setFilterType(item.value)}
                    >
                        {item.label}
                    </Button>
                ))}
            </ScrollView>


            {/* Danh sách giao dịch */}
            {transactions.length === 0 ? (
                <Text style={styles.noTransactionText}>Không có giao dịch.</Text>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item, idx) => item.transaction_code || idx.toString()}
                    renderItem={renderItem}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    onEndReached={loadMore}
                    onEndReachedThreshold={0.5}
                />
            )}
        </View>
    );
};

export default Transaction;
