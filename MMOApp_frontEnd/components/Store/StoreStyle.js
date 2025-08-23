import { StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";

const styles = StyleSheet.create({
    marginRight: {
        marginRight: 8,
    },
    ImagePicker: {
        marginBottom: 16,
        fontWeight: "bold",
        marginVertical: 12,
    },
    image: {
        width: "100%",
        height: 200,
        resizeMode: "contain",
        marginBottom: 12
    },
    centered: {
        alignItems: "center",
        marginTop: 10
    },
    noStoreText: {
        fontSize: 16,
        marginBottom: 16
    },
    storeBox: {
        backgroundColor: "#f9f9f9",
        borderRadius: 10,
        padding: 20,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 4
    },
    viewInputType: {
        borderWidth: 1,
        borderColor: "#000000ff",
        borderRadius: 4,
        marginTop: 8,
    },
    viewFilter: {
        flexDirection: "row",
        marginBottom: 16,
        alignItems: "center",
    },
    title: {
        fontSize: 22,
        fontWeight: "bold"
    },
    productTitle: {
        marginTop: 30,
        marginVertical: 12,
        fontSize: 18,
        fontWeight: "bold"
    },
    code: {
        marginTop: 6,
        color: "#555"
    },
    desc: {
        marginTop: 12,
        fontSize: 16
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginTop: 6,
        backgroundColor: "#fff"
    },
    info: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10
    },
    Button: {
        marginTop: 16,
        borderRadius: 20,
        backgroundColor: '#4caf50',
    },
    addButton: {
        marginVertical: 16,
        borderRadius: 20,
    },
    voucherButton: {
        marginVertical: 16,
        borderRadius: 20,
        backgroundColor: '#f8572aff',
    },
    orderButton: {
        marginVertical: 16,
        borderRadius: 20,
        backgroundColor: '#5b31f4ff',
    },
    buttonUpdateProduct: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginTop: 20
    },
    viewInput: {
        marginBottom: 20,
    },
    TextInput: {
        backgroundColor: "white",
        marginTop: 4,
    },
    searchInput: {
        flex: 1,
    },
    cardProduct: {
        marginVertical: 6,
        borderRadius: 10,
    },
    label: {
        color: "#555",
        fontWeight: "normal",
        fontSize: 20,
    },
    approve: {
        color: "#190303ff",
        fontWeight: "600",
        fontSize: 20,
        marginTop: 6
    },
    menuItem: {
        paddingHorizontal: 30,
    },
    marginBottom: {
        marginBottom: 10
    },
    created_date: {
        fontStyle: "italic",
        fontSize: 12,
        marginTop: 10
    },
    deleteButton: {
        backgroundColor: '#e50f0fff',
    },
    center: {
        textAlign: "center",
        marginTop: 30,
        fontSize: 14,
        color: "#777",
    },
    flex1: {
        flex: 1,
    },
    status: {
        fontStyle: "italic",
        fontSize: 12,
        marginBottom: 6,
    },
    date: {
        fontSize: 10,
        color: "#444",
    },
    card: {
        padding: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#ccc",
        backgroundColor: "#fff",
        flexDirection: "row",
        alignItems: "flex-start",
    },
    statsCard: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2
    },
    statsTitle: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 6
    },
    width50: {
        width: "50%",
        padding: 4
    },
    diagram: {
        marginTop: 20,
        marginBottom: 20,
        borderRadius: 8,
    },
    reviewBox: {
        padding: 10,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        backgroundColor: "#f9f9f9",
    },
    reviewUser: {
        fontWeight: "bold",
    },
    loadMoreBtn: {
        padding: 10,
        alignItems: "center",
        backgroundColor: "#eee",
        borderRadius: 8,
        marginTop: 10,
    },
    loadMoreText: {
        color: "blue",
        fontWeight: "bold",
    },
    reviewTitle: {
        fontWeight: "bold",
        fontSize: 25,
        marginBottom: 6,
        marginTop: 20,
    }
});

export default styles;