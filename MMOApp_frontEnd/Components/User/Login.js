import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native"
import MyStyles from "../../styles/MyStyles"
import styles from "./UserStyle";
import { Button, HelperText, TextInput } from "react-native-paper";
import { useContext, useState } from "react";
import Apis, { authApis, endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MyDispatchContext } from "../../configs/Contexts";

const Login = ({ navigation }) => {
    const info = [{
        label: 'Tên đăng nhập',
        field: 'username',
        icon: 'account',
        secureTextEntry: false
    }, {
        label: 'Mật khẩu',
        field: 'password',
        icon: 'eye',
        secureTextEntry: true
    }];

    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState();
    const [showPassword, setShowPassword] = useState(false);
    const nav = useNavigation();
    const dispatch = useContext(MyDispatchContext);

    const setState = (value, field) => {
        setUser({ ...user, [field]: value })
    }

    const validate = () => {
        if (Object.values(user).length == 0) {
            setMsg("Vui lòng nhập thông tin!");
            return false;
        }

        for (let i of info)
            if (user[i.field] === '') {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }

        setMsg('');
        return true;
    }

    const login = async () => {
        if (validate() === true) {
            try {
                setLoading(true);


                let res = await Apis.post(endpoints['login'], {
                    ...user,
                    client_id: 'zJwncIqfkRcuCjrv6HauiqrOGjCkVL1IHbcsRycG',
                    client_secret: 'B5DZbb5lTkvnF5xvCbjIHvCix8DbAy75103VeLZH0DZIVbSaTcvh1ujSf0SXDsMcVyMQXiteaGmR9CUph7q8CexMJEGGMJwFNjc7Opxl3d0vOwkjcjTwKKvSZ58dgewt',
                    grant_type: 'password'
                });
                await AsyncStorage.setItem('token', res.data.access_token);

                let u = await authApis(res.data.access_token).get(endpoints['current-user']);

                dispatch({
                    "type": "login",
                    "payload": u.data
                });

            } catch (ex) {
                console.error(ex);
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <ScrollView contentContainerStyle={{ ...MyStyles.container}}>
            <HelperText type="error" visible={msg}>
                {msg}
            </HelperText>

            {info.map(i => (
                <TextInput
                    key={i.field}
                    style={styles.input}
                    label={i.label}
                    secureTextEntry={i.field === 'password' ? !showPassword : i.secureTextEntry} // Ẩn/hiện mật khẩu
                    value={user[i.field]}
                    onChangeText={t => setState(t, i.field)}
                    right={
                        i.field === 'password' ? (
                            <TextInput.Icon
                                icon={showPassword ? 'eye-off' : 'eye'} // Icon thay đổi theo trạng thái
                                onPress={() => setShowPassword(!showPassword)} // Thay đổi trạng thái
                            />
                        ) : (
                            <TextInput.Icon icon={i.icon} />
                        )
                    }
                    mode="outlined"
                />
            ))}

            <TouchableOpacity onPress={() => navigation.navigate("forgotPassword")}>
                <Text style={{ color: "#1976d2", textAlign: "right", marginBottom: 20 }}>
                    Quên mật khẩu?
                </Text>
            </TouchableOpacity>

            <Button
                onPress={login}
                disabled={loading}
                loading={loading}
                mode="contained"
                style={styles.button}
            >
                Đăng nhập
            </Button>

            <Button
                icon="google"
                mode="outlined"
                // onPress={loginWithGoogle}
                style={styles.googleButton}
            >
                Đăng nhập bằng Google
            </Button>

            <View style={styles.registerView}>
                <Text style={{ fontSize: 16, color: '#000' }}>
                    Chưa có tài khoản?{' '}
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("register")}>
                    <Text style={styles.registerText}>
                        Đăng ký ngay!
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

export default Login;