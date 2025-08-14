// Stocks.js
import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { View, Text, Alert, RefreshControl, FlatList, ActivityIndicator, Keyboard } from "react-native";
import { TextInput, Button, Card, Dialog, Portal } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { MyUserContext } from "../../configs/Contexts";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./StoreStyle";

const StockDialog = React.memo(function StockDialog({
    visible, onDismiss, content, setContent, onSave, isEditing
}) {
    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onDismiss}>
                <Dialog.Title>{isEditing ? "Cập nhật kho" : "Thêm kho mới"}</Dialog.Title>
                <Dialog.Content>
                    <TextInput
                        label="Nội dung"
                        value={content}
                        onChangeText={setContent}
                        mode="outlined"
                        style={styles.marginBottom}
                        multiline
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onDismiss}>Hủy</Button>
                    <Button onPress={onSave}>Lưu</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
});

const emptyForm = { content: "" };

const Stock = () => {
    const route = useRoute();
    const product = route.params?.product;
    const user = useContext(MyUserContext);

    const [stocks, setStocks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);

    // search + debounce
    const [searchText, setSearchText] = useState("");
    const debounceRef = useRef(null);

    // dialog/form local
    const [dialogVisible, setDialogVisible] = useState(false);
    const [content, setContent] = useState("");
    const [editing, setEditing] = useState(null);

    // refresh
    const [refreshing, setRefreshing] = useState(false);

    const getStocksApiPath = useCallback((productId) => endpoints["get-stocks"](productId), []);

    const loadStocks = useCallback(
        async ({ page = 1, search = "", append = false } = {}) => {
            if (!product) return;
            if (!append) Keyboard.dismiss();

            try {
                if (append) setLoadingMore(true);
                else setLoading(true);

                const token = await AsyncStorage.getItem("token");
                const res = await authApis(token).get(getStocksApiPath(product.product_code ?? product.id),
                    { params: { page, search: search || undefined } }
                );

                const data = res.data;
                const results = data?.results ?? data ?? [];

                if (append) setStocks((prev) => [...prev, ...results]);
                else setStocks(Array.isArray(results) ? results : []);

                setHasNext(!!data?.next);
                setPage(page);
            } catch (err) {
                console.error("Lỗi load stocks:", err?.response?.data || err.message);
                Alert.alert("Lỗi", "Không thể tải kho tài khoản.");
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [product, getStocksApiPath]
    );

    useEffect(() => {
        loadStocks({ page: 1, search: "", append: false });
    }, [loadStocks]);

    // debounce search
    useEffect(() => {
        if (!product) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            loadStocks({ page: 1, search: searchText, append: false });
        }, 450);
        return () => clearTimeout(debounceRef.current);
    }, [searchText, loadStocks]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadStocks({ page: 1, search: searchText, append: false });
        setRefreshing(false);
    }, [loadStocks, searchText]);

    const handleLoadMore = useCallback(async () => {
        if (!hasNext || loadingMore) return;
        await loadStocks({ page: page + 1, search: searchText, append: true });
    }, [hasNext, loadingMore, page, loadStocks, searchText]);

    // open create dialog
    const openCreate = useCallback(() => {
        setEditing(null);
        setContent("");
        setDialogVisible(true);
    }, []);

    // open edit dialog
    const openEdit = useCallback((stock) => {
        setEditing(stock);
        setContent(stock.content ?? "");
        setDialogVisible(true);
    }, []);

    // save (create or update) - memoized
    const saveStock = useCallback(async () => {
        if (!content.trim()) {
            Alert.alert("Lỗi", "Nội dung không được để trống.");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("token");
            if (editing) {
                const res = await authApis(token).patch(endpoints["update-stocks"](editing.stock_code),
                    { content }
                );
                const updated = res.data;
                setStocks((prev) => prev.map((s) => (s.stock_code === editing.stock_code ? updated : s)));
                Alert.alert("Thành công", "Đã cập nhật kho.");
            } else {
                const res = await authApis(token).post(
                    endpoints["add-stocks"](product.product_code),
                    { content }
                );
                const created = res.data;
                setStocks((prev) => [created, ...prev]);
                Alert.alert("Thành công", "Đã thêm kho.");
            }
            setDialogVisible(false);
            setContent("");
            setEditing(null);
        } catch (err) {
            console.error("Lỗi lưu stock:", err?.response?.data || err.message);
            const msg = err?.response?.data ? JSON.stringify(err.response.data) : "Không thể lưu kho.";
            Alert.alert("Lỗi", msg);
        }
    }, [content, editing, product]);

    // delete
    const confirmDelete = useCallback((stock) => {
        Alert.alert("Xác nhận", "Bạn có chắc muốn xoá mục kho này?", [
            { text: "Hủy" },
            {
                text: "Xoá",
                style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem("token");
                        await authApis(token).delete(endpoints["delete-stocks"](stock.stock_code));
                        setStocks((prev) => prev.filter((s) => s.stock_code !== stock.stock_code));
                        Alert.alert("Thành công", "Đã xoá.");
                    } catch (err) {
                        console.error("Lỗi xoá stock:", err?.response?.data || err.message);
                        Alert.alert("Lỗi", "Không thể xoá kho.");
                    }
                }
            }
        ]);
    }, []);

    const renderItem = useCallback(
        ({ item }) => (
            <Card style={styles.marginBottom}>
                <Card.Title
                    title={item.product?.name ?? "Sản phẩm"}
                    subtitle={item.is_sold ? `Đã bán: ${item.sold_at ?? ""}` : "Chưa bán"}
                />
                <Card.Content>
                    <Text numberOfLines={3}>{item.content}</Text>
                </Card.Content>
                <Card.Actions>
                    <Button onPress={() => openEdit(item)}>Sửa</Button>
                    <Button style={styles.deleteButton} onPress={() => confirmDelete(item)}>
                        Xoá
                    </Button>
                </Card.Actions>
            </Card>
        ),
        [openEdit, confirmDelete]
    );

    const renderFooter = useCallback(() => {
        if (!loadingMore) return null;
        return (
            <View style={{ padding: 10 }}>
                <ActivityIndicator />
            </View>
        );
    }, [loadingMore]);

    return (
        <View style={MyStyles.container}>
            <TextInput
                placeholder="Tìm trong nội dung..."
                value={searchText}
                onChangeText={setSearchText}
                mode="outlined"
                style={styles.marginBottom}
            />

            <Button mode="contained" onPress={openCreate} style={styles.marginBottom}>
                + Thêm kho
            </Button>

            {loading && stocks.length === 0 ? (
                <ActivityIndicator />
            ) : (
                <FlatList
                    data={stocks}
                    keyExtractor={(item, idx) => item.stock_code ?? item.id?.toString() ?? String(idx)}
                    renderItem={renderItem}
                    ListEmptyComponent={<Text>Không có mục kho.</Text>}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={renderFooter}
                    keyboardShouldPersistTaps="handled"
                    removeClippedSubviews={false}
                    initialNumToRender={10}
                    windowSize={5}
                />
            )}

            <StockDialog
                visible={dialogVisible}
                onDismiss={() => setDialogVisible(false)}
                content={content}
                setContent={setContent}
                onSave={saveStock}
                isEditing={!!editing}
            />
        </View>
    );
};

export default Stock;
