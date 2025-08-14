import React, { useCallback, useContext, useEffect, useRef, useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, ScrollView, Image } from "react-native";
import { Button, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import Apis, { endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./HomeStyle";
import { MyUserContext } from "../../configs/Contexts";

const categories = [
    { value: "", label: "Tất cả" },
    { value: "account", label: "Tài khoản" },
    { value: "service", label: "Dịch vụ" },
    { value: "software", label: "Phần mềm" },
    { value: "course", label: "Khoá học" },
];

const Home = () => {
    const nav = useNavigation();
    const user = useContext(MyUserContext);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [searchText, setSearchText] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [isFirstLoadDone, setIsFirstLoadDone] = useState(false);
    const debounceTimeout = useRef(null);

    const pageSize = 5;

    const loadProducts = useCallback(
        async (pageNumber = 1, append = false) => {
            if (append && pageNumber > totalPages) return;
            if (!append) setLoading(true);

            try {
                const res = await Apis.get(endpoints["get-products"], {
                    params: {
                        search: searchText || undefined,
                        type: category || undefined,
                        page: pageNumber,
                    },
                });

                const data = res.data.results || res.data;
                // Khi merge data
                setProducts(prev => {
                    const merged = append ? [...prev, ...data] : data;
                    return merged.filter(
                        (item, index, self) =>
                            index === self.findIndex(t => t.product_code === item.product_code)
                    );
                });
                setPage(pageNumber);

                const count = res.data.count || 0;
                setTotalPages(Math.max(1, Math.ceil(count / pageSize)));
            } catch (err) {
                console.error("Lỗi load products:", err?.response?.data || err);
            } finally {
                if (!append) setLoading(false);
                setIsFirstLoadDone(true);
            }
        },
        [searchText, category, totalPages]
    );

    // debounce search & filter
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            loadProducts(1, false);
        }, 500);
        return () => clearTimeout(debounceTimeout.current);
    }, [searchText, category]);

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
            <Image
                source={{ uri: item.image }}
                style={styles.image}
            />

            <View style={styles.flex1}>
                <Text style={styles.productTitle} >
                    {item.name}
                </Text>

                <Text style={styles.productCategory} >
                    Loại: {item.type} | {item.price}đ | {new Date(item.created_date).toLocaleDateString()}
                </Text>
                <Text
                    numberOfLines={2}
                    ellipsizeMode="tail"
                    style={styles.productDes}
                >
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
            ListFooterComponent={
                page < totalPages && <ActivityIndicator />
            }
            ListEmptyComponent={<Text style={styles.noProduct}>Chưa có sản phẩm nào!</Text>}
            ListHeaderComponent={
                <View>
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
                </View>
            }
        />

    );
};

export default Home;
