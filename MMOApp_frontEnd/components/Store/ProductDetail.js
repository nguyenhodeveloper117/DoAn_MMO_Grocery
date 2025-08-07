import React from "react";
import { View, Text, Image, ScrollView, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Button } from "react-native-paper";
import MyStyles from "../../styles/MyStyles";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProductDetail = () => {
  const { product } = useRoute().params;
  const nav = useNavigation();

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

  const handleEdit = () => {
    nav.navigate("updateProduct", { product });
  };

  return (
    <ScrollView contentContainerStyle={MyStyles.container}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
        {product.name}
      </Text>

      <Image
        source={{ uri: product.image }}
        style={{ height: 200, borderRadius: 8, marginBottom: 10 }}
        resizeMode="cover"
      />

      <Text style={{ fontWeight: "bold" }}>Giá:</Text>
      <Text>{product.price} VNĐ</Text>

      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Định dạng:</Text>
      <Text>{product.format}</Text>

      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Loại sản phẩm:</Text>
      <Text>{product.type}</Text>

      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Số lượng còn:</Text>
      <Text>{product.available_quantity}</Text>

      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Số ngày bảo hành:</Text>
      <Text>{product.warranty_days} ngày</Text>

      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Mô tả:</Text>
      <Text>{product.description}</Text>

      <Text style={{ fontWeight: "bold", marginTop: 10 }}>Phê duyệt: </Text>
      <Text>{product.is_approved ? "Đã duyệt" : "Chưa duyệt"}</Text>

      <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: 20 }}>
        <Button mode="outlined" onPress={handleEdit}>
          Chỉnh sửa
        </Button>
        <Button mode="contained" buttonColor="red" textColor="white" onPress={handleDelete}>
          Xoá
        </Button>
      </View>
    </ScrollView>
  );
};

export default ProductDetail;
