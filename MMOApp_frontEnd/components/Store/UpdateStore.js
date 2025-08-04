import React, { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { TextInput, Button, Card, Text, Title } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation, useRoute } from "@react-navigation/native";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./StoreStyle";

const UpdateStore = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { store } = route.params;

    const [name, setName] = useState(store.name);
    const [description, setDescription] = useState(store.description || "");
    const [loading, setLoading] = useState(false);

    const updateStore = async () => {
        if (!name?.trim()) {
            Alert.alert("Lỗi", "Tên cửa hàng không được để trống.");
            return;
        }

        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).put(endpoints["update-store"](store.store_code), {
                name: name.trim(),
                description: description.trim()
            });

            Alert.alert("Thành công", "Cập nhật cửa hàng thành công!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể cập nhật thông tin cửa hàng.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={MyStyles.container}>
            <View style={styles.viewInput}>
                <Text variant="labelLarge">Tên cửa hàng</Text>
                <TextInput
                    value={name}
                    onChangeText={setName}
                    mode="outlined"
                    placeholder="Nhập tên cửa hàng"
                    style={styles.TextInput}
                />
            </View>

            <View style={styles.viewInput}>
                <Text variant="labelLarge">Mô tả</Text>
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    mode="outlined"
                    multiline
                    numberOfLines={5}
                    placeholder="Nhập mô tả về cửa hàng"
                    style={styles.TextInput}
                />
            </View>

            <Button
                mode="contained"
                onPress={updateStore}
                loading={loading}
                disabled={loading}
                style={styles.Button}
            >
                Cập nhật cửa hàng
            </Button>
        </ScrollView>
    );
};

export default UpdateStore;
