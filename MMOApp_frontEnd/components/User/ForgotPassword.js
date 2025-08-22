import { View, Text, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import MyStyles from "../../styles/MyStyles";

const ForgotPassword = () => {
    const supportEmail = "support@mmooapp.com";
    const supportPhone = "0123456789";

    return (
        <View style={MyStyles.container}>
            <Text style={styles.title}>Liên hệ hỗ trợ</Text>
            <Text style={styles.subtitle}>
                Nếu bạn quên mật khẩu hoặc cần hỗ trợ, vui lòng liên hệ:
            </Text>

            {/* Email */}
            <TouchableOpacity
                style={styles.item}
                onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
            >
                <MaterialIcons name="email" size={24} color="#007bff" />
                <Text style={styles.text}>{supportEmail}</Text>
            </TouchableOpacity>

            {/* Phone */}
            <TouchableOpacity
                style={styles.item}
                onPress={() => Linking.openURL(`tel:${supportPhone}`)}
            >
                <MaterialIcons name="phone" size={24} color="#28a745" />
                <Text style={styles.text}>{supportPhone}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 22,
        textAlign: "center",
        fontWeight: "bold",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 30,
        color: "#555",
    },
    item: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 10,
    },
    text: {
        fontSize: 18,
        marginLeft: 10,
        color: "#000",
    },
});

export default ForgotPassword;
