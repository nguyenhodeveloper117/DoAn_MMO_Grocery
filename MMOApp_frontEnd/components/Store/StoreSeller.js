import React, { useEffect, useState, useContext, useCallback } from "react";
import { View, Text, Alert, RefreshControl } from "react-native";
import { TextInput, Button, Card } from "react-native-paper";
import { FlatList } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { endpoints, authApis } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import styles from "./StoreStyle";
import { useNavigation } from "@react-navigation/native";
import { Avatar } from 'react-native-paper';

const StoreSeller = () => {
  const user = useContext(MyUserContext);
  const [store, setStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const nav = useNavigation();

  const loadStore = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["my-store"]);
      setStore(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        Alert.alert("Lỗi", "Không thể tải thông tin gian hàng.");
      }
      setStore(null);
    } finally {
      setLoadingStore(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    if (!store) return;
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["my-products"], {
        params: { search: searchText }
      });
      setProducts(res.data);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải sản phẩm.");
    }
  }, [store, searchText]);

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStore(), loadProducts()]);
    setRefreshing(false);
  };

  const createStore = async () => {
    if (!newName.trim()) {
      Alert.alert("Lỗi", "Tên cửa hàng không được để trống.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).post(endpoints["stores"], {
        name: newName.trim(),
        description: newDesc.trim()
      });
      setStore(res.data);
      Alert.alert("Thành công", "Gian hàng đã được tạo!");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tạo cửa hàng.");
    }
  };

  const navigateUpdateStore = () => {
    nav.navigate("updateStore", { store });
  };

  const navigateCreateProduct = () => {
    nav.navigate("addProduct", { store });
  };

  const navigateViewProduct = (product) => {
    nav.navigate("productDetail", { product });
  };



  const renderProduct = ({ item }) => (
    <Card style={styles.cardProduct}>
      <Card.Title
        title={item.name}
        subtitle={`Giá: ${item.price || "-"} đ`}
        left={(props) =>
          item.image ? (
            <Avatar.Image
              {...props}
              source={{ uri: item.image }}
              size={50} 
            />
          ) : (
            <Avatar.Icon {...props} icon="image-off" size={50} />
          )
        }
      />
      <Card.Content>
        <Text numberOfLines={2}>{item.description}</Text>
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => navigateViewProduct(item)}>Xem chi tiết</Button>
      </Card.Actions>
    </Card>
  );


  const ListHeader = () => (
    <View>
      {store ? (
        <View style={styles.storeBox}>
          <Text style={styles.title}>{store.name}</Text>
          <Text style={styles.desc}>{store.description}</Text>
          <Button mode="contained" onPress={navigateUpdateStore} style={styles.Button}>
            Chỉnh sửa gian hàng
          </Button>
        </View>
      ) : (
        <View style={styles.viewInput}>
          <Text style={styles.noStoreText}>Bạn chưa có gian hàng!</Text>
          <TextInput
            label="Tên cửa hàng"
            mode="outlined"
            value={newName}
            onChangeText={setNewName}
            style={styles.TextInput}
          />
          <TextInput
            label="Mô tả cửa hàng"
            mode="outlined"
            multiline
            numberOfLines={3}
            value={newDesc}
            onChangeText={setNewDesc}
            style={styles.TextInput}
          />
          <Button mode="contained" onPress={createStore} style={styles.Button}>
            Tạo gian hàng
          </Button>
        </View>
      )}

      {store && (
        <>
          <Text style={styles.productTitle}>
            Sản phẩm của bạn
          </Text>
          <TextInput
            placeholder="Tìm kiếm sản phẩm..."
            value={searchText}
            onChangeText={setSearchText}
            mode="outlined"
            style={styles.TextInput}
          />
          <Button mode="contained" onPress={navigateCreateProduct} style={styles.addButton}>
            Thêm sản phẩm mới
          </Button>
        </>
      )}
    </View>
  );

  if (loadingStore) {
    return <Text style={MyStyles.center}>Đang tải...</Text>;
  }

  return (
    <FlatList
      ListHeaderComponent={<ListHeader />}
      data={products}
      keyExtractor={(item, index) =>
        item.id?.toString() || item.pk?.toString() || index.toString()
      }
      renderItem={renderProduct}
      ListEmptyComponent={
        store ? (
          <Text style={styles.centered}>
            Không có sản phẩm nào.
          </Text>
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      contentContainerStyle={MyStyles.container}
    />

  );
};

export default StoreSeller;
