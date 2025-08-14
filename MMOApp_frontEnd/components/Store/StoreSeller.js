import React, { useEffect, useState, useContext, useCallback, useRef } from "react";
import { View, Text, Alert, RefreshControl } from "react-native";
import { TextInput, Button, Card, IconButton, Dialog, Portal } from "react-native-paper";
import { FlatList } from "react-native";
import { MyUserContext } from "../../configs/Contexts";
import { endpoints, authApis } from "../../configs/Apis";
import AsyncStorage from "@react-native-async-storage/async-storage";
import MyStyles from "../../styles/MyStyles";
import styles from "./StoreStyle";
import { useNavigation } from "@react-navigation/native";
import { Avatar } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";

const typeOptions = [
  { label: "-- Tất cả loại --", value: "" },
  { label: "Tài khoản", value: "account" },
  { label: "Dịch vụ", value: "service" },
  { label: "Phần mềm", value: "software" },
  { label: "Khoá học", value: "course" }
];

const StoreSeller = () => {
  const user = useContext(MyUserContext);
  const nav = useNavigation();

  // Store
  const [store, setStore] = useState(null);
  const [loadingStore, setLoadingStore] = useState(true);

  // Products
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);

  // Filter
  const [searchText, setSearchText] = useState("");
  const [type, setType] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);
  const [approvedStatus, setApprovedStatus] = useState("");

  // Refresh
  const [refreshing, setRefreshing] = useState(false);
  const debounceTimeout = useRef(null);

  // Create store
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Load store
  const loadStore = useCallback(async () => {
    setLoadingStore(true);
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

  // Load products (with pagination)
  const loadProducts = useCallback(
    async (nextPage = 1, append = false) => {
      if (!store) return;

      try {
        const token = await AsyncStorage.getItem("token");
        const res = await authApis(token).get(endpoints["my-products"], {
          params: {
            search: searchText || undefined,
            type: type || undefined,
            price__gte: priceMin || undefined,
            price__lte: priceMax || undefined,
            is_approved: approvedStatus || undefined,
            page: nextPage
          }
        });

        const results = res.data.results || res.data;
        setProducts(prev =>
          append ? [...prev, ...results] : results
        );
        setHasNext(!!res.data.next);
        setPage(nextPage);
      } catch (err) {
        console.error("Lỗi load sản phẩm:", err?.response?.data || err);
      }
    },
    [store, searchText, type, priceMin, priceMax, approvedStatus]
  );

  // Create store
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

  // Effect load store lần đầu
  useEffect(() => {
    loadStore();
  }, [loadStore]);

  // Effect tìm kiếm debounce
  useEffect(() => {
    if (!store) return;
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      loadProducts(1);
    }, 500);
  }, [searchText, store]);

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadStore();
    setRefreshing(false);
  };

  // Navigation
  const navigateUpdateStore = () => nav.navigate("updateStore", { store });
  const navigateCreateProduct = () => nav.navigate("addProduct", { store });
  const navigateViewProduct = product => nav.navigate("productDetail", { product });
  const navigateVoucher = () => nav.navigate("vouchers", { store });

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
                  <Text style={styles.created_date}>Ngày tạo: {new Date(store.created_date).toLocaleDateString()} | Ngày cập nhật: {new Date(store.created_date).toLocaleDateString()}</Text>
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
                  <Text style={styles.productTitle}>Quản lí Voucher</Text>
                  <Button mode="contained" onPress={navigateVoucher} style={styles.voucherButton}>
                    Voucher cửa hàng
                  </Button>
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
                    <IconButton icon="tune" size={28} onPress={() => setFilterVisible(true)} />
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
                subtitle={`Giá: ${item.price || "-"} đ | Loại: ${item.type}`}
                left={props =>
                  item.image ? (
                    <Avatar.Image {...props} source={{ uri: item.image }} size={50} />
                  ) : (
                    <Avatar.Icon {...props} icon="image-off" size={50} />
                  )
                }
              />
              <Card.Content>
                <Text style={styles.label} numberOfLines={2}>
                  {item.description}
                </Text>
              </Card.Content>
              <Card.Actions>
                <Button onPress={() => navigateViewProduct(item)}>Xem chi tiết</Button>
              </Card.Actions>
            </Card>
          )}
          ListEmptyComponent={
            store ? <Text style={styles.centered}>Không có sản phẩm nào.</Text> : null
          }
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={MyStyles.container}
          onEndReachedThreshold={0.5}
          onEndReached={() => {
            if (hasNext) loadProducts(page + 1, true);
          }}
        />
      )}

      <Portal>
        <Dialog visible={filterVisible} onDismiss={() => setFilterVisible(false)}>
          <Dialog.Title>Bộ lọc nâng cao</Dialog.Title>
          <Dialog.Content>
            <View style={styles.viewInput}>
              <Picker selectedValue={type} onValueChange={value => setType(value)} mode="dropdown">
                {typeOptions.map(opt => (
                  <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
                ))}
              </Picker>
            </View>
            <View style={styles.viewInput}>
              <Picker
                selectedValue={approvedStatus}
                onValueChange={value => setApprovedStatus(value)}
                mode="dropdown"
              >
                <Picker.Item label="-- Tất cả trạng thái --" value="" />
                <Picker.Item label="Đã duyệt" value="true" />
                <Picker.Item label="Chưa duyệt" value="false" />
              </Picker>
            </View>
            <TextInput placeholder="Giá tối thiểu" value={priceMin} onChangeText={setPriceMin} keyboardType="numeric" mode="outlined" style={styles.viewInput} />
            <TextInput placeholder="Giá tối đa" value={priceMax} onChangeText={setPriceMax} keyboardType="numeric" mode="outlined" style={styles.viewInput} />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setFilterVisible(false)}>Hủy</Button>
            <Button
              onPress={() => {
                loadProducts(1);
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
