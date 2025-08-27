import { StyleSheet, Platform } from "react-native";

const styles = StyleSheet.create({
    bubble: {
        padding: 10,
        borderRadius: 12,
        marginVertical: 6,
        maxWidth: "75%"
    },
    myBubble: {
        backgroundColor: "#007AFF",
        alignSelf: "flex-end"
    },
    otherBubble: {
        backgroundColor: "#e5e5ea",
        alignSelf: "flex-start"
    },
    myText: {
        color: "#fff"
    },
    otherText: {
        color: "#000"
    },
    inputRow: {
        flexDirection: "row",
        padding: 8, borderTopWidth: 1,
        borderColor: "#ddd"
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 20,
        paddingHorizontal: 12,
        height: 40
    },
    btn: {
        marginLeft: 8,
        backgroundColor: "#007AFF",
        borderRadius: 20,
        paddingHorizontal: 16,
        justifyContent: "center"
    },
    item: {
        padding: 12,
        borderWidth: 1,
        borderColor: "#2c1414ff",
        backgroundColor: "#fcfcfcff",
        marginBottom: 15
    },
    chatId: {
        fontWeight: "bold"
    },
    last: {
        color: "#555",
        margin: 5
    },
    date: {
        fontSize: 11,
        color: "#94a3b8",
        marginTop: 4,
        alignSelf: "flex-end", // căn phải trong bubble
    },
    white: {
        color: "#fff"
    },
    flex1: {
        flex: 1
    },
    padding: {
        padding: 24
    },
    noChat: {
        textAlign: "center",
        marginTop: 20,
        color: "#666"
    }
});

export default styles;
