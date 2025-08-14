import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
    marginBottom: {
        marginBottom: 12,
    },
    marginRight: {
        marginRight: 8,
    },
    product: {
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#ccc",
    },
    productTitle: {
        fontWeight: "bold", 
        marginBottom: 4
    },
    productCategory: {
        fontStyle: "italic",
        fontSize: 12,
        marginBottom: 10
    },
    noProduct: {
        textAlign: "center",
        marginTop: 24,
        fontSize: 14,
        opacity: 0.6,
    },
    image: {
        width: 60,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: "#f0f0f0"
    },
    viewRenderItem: {
        flexDirection: "row", 
        alignItems: "flex-start" 
    },
    flex1: {
        flex: 1
    },
    productDes: {
        color: "#555"
    }

});

export default styles;
