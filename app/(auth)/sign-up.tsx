import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { sign_up } from "../../backend/firebaseService";

export default function SignUpScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown) => {
    const code = (err as { code?: string })?.code;
    const message = (err as { message?: string })?.message;
    switch (code) {
      case "auth/email-already-in-use":
        return "Email đã được sử dụng.";
      case "auth/weak-password":
        return "Mật khẩu quá yếu. Vui lòng đặt mật khẩu mạnh hơn.";
      case "auth/invalid-email":
        return "Định dạng email không hợp lệ.";
      case "auth/network-request-failed":
        return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.";
      case "auth/internal-error":
        return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.";
      default:
        return message ?? "Đăng ký thất bại. Vui lòng thử lại.";
    }
  };

  const handleSignUp = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      setError("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await sign_up({
        email: trimmedEmail,
        password: trimmedPassword,
        displayName: trimmedName,
      });
      Alert.alert("Thành công", "Tạo tài khoản thành công!", [
        { text: "Tiếp tục", onPress: () => router.replace("/(tabs)/home") },
      ]);
    } catch (err) {
      console.error("Sign up error", err);
      const message = getErrorMessage(err);
      setError(message);
      Alert.alert("Lỗi", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Nút quay lại */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.replace("/(auth)/sign-in")}
      >
        <Ionicons name="chevron-back" size={26} color="#000" />
      </TouchableOpacity>

      {/* Tiêu đề */}
      <Text style={styles.title}>Đăng ký ngay</Text>

      {/* Ô nhập tên */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
      />

      {/* Ô nhập email */}
      <TextInput
        style={styles.input}
        placeholder="user@gmail.com"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Ô nhập mật khẩu */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="********"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={styles.eyeButton}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#6B7280"
          />
        </TouchableOpacity>
      </View>

      {/* Nút đăng ký */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.signUpButton, submitting && styles.buttonDisabled]}
        onPress={handleSignUp}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signUpText}>Đăng ký</Text>
        )}
      </TouchableOpacity>

      {/* Liên kết đăng nhập */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Bạn đã có tài khoản? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.signInLink}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    color: "#111827",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    color: "#111",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 24,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111",
  },
  eyeButton: {
    paddingHorizontal: 12,
  },
  signUpButton: {
    backgroundColor: "#007BFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  signUpText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signInLink: {
    color: "#007BFF",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
