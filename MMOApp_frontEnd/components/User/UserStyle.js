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
    input: {
        marginBottom: 16,
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
    logoutButton: {
        backgroundColor: '#f44336',
        width: '80%',
        borderRadius: 20,
    },
});

export default styles;
