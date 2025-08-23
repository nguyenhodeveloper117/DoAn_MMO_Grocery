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
    cardDetailComplaint: {
        backgroundColor: "#c11111ff",
        borderRadius: 12,
        padding: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 12,
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
    complaintTitle: {
        fontWeight: "bold",
        fontSize: 18,
        color: "#f5eaeaff",
        textAlign: "center",
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
    processingButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: "orange",
        borderRadius: 8,
        alignItems: "center",
    },
    completedButton: {
        marginTop: 15,
        padding: 10,
        backgroundColor: "green",
        borderRadius: 8,
        alignItems: "center",
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
    detailButton: {
        backgroundColor: "#007bff",
        marginVertical: 8,
    },
    detailButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
    uploadBtn: {
        backgroundColor: "#007bff",
        padding: 10,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: 8,
    },
    previewRow:
    {
        flexDirection: "row",
        gap: 8,
        marginVertical: 8
    },
    previewImg: {
        width: 90,
        height: 90,
        borderRadius: 6
    },
    labelComplaint: {
        marginVertical: 10,
        fontWeight: "600"
    },
    submitBtn: {
        marginTop: 10,
        padding: 8,
        backgroundColor: "#e51313ff",
    },
    whiteText: {
        color: "#fff"
    },
    complaintImg: {
        width: "100%",
        height: 300,
        marginTop: 16,
        marginBottom: 16,
    },
    infoTotal: {
        fontStyle: "italic",
        fontSize: 12,
        marginBottom: 10
    },
});

export default styles;
