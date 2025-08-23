import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, ScrollView } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Button, TextInput } from "react-native-paper";
import Apis, { endpoints } from "../../configs/Apis";
import styles from "./HomeStyle";
import MyStyles from "../../styles/MyStyles";

const categories = [
    { value: "", label: "Tất cả" },
    { value: "account", label: "Tài khoản" },
    { value: "service", label: "Dịch vụ" },
    { value: "software", label: "Phần mềm" },
    { value: "course", label: "Khoá học" },
];

const pageSize = 5;

const HomeStoreProduct = () => {
    const route = useRoute();
    const nav = useNavigation();
    const { store } = route.params; // store truyền từ HomeProductDetail

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);

    const debounceTimeout = useRef(null);

    const fetchAvgRating = async (productCode) => {
        try {
            const res = await Apis.get(endpoints["get-reviews"](productCode));
            const reviews = res.data.results || [];
            if (reviews.length === 0) return null;

            const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
            return (sum / reviews.length).toFixed(1);
        } catch (err) {
            console.error("Lỗi load reviews:", err?.response?.data || err);
            return null;
        }
    };

    const loadProducts = useCallback(
        async (pageNumber = 1, append = false) => {
            if (append && pageNumber > totalPages) return;
            if (!append) setLoading(true);

            try {
                const res = await Apis.get(endpoints["get-product-store"](store.store_code), {
                    params: {
                        search: searchText || undefined,
                        type: category || undefined,
                        page: pageNumber,
                    },
                });

                let data = res.data.results || res.data;

                // Gắn avg_rating cho từng sản phẩm
                const dataWithRating = await Promise.all(
                    data.map(async (p) => {
                        const avg = await fetchAvgRating(p.product_code);
                        return { ...p, avg_rating: avg };
                    })
                );

                setProducts((prev) => {
                    const merged = append ? [...prev, ...dataWithRating] : dataWithRating;
                    return merged.filter(
                        (item, index, self) =>
                            index === self.findIndex((t) => t.product_code === item.product_code)
                    );
                });

                setPage(pageNumber);
                const count = res.data.count || 0;
                setTotalProducts(count);
                setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
            } catch (err) {
                console.error("Lỗi load sản phẩm:", err?.response?.data || err);
            } finally {
                if (!append) setLoading(false);
            }
        },
        [searchText, category, store.store_code, totalPages]
    );

    // debounce search & filter
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            loadProducts(1, false);
        }, 500);
        return () => clearTimeout(debounceTimeout.current);
    }, [searchText, category]);

    useEffect(() => {
        loadProducts(1, false);
    }, [store.store_code]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadProducts(1, false);
        setRefreshing(false);
    };

    const loadMore = () => {
        if (!loading && page < totalPages) {
            loadProducts(page + 1, true);
        }
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.product, styles.viewRenderItem]}
            onPress={() => nav.navigate("homeProductDetail", { product: item })}
        >
            <Image source={{ uri: item.image }} style={styles.image} />

            <View style={styles.flex1}>
                <Text style={styles.productTitle}>{item.name}</Text>
                {item.avg_rating ? (
                    <Text style={styles.reviewStar}>⭐ {item.avg_rating}/5</Text>
                ) : (
                    <Text style={styles.noReview}>⭐ Chưa có đánh giá</Text>
                )}

                <Text style={styles.productCategory}>
                    {item.price}đ | Loại: {item.type} |{" "}
                    {new Date(item.created_date).toLocaleDateString()}
                </Text>
                <Text numberOfLines={2} ellipsizeMode="tail" style={styles.productDes}>
                    {item.description}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <FlatList
            data={products}
            keyExtractor={(item, index) => String(item.product_code || `index-${index}`)}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            contentContainerStyle={MyStyles.container}
            ListFooterComponent={page < totalPages && <ActivityIndicator />}
            ListEmptyComponent={<Text style={styles.noProduct}>Không có sản phẩm nào!</Text>}
            ListHeaderComponent={
                <View>
                    {/* Info Store */}
                    <View style={[styles.priceBox, styles.marginBottom]}>
                        <Text style={styles.name}>{store.name}</Text>
                        <Text style={styles.subInfoProduct}>Mô tả: {store.description}</Text>
                        <Text style={styles.created_date}>Ngày tạo: {new Date(store.created_date).toLocaleDateString()}</Text>
                        <Text style={styles.infoTotal}>Tổng sản phẩm: {totalProducts}</Text>
                    </View>

                    {/* Search */}
                    <TextInput
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchText}
                        onChangeText={setSearchText}
                        mode="outlined"
                        style={styles.marginBottom}
                        right={<TextInput.Icon icon="magnify" onPress={() => loadProducts(1, false)} />}
                    />

                    {/* Category filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.marginBottom}
                        contentContainerStyle={styles.marginRight}
                    >
                        {categories.map((item) => (
                            <Button
                                key={item.value}
                                mode={category === item.value ? "contained" : "outlined"}
                                style={styles.marginRight}
                                onPress={() => setCategory(item.value)}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </ScrollView>

                    <Text style={styles.infoTotal}>Tổng số trang: {totalPages}</Text>
                </View>
            }
        />
    );
};

export default HomeStoreProduct;
