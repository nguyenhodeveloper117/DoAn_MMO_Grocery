import { StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";

const styles = StyleSheet.create({
    centered: {
        alignItems: "center",
        marginTop: 40
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
    title: {
        fontSize: 22,
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
    Button: {
        marginTop: 16,
        borderRadius: 20,
        backgroundColor: '#4caf50',
    },
    viewInput: {
        marginBottom: 20,
    },
    TextInput: {
        backgroundColor: "white",
        marginTop: 4,
    }
});

export default styles;