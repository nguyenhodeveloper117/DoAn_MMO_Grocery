import React from 'react';
import { ScrollView, View, Text, StyleSheet, Button, Alert } from 'react-native';
import MyStyles from "../../styles/MyStyles";
import styles from "./UserStyle";

const Terms = ({ navigation }) => {
  const handleAgree = () => {
    Alert.alert("Thông báo", "Bạn đã đồng ý với điều khoản và chính sách.");
    navigation.goBack(); // Hoặc điều hướng sang bước tiếp theo
  };

  return (
    <ScrollView contentContainerStyle={{ ...MyStyles.container }}>
      <Text style={styles.title}>1. Quy định chung</Text>
      <Text style={styles.text}>
        - Tất cả người dùng khi đăng ký và sử dụng hệ thống đều phải tuân thủ các điều khoản dưới đây.
        {"\n"}- Người dùng phải cung cấp thông tin chính xác và chịu trách nhiệm về tính xác thực.
        {"\n"}- Mọi hành vi vi phạm có thể dẫn đến việc khóa tài khoản hoặc truy cứu trách nhiệm.
      </Text>

      <Text style={styles.title}>2. Đối với Người Mua</Text>
      <Text style={styles.subTitle}>✅ Quyền lợi:</Text>
      <Text style={styles.text}>- Xem, mua sản phẩm, hoàn tiền khi bị lừa đảo, khiếu nại người bán.</Text>
      <Text style={styles.subTitle}>🔒 Nghĩa vụ:</Text>
      <Text style={styles.text}>- Không mua hàng vi phạm pháp luật, phải thanh toán trung thực, không gian lận.</Text>

      <Text style={styles.title}>3. Đối với Người Bán</Text>
      <Text style={styles.subTitle}>✅ Quyền lợi:</Text>
      <Text style={styles.text}>- Tạo, bán sản phẩm, nhận thanh toán, bảo vệ quyền lợi.</Text>
      <Text style={styles.subTitle}>🔒 Nghĩa vụ:</Text>
      <Text style={styles.text}>- Xác minh KYC, không lừa đảo, mô tả đúng sản phẩm.</Text>

      <Text style={styles.title}>4. Về KYC</Text>
      <Text style={styles.text}>- Bắt buộc khi muốn trở thành người bán. Bao gồm CCCD 2 mặt và ảnh chân dung. Thông tin sẽ được bảo mật.</Text>

      <Text style={styles.title}>5. Chính sách xử lý vi phạm</Text>
      <Text style={styles.text}>- Khóa tài khoản nếu lừa đảo, dùng thông tin giả, vi phạm pháp luật.</Text>

      <Text style={styles.title}>6. Bảo mật và quyền riêng tư</Text>
      <Text style={styles.text}>- Chúng tôi cam kết bảo vệ thông tin cá nhân người dùng theo luật định.</Text>

      <Button title="Tôi đồng ý" onPress={handleAgree} />
    </ScrollView>
  );
};

export default Terms;