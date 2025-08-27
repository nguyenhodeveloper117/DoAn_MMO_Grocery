// components/Chat/ConversationList.js
import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, TouchableOpacity } from "react-native";
import { rtdb } from "../../configs/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useNavigation } from "@react-navigation/native";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import MyStyles from "../../styles/MyStyles";
import styles from "./ChatStyle";

const ConversationList = ({ route }) => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const navigation = useNavigation();

    const [conversations, setConversations] = useState([]);

    // nếu chưa đăng nhập thì redirect sang login
    useEffect(() => {
        if (!user) {
            alert("Bạn cần đăng nhập để nhắn tin!");
            navigation.navigate("login");
        }
    }, [user]);

    if (!user) {
        return null; // chưa render gì khi đang redirect
    }

    useEffect(() => {
        const chatsRef = ref(rtdb, "chats");

        // listen tất cả chats
        const unsub = onValue(chatsRef, (snapshot) => {
            const data = snapshot.val() || {};
            const convs = Object.keys(data)
                .map((chatId) => ({ chatId, ...data[chatId] }))
                // đảm bảo conv.members tồn tại và user đang ở trong members
                .filter((conv) => conv.members && !!conv.members[user.user_code]);

            // sort theo updatedAt mới nhất
            convs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            setConversations(convs);
        });

        return () => unsub();
    }, [user.user_code]);

    const renderItem = ({ item }) => {
        const otherUser = getOtherUser(item, user.user_code);

        return (
            <TouchableOpacity
                style={styles.item}
                onPress={() =>
                    navigation.navigate("chatBox", {
                        user,
                        // truyền seller (đối tượng) với user_code = otherUser
                        // nếu otherUser === user.user_code (self-chat) thì ChatBox nên xử lý phù hợp
                        seller: { user_code: otherUser },
                        conversation: item, // tiện cho ChatBox nếu cần
                    })
                }
            >
                <Text style={styles.chatId} numberOfLines={1} ellipsizeMode="tail">💬 {item.chatId}</Text>
                <Text style={styles.last} numberOfLines={1} ellipsizeMode="tail">
                    {item.lastMessage || "No messages yet"}
                </Text>
                <Text style={styles.date}>{item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "Unknown"}</Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[MyStyles.container, styles.flex1]}>
            <FlatList
                data={conversations}
                keyExtractor={(item) => item.chatId}
                renderItem={renderItem}
                ListEmptyComponent={
                    <Text style={styles.noChat}>
                        Không có cuộc trò chuyện nào
                    </Text>
                }
            />
        </View>
    );
};

/**
 * Trả về user_code của "other user".
 * - Nếu chỉ 1 phần tử trong members => trả myId (self-chat)
 * - Nếu có user khác => trả user đó
 * - Fallback trả phần tử đầu hoặc "Unknown"
 */
const getOtherUser = (conv, myId) => {
    const members = Object.keys(conv.members || {});
    if (members.length === 0) return "Unknown";
    if (members.length === 1) return members[0]; // self-chat lưu 1 phần tử => trả chính user đó
    const other = members.find((id) => id !== myId);
    return other || members[0];
};

export default ConversationList;
