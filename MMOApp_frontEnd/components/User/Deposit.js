import React, { useEffect, useState } from "react";
import { View, Text, TextInput, Image, StyleSheet, Alert, FlatList } from "react-native";
import { Button } from "react-native-paper";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import styles from "./UserStyle";



const Deposit = () => {
    const [amount, setAmount] = useState("");
    const [qr, setQr] = useState(null);
    const [transactionCode, setTransactionCode] = useState("");
    const [deposits, setDeposits] = useState([]);

    const createQR = async () => {
        if (!amount || isNaN(amount) || parseInt(amount) <= 0) {
            Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ!");
            return;
        }

        try {
            // 1. Tạo QR VietQR trước
            let res = await Apis.get(`${endpoints["vietqr"]}?amount=${amount}`);
            if (res.status === 200) {
                const trxCode = res.data.transaction_code;
                setQr(res.data.qr_link);
                setTransactionCode(trxCode);
                console.log("QR LINK:", res.data.qr_link);
                console.log("Transaction Code:", trxCode);

                // 2. Gửi yêu cầu nạp tiền lên server với transaction_code vừa tạo
                const token = await AsyncStorage.getItem("token");
                const depositRes = await authApis(token).post(endpoints["add-deposit"], {
                    amount: parseInt(amount),
                    transaction_code: trxCode,
                });

                if (depositRes.status === 201) {
                    Alert.alert("Thành công", "Yêu cầu nạp tiền đã được tạo!");
                    getMyDeposits(); // cập nhật danh sách
                } else {
                    Alert.alert("Lỗi", "Không tạo được yêu cầu nạp tiền.");
                }
            }
        } catch (err) {
            console.error(err);
            Alert.alert("Lỗi", "Không tạo được QR hoặc yêu cầu nạp tiền.");
        }
    };

    const getMyDeposits = async () => {
        const token = await AsyncStorage.getItem("token");
        const res = await authApis(token).get(endpoints["my-deposits"]);
        if (res.status === 200) {
            setDeposits(res.data);
            // console.log("My Deposits:", res.data);
        } else {
            Alert.alert("Lỗi", "Không thể lấy danh sách nạp tiền.");
        }
    };

    useEffect(() => {
        getMyDeposits(); // gọi khi component render lần đầu
    }, []);

    return (
        <View style={MyStyles.container}>
            <Text style={styles.label2}>Nhập số tiền muốn nạp:</Text>
            <TextInput
                style={styles.inputMoney}
                keyboardType="numeric"
                placeholder="Ví dụ: 200000"
                value={amount}
                onChangeText={setAmount}
            />
            <Button mode="contained" onPress={createQR} style={styles.marginBottom20}>
                Tạo QR VietQR
            </Button>

            {qr && (
                <View style={styles.qrBox}>
                    <Text>Quét mã để thanh toán:</Text>
                    <Image source={{ uri: qr }} style={styles.qrImage} resizeMode="contain" />
                    <Text style={{ marginTop: 10 }}>Nội dung chuyển khoản: {transactionCode}</Text>
                </View>
            )}

            <Text style={styles.listDeposit}>Danh sách yêu cầu nạp tiền:</Text>
            <FlatList
                data={deposits}
                keyExtractor={(item) => item.deposit_code}
                renderItem={({ item }) => (
                    <View style={styles.itemDeposit}>
                        <Text>Mã: {item.deposit_code}</Text>
                        <Text>Số tiền: {item.amount}</Text>
                        <Text>Trạng thái: {item.status}</Text>
                        <Text>Mã giao dịch: {item.transaction_code}</Text>
                        <Text>Ngày tạo: {new Date(item.created_date).toLocaleDateString()}</Text>
                    </View>
                )}
            />
        </View>
    );
};

export default Deposit;