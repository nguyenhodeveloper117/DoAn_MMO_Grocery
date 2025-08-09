import { StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";

const styles = StyleSheet.create({
    marginBottom: {
        marginBottom: 10
    },
    marginRight: {
        marginRight: 5
    },
    viewButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15
    },
    blogs: {
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#ccc",
    },
    blogTitle: {
        fontWeight: "bold", fontSize: 16
    },
    blogContent: {
        color: "#555"
    },
    noBlog: {
        textAlign: "center",
        marginTop: 20,
        color: "#777"
    },
    blogCategory: {
        fontStyle: "italic",
        fontSize: 12,
        marginTop: 4
    },
    buttonAdd: {
        backgroundColor: "#4caf50",
    },
    buttonMyBlog: {
        backgroundColor: "#0b5bf1ff",
    }
});

export default styles;