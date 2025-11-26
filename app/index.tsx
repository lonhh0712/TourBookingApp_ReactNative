// app/index.tsx
import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Hình minh họa */}
      <Image
        source={require("../assets/images/onboard.jpg")}
        style={styles.image}
        resizeMode="cover"
      />

      {/* Nội dung */}
      <View style={styles.content}>
        <Text style={styles.title}>Mỗi chuyến đi là một câu chuyện đáng nhớ</Text>
        <Text style={styles.subtitle}>
          Đặt tour dễ dàng, khám phá thế giới theo cách của riêng bạn.
        </Text>

        {/* Nút bắt đầu */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(auth)/sign-in")}
        >
          <Text style={styles.buttonText}>Bắt đầu hành trình nào!</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "90%",
    height: "55%",
    borderRadius: 20,
    marginTop: 40,
  },
  content: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 30,
    marginTop: 30,
  },
  title: {
    fontSize: 20,
    fontFamily: "PoppinsBold",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "PoppinsRegular",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
