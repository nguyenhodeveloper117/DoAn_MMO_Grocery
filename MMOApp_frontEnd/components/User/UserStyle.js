import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
    registerView: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20
    },
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
    registerText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1976d2',
        textTransform: 'uppercase'
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#2e7d32',
    },
    nameVerification: {
        fontSize: 22,
        fontWeight: 'bold',
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
    label2: {
        fontSize: 16,
        marginBottom: 10,
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
    title2: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
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
    googleButton: {
        borderColor: "#1976d2",
        borderWidth: 1,
        marginTop: 16,
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
    favoriteButton: {
        backgroundColor: '#0c388aff',
        width: '80%',
        borderRadius: 20,
    },
    depositButton: {
        backgroundColor: '#5c9724ff',
        width: '80%',
        borderRadius: 20,
    },
    withdrawButton: {
        backgroundColor: '#d82c2fff',
        width: '80%',
        borderRadius: 20,
    },
    transactionButton: {
        backgroundColor: '#4bccccff',
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
    created_date: {
        fontStyle: "italic",
        fontSize: 12,
        marginTop: 10,
        marginBottom: 10
    },
    product: {
        padding: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderRadius: 8,
        borderColor: "#ccc",
    },
    viewRenderItem: {
        flexDirection: "row",
        alignItems: "flex-start"
    },
    image: {
        width: 60,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
        backgroundColor: "#f0f0f0"
    },
    flex1: {
        flex: 1
    },
    productTitle: {
        fontWeight: "bold",
        marginBottom: 4
    },
    reviewStar: {
        color: "orange",
        marginTop: 2,
        marginBottom: 4,
        fontSize: 14,
    },
    noReview: {
        color: "gray",
        marginTop: 2,
        marginBottom: 4,
        fontSize: 14,
    },
    productCategory: {
        fontStyle: "italic",
        fontSize: 12,
        marginBottom: 10
    },
    productDes: {
        color: "#555"
    },
    marginBottom: {
        marginBottom: 10
    },
    marginRight: {
        marginRight: 10
    },
    noTransactionText: {
        textAlign: "center",
        color: "#999",
        marginTop: 20
    },
    qrBox: {
        alignItems: "center",
        marginTop: 20
    },
    qrImage: {
        width: 250,
        height: 250,
        marginTop: 10
    },
    inputMoney: {
        borderWidth: 1,
        borderColor: "#ccc", 
        borderRadius: 8,
        padding: 10,
        marginBottom: 20
    },
    marginBottom20: {
        marginBottom: 20
    },
    listDeposit: {
        fontSize: 16,
        marginTop: 20,
        marginBottom: 10
    },
    itemDeposit: {
        padding: 10,
        borderBottomWidth: 1,
        borderColor: "#ccc"
    }
});

export default styles;
