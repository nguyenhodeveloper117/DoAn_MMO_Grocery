import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { View, Text, Alert, RefreshControl } from "react-native";
import { TextInput, Button, Card, IconButton, Dialog, Portal, Menu } from "react-native-paper";
import { FlatList } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { endpoints, authApis } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import styles from "./StoreStyle";
import { useNavigation } from "@react-navigation/native";
import { Avatar } from 'react-native-paper';
import { Picker } from '@react-native-picker/picker';

const StoreSeller = () => {
  const user = useContext(MyUserContext);
  const [store, setStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);
  const [products, setProducts] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [type, setType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const debounceTimeout = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const typeOptions = ["account", "service", "software", "course"];
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

    // Validate filter trước khi gửi request
    if (priceMin && isNaN(priceMin)) return;
    if (priceMax && isNaN(priceMax)) return;
    if (type && !["account", "service", "software", "course"].includes(type)) return;

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["my-products"], {
        params: {
          search: searchText,
          type: type || undefined,
          price__gte: priceMin || undefined,
          price__lte: priceMax || undefined,
        },
      });
      setProducts(res.data.results || res.data);
    } catch (err) {
      console.error("Lỗi filter:", err?.response?.data || err);
      // Không cần alert mỗi lần fail do input chưa xong
    }
  }, [store, searchText, type, priceMin, priceMax]);


  const createStore = async () => {
    if (!newName.trim()) {
      Alert.alert("Lỗi", "Tên cửa hàng không được để trống.");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).post(endpoints["create-store"], {
        name: newName.trim(),
        description: newDesc.trim()
      });
      setStore(res.data);
      Alert.alert("Thành công", "Gian hàng đã được tạo!");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tạo cửa hàng.");
    }
  };

  useEffect(() => {
    loadStore();
  }, [loadStore]);

  useEffect(() => {
    if (!store) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      loadProducts();
    }, 500); // 500ms chờ sau khi người dùng ngừng gõ
  }, [searchText, store]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStore(), loadProducts()]);
    setRefreshing(false);
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

  return (
    <>
      {loadingStore ? (
        <Text style={styles.centered}>Đang tải...</Text>
      ) : (
        <FlatList
          ListHeaderComponent={
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
                  <Text style={styles.noStoreText}>Bạn chưa có gian hàng? Tạo ngay</Text>
                  <TextInput label="Tên cửa hàng" mode="outlined" value={newName} onChangeText={setNewName} style={styles.TextInput} />
                  <TextInput label="Mô tả cửa hàng" mode="outlined" multiline numberOfLines={3} value={newDesc} onChangeText={setNewDesc} style={styles.TextInput} />
                  <Button mode="contained" onPress={createStore} style={styles.Button}>
                    Tạo gian hàng
                  </Button>
                </View>
              )}

              {store && (
                <>
                  <Text style={styles.productTitle}>Sản phẩm của bạn</Text>
                  <Button mode="contained" onPress={navigateCreateProduct} style={styles.addButton}>
                    Thêm sản phẩm mới
                  </Button>
                  <View style={styles.viewFilter}>
                    <TextInput
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchText}
                      onChangeText={setSearchText}
                      mode="outlined"
                      style={styles.searchInput}
                    />
                    <IconButton icon="tune" size={28} onPress={() => setFilterVisible(true)}/>
                  </View>
                </>
              )}
            </View>
          }
          data={products}
          keyExtractor={(item, index) =>
            item.id?.toString() || item.pk?.toString() || index.toString()
          }
          renderItem={({ item }) => (
            <Card style={styles.cardProduct}>
              <Card.Title
                title={item.name}
                subtitle={`Giá: ${item.price || "-"} đ`}
                left={(props) =>
                  item.image ? (
                    <Avatar.Image {...props} source={{ uri: item.image }} size={50} />
                  ) : (
                    <Avatar.Icon {...props} icon="image-off" size={50} />
                  )
                }
              />
              <Card.Content>
                <Text style={styles.label}>Mã sản phẩm: {item.type || "Không có"}</Text>
                <Text style={styles.label} numberOfLines={2}>Mô tả: {item.description}</Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => navigateViewProduct(item)}>Xem chi tiết</Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={
            store ? (
              <Text style={styles.centered}>Không có sản phẩm nào.</Text>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={MyStyles.container}
        />
      )}

      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
          <Dialog.Title>Bộ lọc nâng cao</Dialog.Title>
          <Dialog.Content>
            <View style={styles.viewInput}>
              <View style={styles.viewInputType}>
                <Picker
                  selectedValue={type}
                  onValueChange={(itemValue) => setType(itemValue)}
                  mode="dropdown"
                >
                  <Picker.Item label="-- Tất cả loại --" value="" />
                  <Picker.Item label="Tài khoản" value="account" />
                  <Picker.Item label="Dịch vụ" value="service" />
                  <Picker.Item label="Phần mềm" value="software" />
                  <Picker.Item label="Khoá học" value="course" />
                </Picker>
              </View>
            </View>
            <TextInput placeholder="Giá tối thiểu" value={priceMin} onChangeText={setPriceMin} keyboardType="numeric" mode="outlined" style={styles.viewInput} />
            <TextInput placeholder="Giá tối đa" value={priceMax} onChangeText={setPriceMax} keyboardType="numeric" mode="outlined" style={styles.viewInput} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFilterVisible(false)}>Hủy</Button>
            <Button
              onPress={() => {
                loadProducts();
                setFilterVisible(false);
              }}
            >
              Áp dụng
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

export default StoreSeller;
