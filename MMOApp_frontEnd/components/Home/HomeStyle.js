import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
    marginBottom: {
        marginBottom: 12,
    },
    marginRight: {
        marginRight: 8,
    },
    marginLeft: {
        marginLeft: 5,
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
    imageProductDetail: {
        width: "100%",
        height: 300,
        marginBottom: 12,
    },
    name: {
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 8,
    },
    price: {
        fontSize: 18,
        color: "red",
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        marginTop: 10,
        marginBottom: 4,
        fontWeight: "600",
    },
    desc: {
        fontSize: 14,
        color: "#444",
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 8,
        marginBottom: 12,
    },
    priceBox: {
        padding: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 8,
        backgroundColor: "#f9f9f9",
    },
    finalPrice: {
        fontWeight: "bold",
        color: "green",
        fontSize: 16,
    },
    orderBtn: {
        backgroundColor: "green",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        marginTop: 16,
    },
    orderText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
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
    },
    subInfoProduct: {
        fontStyle: "italic",
        fontSize: 12,
        marginTop: 5
    },
    infoTotal: {
        fontStyle: "italic",
        fontSize: 12,
        marginBottom: 10
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
    reviewStar: {
        color: "orange",
        marginTop: 2,
        marginBottom: 4,
        fontSize: 14,
    },
    noReview: {
        color: "gray",
        marginTop: 2,
        marginBottom: 4,
        fontSize: 14,
    },
    favoriteBtn: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 5,
    },
    storeBtn: {
        backgroundColor: "green",
        padding: 14,
        borderRadius: 8,
        alignItems: "center",
        color: "#fff",
    },
    created_date: {
        fontStyle: "italic",
        fontSize: 12,
    },
});

export default styles;
