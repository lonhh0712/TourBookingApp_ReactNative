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
import { sign_in } from "../../backend/firebaseService";

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getErrorMessage = (err: unknown) => {
    const code = (err as { code?: string })?.code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Email hoặc mật khẩu không đúng.";
      case "auth/invalid-email":
        return "Định dạng email không hợp lệ.";
      default:
        return "Đăng nhập thất bại. Vui lòng thử lại.";
    }
  };

  const handleSignIn = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await sign_in({ email: trimmedEmail, password: trimmedPassword });
      router.replace("/(tabs)/home");
    } catch (err) {
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
        onPress={() => router.replace("/")}
      >
        <Ionicons name="chevron-back" size={26} color="#000" />
      </TouchableOpacity>

      {/* Tiêu đề */}
      <Text style={styles.title}>Đăng nhập ngay</Text>

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

      {/* Nút đăng nhập */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.signInButton, submitting && styles.buttonDisabled]}
        onPress={handleSignIn}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.signInText}>Đăng nhập</Text>
        )}
      </TouchableOpacity>

      {/* Liên kết đăng ký */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Bạn chưa có tài khoản? </Text>
        <TouchableOpacity onPress={() => router.push("/(auth)/sign-up")}>
          <Text style={styles.signUpLink}>Đăng ký</Text>
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
  signInButton: {
    backgroundColor: "#007BFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  signInText: {
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
  signUpLink: {
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
