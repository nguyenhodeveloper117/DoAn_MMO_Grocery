// components/Chat/ChatBox.js
import React, { useEffect, useState, useRef } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { rtdb } from "../../configs/firebaseConfig";
import { ref, push, onChildAdded, serverTimestamp, set, update } from "firebase/database";

const ChatBox = ({ route }) => {
    const { seller, user } = route.params;
    const chatId = [user.user_code, seller.user_code].sort().join("_");
    const messagesRefPath = `chats/${chatId}/messages`;

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const listRef = useRef(null);

    useEffect(() => {
        console.log("🔌 Listening to:", messagesRefPath);
        const messagesRef = ref(rtdb, messagesRefPath);

        const unsub = onChildAdded(messagesRef, (snapshot) => {
            const msg = snapshot.val();
            console.log("📩 New message from DB:", msg);
            setMessages(prev => [...prev, { id: snapshot.key, ...msg }]);
        });

        return () => {
            console.log("❌ Unsubscribing from:", messagesRefPath);
        };
    }, [chatId]);

    const sendMessage = async () => {
        const text = input.trim();
        if (!text) return;

        const messagesRef = ref(rtdb, messagesRefPath);

        const newMsg = {
            senderId: user.user_code,
            text,
            createdAt: serverTimestamp(),
        };

        // push message
        await push(messagesRef, newMsg);

        // update metadata hội thoại
        const chatMetaRef = ref(rtdb, `chats/${chatId}`);
        await update(chatMetaRef, {
            lastMessage: text,
            updatedAt: serverTimestamp(),
            members: {
                [user.user_code]: true,
                [seller.user_code]: true,
            },
        });

        setInput("");
    };

    const renderItem = ({ item }) => {
        const mine = item.senderId === user.user_code;
        return (
            <View style={[styles.bubble, mine ? styles.myBubble : styles.otherBubble]}>
                <Text style={mine ? styles.myText : styles.otherText}>{item.text}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(i) => i.id}
                renderItem={renderItem}
                contentContainerStyle={{ padding: 10 }}
            />

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Nhập tin nhắn..."
                />
                <TouchableOpacity style={styles.btn} onPress={sendMessage}>
                    <Text style={{ color: "#fff" }}>Gửi</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    bubble: { padding: 10, borderRadius: 12, marginVertical: 6, maxWidth: "75%" },
    myBubble: { backgroundColor: "#007AFF", alignSelf: "flex-end" },
    otherBubble: { backgroundColor: "#e5e5ea", alignSelf: "flex-start" },
    myText: { color: "#fff" },
    otherText: { color: "#000" },
    inputRow: { flexDirection: "row", padding: 8, borderTopWidth: 1, borderColor: "#ddd" },
    input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 20, paddingHorizontal: 12, height: 40 },
    btn: { marginLeft: 8, backgroundColor: "#007AFF", borderRadius: 20, paddingHorizontal: 16, justifyContent: "center" }
});

export default ChatBox;
