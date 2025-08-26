// components/Chat/ConversationList.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { rtdb } from "../../configs/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { useContext } from "react";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";

const ConversationList = ({ route }) => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const navigation = useNavigation();

    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const chatsRef = ref(rtdb, "chats");

        // listen tất cả chats
        const unsub = onValue(chatsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const convs = Object.keys(data)
                .map((chatId) => ({ chatId, ...data[chatId] }))
                .filter((conv) => conv.members && conv.members[user.user_code]); // chỉ chat mình tham gia

            // sort theo updatedAt mới nhất
            convs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            setConversations(convs);
        });

        return () => unsub();
    }, [user.user_code]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() =>
                navigation.navigate("chatBox", {
                    user,
                    seller: { user_code: getOtherUser(item, user.user_code) }, // truyền seller để ChatBox biết
                })
            }
        >
            <Text style={styles.chatId}>💬 {item.chatId}</Text>
            <Text style={styles.last}>{item.lastMessage || "No messages yet"}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item.chatId}
                renderItem={renderItem}
            />
        </View>
    );
};

const getOtherUser = (conv, myId) => {
    const members = Object.keys(conv.members || {});
    return members.find((id) => id !== myId) || "Unknown";
};

const styles = StyleSheet.create({
    item: { padding: 12, borderBottomWidth: 1, borderColor: "#ddd" },
    chatId: { fontWeight: "bold" },
    last: { color: "#555" },
});

export default ConversationList;
