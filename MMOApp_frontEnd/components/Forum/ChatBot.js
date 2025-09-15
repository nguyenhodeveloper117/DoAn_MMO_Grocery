import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApis, endpoints } from "../../configs/Apis";

export default function ChatBot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const token = await AsyncStorage.getItem("token");
      const res = await authApis(token).post(endpoints["chatbot"], { question: input });
      const botMsg = { role: "bot", content: res.data.answer };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setInput("");
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={[styles.message, item.role === "user" ? styles.user : styles.bot]}>
            <Text>{item.content}</Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Nhập câu hỏi..."
        />
        <Button title="Gửi" onPress={sendMessage} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
  message: { padding: 10, marginVertical: 5, borderRadius: 10, maxWidth: "80%" },
  user: { alignSelf: "flex-end", backgroundColor: "#DCF8C6" },
  bot: { alignSelf: "flex-start", backgroundColor: "#EEE" },
  inputRow: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", padding: 10, marginRight: 5, borderRadius: 5 },
});
