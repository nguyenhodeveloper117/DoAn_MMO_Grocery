import React, { useEffect, useState, useContext } from "react";
import { View, Text, Alert } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { MyUserContext } from "../../configs/Contexts";
import Apis, { endpoints, authApis } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import styles from "./StoreStyle";
import { useNavigation } from "@react-navigation/native";
import { RefreshControl, ScrollView } from "react-native";



const StoreSeller = () => {
  const user = useContext(MyUserContext);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [Name, setName] = useState("");
  const [Desc, setDesc] = useState("");


  const loadStore = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["my-store"]);
      setStore(res.data);
    } catch (err) {
      if (err.response?.status !== 404)
        Alert.alert("Lỗi", "Không thể tải thông tin gian hàng.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStore();  // gọi lại API
    setRefreshing(false);
  };


  useEffect(() => {
    loadStore();
  }, []);

  const createStore = async () => {
    if (!Name.trim()) {
      Alert.alert("Lỗi", "Tên cửa hàng không được để trống.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).post(endpoints["create-stores"], {
        name: Name.trim(),
        description: Desc.trim()
      });
      setStore(res.data);
      Alert.alert("Thành công", "Gian hàng đã được tạo!");
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Không thể tạo cửa hàng.");
    }
  };

  const navigateToUpdateStore = () => {
    nav.navigate("updateStore", { store });
  }

  if (loading) return <Text style={MyStyles.center}>Đang tải...</Text>;

  return (
    <ScrollView
      contentContainerStyle={MyStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {store === null ? (
        <View style={styles.viewInput}>
          <Text style={styles.noStoreText}>Bạn chưa có gian hàng!</Text>
          <TextInput
            label="Tên cửa hàng"
            mode="outlined"
            value={Name}
            onChangeText={setName}
            style={styles.TextInput}
          />

          <TextInput
            label="Mô tả cửa hàng"
            mode="outlined"
            value={Desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
            style={styles.TextInput}
          />

          <Button mode="contained" onPress={createStore} style={styles.Button}>Tạo cửa hàng</Button>
        </View>
      ) : (
        <View style={styles.storeBox}>
          <Text style={styles.title}>{store.name}</Text>
          <Text style={styles.desc}>{store.description}</Text>
          <Button mode="contained" onPress={navigateToUpdateStore} style={styles.Button}>Chỉnh sửa thông tin</Button>
        </View>
      )}
    </ScrollView>
  );
};

export default StoreSeller;
