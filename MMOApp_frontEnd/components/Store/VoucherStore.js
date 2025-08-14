import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import {View, Text, Alert, RefreshControl, FlatList} from "react-native";
import {TextInput, Button, Card, Dialog, Portal} from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyUserContext } from "../../configs/Contexts";
import { endpoints, authApis } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./StoreStyle";

const emptyForm = {
  code: "",
  discount_percent: "",
  max_discount: "30000.00",
  expired_at: "",
  quantity: ""
};

const Voucher = () => {
  const user = useContext(MyUserContext);

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search
  const [searchText, setSearchText] = useState("");
  const debounceRef = useRef(null);

  // Form dialog
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  // Refresh
  const [refreshing, setRefreshing] = useState(false);

  const loadVouchers = useCallback(async (query = "") => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).get(endpoints["my-vouchers"], {
        params: query ? { search: query } : {}
      });
      setVouchers(res.data);
    } catch (err) {
      console.error("Lỗi load voucher:", err?.response?.data || err.message);
      Alert.alert("Lỗi", "Không thể tải voucher.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  // debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadVouchers(searchText);
    }, 500);
    return () => clearTimeout(debounceRef.current);
  }, [searchText, loadVouchers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVouchers(searchText);
    setRefreshing(false);
  };

  // CRUD
  const saveVoucher = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (editing) {
        await authApis(token).put(endpoints.updateVoucher(editing.voucher_code), form);
        Alert.alert("Thành công", "Đã cập nhật voucher.");
      } else {
        await authApis(token).post(endpoints["add-voucher"], form);
        Alert.alert("Thành công", "Đã tạo voucher.");
      }
      setDialogVisible(false);
      setForm(emptyForm);
      setEditing(null);
      loadVouchers(searchText);
    } catch (err) {
      console.error(err?.response?.data || err.message);
      Alert.alert("Lỗi", "Không thể lưu voucher.");
    }
  };

  const deleteVoucher = async (id) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc muốn xoá voucher này?",
      [
        { text: "Hủy" },
        {
          text: "Xoá",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await authApis(token).delete(endpoints.deleteVoucher(id));
              Alert.alert("Thành công", "Đã xoá voucher.");
              loadVouchers(searchText);
            } catch (err) {
              console.error(err?.response?.data || err.message);
              Alert.alert("Lỗi", "Không thể xoá voucher.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={MyStyles.container}>
      <TextInput
        placeholder="Tìm voucher..."
        value={searchText}
        onChangeText={setSearchText}
        mode="outlined"
        style={styles.marginBottom}
      />

      <Button
        mode="contained"
        onPress={() => {
          setForm(emptyForm);
          setEditing(null);
          setDialogVisible(true);
        }}
        style={styles.marginBottom}
      >
        + Tạo voucher
      </Button>

      <FlatList
        data={vouchers}
        keyExtractor={(item) => item.voucher_code}
        renderItem={({ item }) => (
          <Card style={styles.marginBottom}>
            <Card.Title
              title={item.code}
              subtitle={`Giảm: ${item.discount_percent}% - SL: ${item.quantity}`}
            />
            <Card.Content>
              <Text>HSD: {new Date(item.expired_at).toLocaleDateString()}</Text>
              <Text>Max giảm: {item.max_discount}</Text>
            </Card.Content>
            <Card.Actions>
              <Button
                onPress={() => {
                  setForm({
                    code: item.code,
                    discount_percent: String(item.discount_percent),
                    max_discount: String(item.max_discount),
                    expired_at: item.expired_at,
                    quantity: String(item.quantity)
                  });
                  setEditing(item);
                  setDialogVisible(true);
                }}
              >
                Sửa
              </Button>
              <Button style={styles.deleteButton} onPress={() => deleteVoucher(item.voucher_code)}>
                Xoá
              </Button>
            </Card.Actions>
          </Card>
        )}
        ListEmptyComponent={<Text>Không có voucher.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />

      {/* Dialog Form */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editing ? "Cập nhật Voucher" : "Tạo Voucher"}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Code"
              value={form.code}
              onChangeText={(t) => setForm({ ...form, code: t })}
              mode="outlined"
              style={styles.marginBottom}
            />
            <TextInput
              label="Discount %"
              value={form.discount_percent}
              onChangeText={(t) => setForm({ ...form, discount_percent: t })}
              keyboardType="numeric"
              mode="outlined"
              style={styles.marginBottom}
            />
            <TextInput
              label="Max discount"
              value={form.max_discount}
              onChangeText={(t) => setForm({ ...form, max_discount: t })}
              keyboardType="numeric"
              mode="outlined"
              style={styles.marginBottom}
            />
            <TextInput
              label="Expired at (yyyy-mm-dd)"
              value={form.expired_at}
              onChangeText={(t) => setForm({ ...form, expired_at: t })}
              mode="outlined"
              style={styles.marginBottom}
            />
            <TextInput
              label="Quantity"
              value={form.quantity}
              onChangeText={(t) => setForm({ ...form, quantity: t })}
              keyboardType="numeric"
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Hủy</Button>
            <Button onPress={saveVoucher}>Lưu</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

export default Voucher;
