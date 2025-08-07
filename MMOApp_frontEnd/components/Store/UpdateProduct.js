import { View, Text, ScrollView, Image, TouchableOpacity, Alert } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./StoreStyle";
import MyStyles from "../../styles/MyStyles";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";

const UpdateProduct = () => {
    const route = useRoute();
    const nav = useNavigation();
    const { product } = route.params;

    const [updatedProduct, setUpdatedProduct] = useState({
        name: product.name,
        description: product.description,
        price: product.price.toString(),
        format: product.format,
        type: product.type,
        warranty_days: product.warranty_days.toString(),
        image: { uri: product.image },
    });

    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(false);

    const setState = (field, value) => {
        setUpdatedProduct({ ...updatedProduct, [field]: value });
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
                mediaTypes: ImagePicker.MediaType,
            });

            if (!result.canceled) {
                setState("image", result.assets[0]);
            }
        } catch (error) {
            console.error("Lỗi chọn ảnh:", error);
        }
    };

    const validate = () => {
        const required = ["name", "description", "price", "format", "type", "warranty_days"];
        for (let field of required) {
            if (!updatedProduct[field]) {
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

            form.append("name", updatedProduct.name);
            form.append("description", updatedProduct.description);
            form.append("price", updatedProduct.price);
            form.append("format", updatedProduct.format);
            form.append("type", updatedProduct.type);
            form.append("warranty_days", updatedProduct.warranty_days);

            if (updatedProduct.image && updatedProduct.image.uri !== product.image) {
                const uri = updatedProduct.image.uri;
                const fileName = uri.split("/").pop();
                const fileType = updatedProduct.image.type ?? "image/jpeg";

                form.append("image", {
                    uri,
                    name: fileName,
                    type: "image/jpeg",
                });
            }

            const res = await authApis(token).patch(endpoints["update-product"](product.product_code), form, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (res.status === 200) {
                Alert.alert("Thành công", "Sản phẩm đã được cập nhật.");
                nav.navigate("storeSeller", { reload: true });
            }
        } catch (err) {
            console.error("Lỗi cập nhật sản phẩm:", err);
            Alert.alert("Lỗi", "Không thể cập nhật sản phẩm.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            <HelperText type="error" visible={msg}>{msg}</HelperText>

            <TextInput label="Tên sản phẩm" mode="outlined" value={updatedProduct.name} onChangeText={t => setState("name", t)} style={styles.TextInput} />
            <TextInput label="Mô tả" mode="outlined" multiline numberOfLines={4} value={updatedProduct.description} onChangeText={t => setState("description", t)} style={styles.TextInput} />
            <TextInput label="Giá (VNĐ)" mode="outlined" keyboardType="numeric" value={updatedProduct.price} onChangeText={t => setState("price", t)} style={styles.TextInput} />
            <TextInput label="Định dạng (VD: TK|MK|OTP)" mode="outlined" value={updatedProduct.format} onChangeText={t => setState("format", t)} style={styles.TextInput} />

            <View style={styles.viewInputType}>
                <Picker selectedValue={updatedProduct.type} onValueChange={(val) => setState("type", val)}>
                    <Picker.Item label="-- Chọn loại sản phẩm --" value="" />
                    <Picker.Item label="Tài khoản" value="account" />
                    <Picker.Item label="Dịch vụ" value="service" />
                    <Picker.Item label="Phần mềm" value="software" />
                    <Picker.Item label="Khoá học" value="course" />
                </Picker>
            </View>

            <TextInput label="Số ngày bảo hành" mode="outlined" keyboardType="numeric" value={updatedProduct.warranty_days} onChangeText={t => setState("warranty_days", t)} style={styles.TextInput} />

            <TouchableOpacity onPress={pickImage}>
                <Text style={styles.ImagePicker}>Chọn ảnh mới</Text>
            </TouchableOpacity>
            {updatedProduct.image?.uri && (
                <Image source={{ uri: updatedProduct.image.uri }} style={styles.image} />
            )}

            <Button mode="contained" onPress={submit} loading={loading} disabled={loading} style={styles.Button}>
                Cập nhật sản phẩm
            </Button>
        </ScrollView>
    );
};

export default UpdateProduct;
