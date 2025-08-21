import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, Alert, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ActivityIndicator, Button } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./StoreStyle";

const ProductDetail = () => {
  const { product } = useRoute().params;
  const nav = useNavigation();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const handleDelete = async () => {
    Alert.alert(
      "Xác nhận xoá",
      "Bạn có chắc muốn xoá sản phẩm này?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await authApis(token).delete(endpoints["delete-product"](product.product_code));
              Alert.alert("Đã xoá", "Sản phẩm đã được xoá.");
              nav.navigate("storeSeller", { reload: true });
            } catch (err) {
              console.error("Lỗi xoá:", err);
              Alert.alert("Lỗi", "Không thể xoá sản phẩm.");
            }
          },
        },
      ]
    );
  };

  const loadReviews = async (p = 1) => {
    try {
      if (p === 1) setLoading(true);

      const res = await Apis.get(`${endpoints["get-reviews"](product.product_code)}?page=${p}`);

      if (p === 1) {
        setReviews(res.data.results);
      } else {
        setReviews((prev) => [...prev, ...res.data.results]);
      }

      setHasMore(res.data.next !== null);
    } catch (err) {
      console.error("Lỗi load reviews:", err.response?.data || err);
    } finally {
      if (p === 1) setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadReviews(1);
  }, [product.product_code]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    loadReviews(nextPage);
    setPage(nextPage);
  };

  const handleEdit = () => {
    nav.navigate("updateProduct", { product });
  };

  const navStocks = () => {
    nav.navigate("stocks", { product });
  };


  return (
    <ScrollView contentContainerStyle={MyStyles.container}>
      <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
      <Text style={styles.info}>Tên sản phẩm: <Text style={styles.label}>{product.name}</Text></Text>
      <Text style={styles.info}>Định dạng: <Text style={styles.label}>{product.format}</Text></Text>
      <Text style={styles.info}>Giá: <Text style={styles.label}>{product.price} VNĐ</Text></Text>
      <Text style={styles.info}>Loại sản phẩm: <Text style={styles.label}>{product.type}</Text></Text>
      <Text style={styles.info}>Số lượng còn: <Text style={styles.label}>{product.available_quantity}</Text></Text>
      <Text style={styles.info}>Số ngày bảo hành: <Text style={styles.label}>{product.warranty_days} ngày</Text></Text>
      <Text style={styles.info}>Mô tả: <Text style={styles.label}>{product.description}</Text></Text>
      <Text style={styles.info}>Ngày tạo: <Text style={styles.label}>{new Date(product.created_date).toLocaleDateString()}</Text></Text>
      <Text style={styles.info}>Ngày cập nhật: <Text style={styles.label}>{new Date(product.updated_date).toLocaleDateString()}</Text></Text>
      <Text style={styles.info}>Phê duyệt: <Text style={styles.label}>{product.is_approved ? "Đã duyệt" : "Chưa duyệt"}</Text></Text>

      <View style={styles.buttonUpdateProduct}>
        <Button mode="contained" buttonColor="red" textColor="white" onPress={handleDelete}>Xoá</Button>
        <Button mode="outlined" onPress={handleEdit}>Chỉnh sửa</Button>

        {product.type !== "service" && (
          <Button mode="contained" onPress={navStocks}>Kho sản phẩm</Button>
        )}
      </View>

      <Text style={styles.reviewTitle}>Đánh giá sản phẩm:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="blue" />
      ) : reviews.length === 0 ? (
        <Text>Chưa có đánh giá nào.</Text>
      ) : (
        reviews.map((r, idx) => (
          <View key={idx} style={styles.reviewBox}>
            <Text style={styles.reviewUser}>👤 {r.buyer.username} - ⭐ {r.rating}/5</Text>
            <Text></Text>
            {r.comment && <Text>{r.comment}</Text>}
          </View>
        ))
      )}

      {hasMore && !loading && (
        <TouchableOpacity
          onPress={loadMore}
          disabled={loadingMore}
          style={styles.loadMoreBtn}
        >
          <Text style={styles.loadMoreText}>
            {loadingMore ? "Đang tải..." : "Xem thêm"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default ProductDetail;
