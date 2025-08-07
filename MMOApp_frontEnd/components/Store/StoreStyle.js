import { StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";

const styles = StyleSheet.create({
    ImagePicker: {
        marginBottom: 16,
        fontWeight: "bold",
        marginVertical: 12,
    },
    image: {
        width: "100%",
        height: 200,
        resizeMode: "contain",
        marginVertical: 15,
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
        fontWeight: "normal",
        fontSize: 16,
    },
    menuItem: {
        paddingHorizontal: 30,
    },

});

export default styles;