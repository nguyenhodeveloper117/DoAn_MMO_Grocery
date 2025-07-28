import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#e8f5e9", // Màu xanh lá cây nhạt làm nền
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4caf50', // Màu xanh lá cây
  },
  button: {
    backgroundColor: "#4caf50", // Màu xanh lá cây cho nút
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff", // Màu trắng cho chữ trên nút
    textAlign: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 20,
  },
});

export default styles;