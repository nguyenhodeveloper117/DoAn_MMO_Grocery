import React, { useState, useEffect, useContext} from "react";
import { View, Text, TextInput, FlatList, Alert } from "react-native";
import { Button } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import styles from "./UserStyle";

const WithdrawRequest = () => {
    const [amount, setAmount] = useState("");
    const [withdraws, setWithdraws] = useState([]);
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);

    // Lấy danh sách yêu cầu rút tiền của user
    const getMyWithdraws = async () => {
        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).get(endpoints["my-withdraws"]);
            if (res.status === 200) {
                setWithdraws(res.data);
            } else {
                Alert.alert("Lỗi", "Không thể lấy danh sách rút tiền.");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không thể lấy danh sách rút tiền.");
        }
    };

    // Tạo yêu cầu rút tiền
    const createWithdraw = async () => {
        if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
            Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ!");
            return;
        }

        try {
            const token = await AsyncStorage.getItem("token");
            const res = await authApis(token).post(endpoints["add-withdraw"], {
                amount: parseInt(amount),
            });

            if (res.status === 201) {
                Alert.alert("Thành công", "Yêu cầu rút tiền đã được tạo!");
                setAmount(""); // reset input
                getMyWithdraws(); // cập nhật danh sách
            } else {
                Alert.alert("Lỗi", "Không tạo được yêu cầu rút tiền.");
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không tạo được yêu cầu rút tiền.");
        }
    };

    useEffect(() => {
        getMyWithdraws();
    }, []);

    return (
        <View style={MyStyles.container}>
            <Text style={styles.title2}>Số dư hiện tại: {user?.balance || 0} VND</Text>
            <Text style={styles.label2}>Nhập số tiền muốn rút:</Text>
            <TextInput
                style={styles.inputMoney}
                placeholder="Ví dụ: 100000"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
            />
            <Button mode="contained" onPress={createWithdraw} style={styles.marginBottom20}>
                Tạo yêu cầu rút tiền
            </Button>

            <Text style={styles.label2}>Danh sách yêu cầu rút tiền:</Text>
            <FlatList
                data={withdraws}
                keyExtractor={(item) => item.withdraw_code}
                renderItem={({ item }) => (
                    <View style={styles.itemDeposit}>
                        <Text>Mã: {item.withdraw_code}</Text>
                        <Text>Số tiền: {item.amount}</Text>
                        <Text>Trạng thái: {item.status}</Text>
                        <Text>Ngày tạo: {item.created_date}</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default WithdrawRequest;
