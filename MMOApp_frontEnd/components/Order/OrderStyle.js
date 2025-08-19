import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    marginBottom: {
        marginBottom: 12,
    },
    marginRight: {
        marginRight: 8,
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
});

export default styles;
