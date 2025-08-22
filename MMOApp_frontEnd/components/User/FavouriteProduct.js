import React, { useEffect, useState, useContext, useRef } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, ScrollView, } from "react-native";
import { TextInput } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { MyUserContext } from "../../configs/Contexts";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import styles from "./UserStyle";
import MyStyles from "../../styles/MyStyles";

const FavouriteProducts = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchText, setSearchText] = useState("");

    const debounceTimeout = useRef(null);
    const [refreshing, setRefreshing] = useState(false);

    const user = useContext(MyUserContext);
    const nav = useNavigation();

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

    const loadFavorites = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["my-favorite"], {
                params: {
                    search: searchText || undefined,
                },
            });

            let data = res.data.results || res.data;

            // gọi song song để lấy avg_rating cho từng product
            const dataWithRating = await Promise.all(
                data.map(async (item) => {
                    const product = item.product || item; // backend có thể bọc product trong object
                    const avg = await fetchAvgRating(product.product_code);
                    return { ...product, avg_rating: avg };
                })
            );

            setFavorites(dataWithRating);
        } catch (err) {
            console.error("Lỗi load favorites:", err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };


    // chạy lần đầu
    useEffect(() => {
        loadFavorites();
    }, []);

    // debounce search
    useEffect(() => {
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            loadFavorites();
        }, 500);

        return () => clearTimeout(debounceTimeout.current);
    }, [searchText]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadFavorites();
        setRefreshing(false);
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
                {item.avg_rating ? (
                    <Text style={styles.reviewStar}>
                        ⭐ {item.avg_rating}/5
                    </Text>
                ) : (
                    <Text style={styles.noReview}>⭐ Chưa có đánh giá</Text>
                )}


                <Text style={styles.productCategory} >
                    {item.price}đ | Loại: {item.type} | {new Date(item.created_date).toLocaleDateString()}
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

    if (loading) return <ActivityIndicator size="large" color="blue" />;

    return (
        <View style={MyStyles.container}>
            <TextInput
                placeholder="Tìm sản phẩm yêu thích..."
                value={searchText}
                onChangeText={setSearchText}
                mode="outlined"
                style={{ marginBottom: 10 }}
                right={<TextInput.Icon icon="magnify" />}
            />

            {favorites.length === 0 ? (
                <Text>Bạn chưa có sản phẩm yêu thích nào.</Text>
            ) : (
                <FlatList
                    data={favorites}
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    renderItem={renderItem}
                    keyExtractor={(item, idx) =>
                        item.product?.product_code || item.product_code || idx.toString()
                    }
                    contentContainerStyle={{ paddingBottom: 20 }} // nếu muốn spacing
                />
            )}
        </View>
    );
};

export default FavouriteProducts;
