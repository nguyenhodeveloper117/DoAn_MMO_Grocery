// components/Chat/ChatBox.js
import React, { useEffect, useState, useRef, useContext } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { rtdb } from "../../configs/firebaseConfig";
import { ref, push, onChildAdded, serverTimestamp, set, update } from "firebase/database";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { useNavigation } from "@react-navigation/native";
import MyStyles from "../../styles/MyStyles";
import styles from "./ChatStyle";

const ChatBox = ({ route }) => {
    const navigation = useNavigation();
    const ctxUser = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const currentUser = user || ctxUser;
    const { seller, user } = route.params;

    // // nếu chưa đăng nhập thì redirect sang login
    // useEffect(() => {
    //     if (!currentUser) {
    //         alert("Bạn cần đăng nhập để nhắn tinZ!");
    //         navigation.navigate("login");
    //     }
    // }, [currentUser]);

    // if (!currentUser) {
    //     return null; // chưa render gì khi đang redirect
    // }

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
                <Text style={styles.date}>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Unknown"}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(i) => i.id}
                renderItem={renderItem}
                contentContainerStyle={styles.padding}
            />

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Nhập tin nhắn..."
                />
                <TouchableOpacity style={styles.btn} onPress={sendMessage}>
                    <Text style={styles.white}>Gửi</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatBox;
