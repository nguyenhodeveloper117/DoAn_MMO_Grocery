import { StyleSheet } from "react-native";
import { Button, TextInput } from "react-native-paper";

const styles = StyleSheet.create({
    marginBottom: {
        marginBottom: 10
    },
    marginTop: {
        marginTop: 20
    },
    marginRight: {
        marginRight: 5
    },
    viewButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 15
    },
    viewUpdateDeleteBlog: {
        flexDirection: 'row',
        marginTop: 15,
        justifyContent: 'flex-end'
    },
    blogs: {
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#ccc",
    },
    blogTitle: {
        fontWeight: "bold", fontSize: 16,
    },
    productBLogTitle: {
        fontWeight: "bold",
        fontSize: 16,
        marginBottom: 5,
        marginTop: 10,
    },
    blogContent: {
        color: "#555",
    },
    blogDetailTitle: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 5
    },
    richTextInput: {
        minHeight: 200,
        borderWidth: 1,
        borderColor: "#ccc",
        marginTop: 8
    },
    containerCategory: {
        marginBottom: 16,
        minHeight: 48
    },
    noBlog: {
        textAlign: "center",
        marginTop: 20,
        color: "#777"
    },
    blogCategory: {
        fontStyle: "italic",
        fontSize: 12,
        marginTop: 4,
        marginBottom: 20
    },
    buttonAdd: {
        backgroundColor: "#4caf50",
    },
    buttonAddComment: {
        backgroundColor: "#4caf50",
        marginTop: 10

    },
    buttonMyBlog: {
        backgroundColor: "#0b5bf1ff",
    },
    colorRed: {
        backgroundColor: "#d71c1cff"
    },
    page: {
        marginHorizontal: 3,
        minWidth: 40
    },
    pageSizeLong: {
        marginHorizontal: 5,
        alignSelf: "center"
    },
    viewPage: {
        flexDirection: "row",
        justifyContent: "center",
        marginVertical: 10
    }
});

export default styles;