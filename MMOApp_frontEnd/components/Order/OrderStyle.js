import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    row: {
        flexDirection: "row"
    },
    marginBottom: {
        marginBottom: 12,
    },
    marginRight: {
        marginRight: 8,
    },
    marginTop: {
        marginTop: 20
    },
    cardDetail: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
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
    code: {
        fontWeight: "bold",
        fontSize: 15,
        marginBottom: 4,
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
    noOrder: {
        textAlign: "center",
        marginTop: 24,
        fontSize: 14,
        opacity: 0.6,
    },
    flex1: {
        flex: 1,
    },
    title: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 12,
        color: "#333",
    },
    label: {
        fontSize: 14,
        color: "#555",
        marginBottom: 4,
    },
    value: {
        fontSize: 15,
        fontWeight: "500",
        color: "#111",
        marginBottom: 8,
    },
    total: {
        fontWeight: "bold",
        fontSize: 16,
        color: "#e63946",
        marginTop: 8,
    },
    center: {
        textAlign: "center",
        marginTop: 30,
        fontSize: 14,
        color: "#777",
    },
    cancelButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: "red",
        borderRadius: 8,
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    input: {
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 10,
        marginVertical: 8,
        minHeight: 60,
        textAlignVertical: "top",
    },
});

export default styles;
