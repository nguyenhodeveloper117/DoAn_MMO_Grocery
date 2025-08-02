import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarPicker: {
        marginBottom: 16,
        fontWeight: "bold"
    },
    imageVerification: {
        width: "100%",
        height: 200,
        resizeMode: "contain",
        marginVertical: 15,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2e7d32',
    },
    infoBox: {
        width: '100%',
        backgroundColor: '#ffffff',
        padding: 16,
        borderRadius: 12,
        elevation: 2,
        marginBottom: 24,
    },
    info: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    label: {
        fontSize: 16,
        fontWeight: "bold",
        marginTop: 8,
    },
    input: {
        marginBottom: 16,
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 12,
        marginBottom: 4,
    },
    subTitle: {
        fontWeight: '600',
        marginTop: 4,
    },
    text: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 8,
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
        gap: 12,
    },
    button: {
        backgroundColor: '#4caf50',
        borderRadius: 20,
    },
    editButton: {
        backgroundColor: '#2196f3',
        width: '80%',
        borderRadius: 20,
    },
    kycButton: {
        backgroundColor: '#ff9800',
        width: '80%',
        borderRadius: 20,
    },
    becomeSellerButton: {
        backgroundColor: '#78cb1fff',
        width: '80%',
        borderRadius: 20,
    },
    termsButton: {
        color: '#d28924ff',
        width: '80%',
        borderRadius: 20,
    },
    logoutButton: {
        backgroundColor: '#f44336',
        width: '80%',
        borderRadius: 20,
    },
});

export default styles;
