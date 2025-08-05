import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./StoreStyle"; // hoặc file riêng cho AddProduct
import MyStyles from "../../styles/MyStyles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";



const AddProduct = () => {
    const [product, setProduct] = useState({});
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);
    const nav = useNavigation();
    const route = useRoute();
    const { storeId } = route.params;

    const setState = (field, value) => {
        setProduct({ ...product, [field]: value });
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                mediaTypes: ImagePicker.MediaType
            });

            if (!result.canceled) {
                setState("image", result.assets[0]);
            }
        } catch (error) {
            console.error("Lỗi chọn ảnh:", error);
        }
    };

    const validate = () => {
        const required = ["name", "description", "price", "format", "type", "warranty_days", "image"];
        for (let field of required) {
            if (!product[field]) {
                setMsg(`Vui lòng nhập ${field}`);
                return false;
            }
        }
        setMsg("");
        return true;
    };

    const submit = async () => {
        if (!validate()) return;

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const form = new FormData();

            form.append("store", storeId);
            form.append("name", product.name);
            form.append("description", product.description);
            form.append("price", product.price);
            form.append("format", product.format);
            form.append("type", product.type);
            form.append("warranty_days", product.warranty_days);

            const uri = product.image.uri;
            const fileName = uri.split("/").pop();
            const fileType = product.image.type ?? "image/jpeg";

            form.append("image", {
                uri,
                name: fileName,
                type: "image/jpeg",
            });

            const res = await authApis(token).post(endpoints["create-product"], form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 201) {
                Alert.alert("Thành công", "Đã thêm sản phẩm.");
                nav.navigate("storeSeller", { reload: true });
            }
        } catch (err) {
            console.error("Lỗi thêm sản phẩm:", err);
            Alert.alert("Lỗi", "Không thể thêm sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            <HelperText type="error" visible={msg}>{msg}</HelperText>

            <TextInput label="Tên sản phẩm" mode="outlined" value={product.name} onChangeText={t => setState("name", t)} style={styles.TextInput} />
            <TextInput label="Mô tả" mode="outlined" multiline numberOfLines={4} value={product.description} onChangeText={t => setState("description", t)} style={styles.TextInput} />
            <TextInput label="Giá (VNĐ)" mode="outlined" keyboardType="numeric" value={product.price} onChangeText={t => setState("price", t)} style={styles.TextInput} />
            <TextInput label="Định dạng (VD: TK|MK|OTP)" mode="outlined" value={product.format} onChangeText={t => setState("format", t)} style={styles.TextInput} />
            <View style={styles.viewInputType}>
                <Picker selectedValue={product.type} onValueChange={(itemValue) => setState("type", itemValue)}>
                    <Picker.Item label="-- Chọn loại sản phẩm --" value="" />
                    <Picker.Item label="Tài khoản" value="account" />
                    <Picker.Item label="Dịch vụ" value="service" />
                    <Picker.Item label="Phần mềm" value="software" />
                    <Picker.Item label="Khoá học" value="course" />
                </Picker>
            </View>
            <TextInput label="Số ngày bảo hành" mode="outlined" keyboardType="numeric" value={product.warranty_days} onChangeText={t => setState("warranty_days", t)} style={styles.TextInput} />

            <TouchableOpacity onPress={pickImage}>
                <Text style={styles.ImagePicker}>Chọn ảnh sản phẩm</Text>
            </TouchableOpacity>
            {product.image && <Image source={{ uri: product.image.uri }} style={styles.image} />}

            <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={styles.Button}>Thêm sản phẩm</Button>
        </ScrollView>
    );
};

export default AddProduct;
