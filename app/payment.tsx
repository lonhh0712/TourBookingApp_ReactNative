import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function PaymentScreen() {
  const router = useRouter();
  const { name, location, price, image } = useLocalSearchParams();

  const handleConfirmPayment = () => {
    Alert.alert(
      "Thanh toán thành công 🎉",
      `Cảm ơn bạn đã đặt tour ${name}!`,
      [{ text: "Về trang chủ", onPress: () => router.replace("/(tabs)/home") }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tour summary */}
      <View style={styles.summaryCard}>
        <Image
          source={
            image
              ? { uri: image }
              : require("../assets/images/nhatrang.jpg")
          }
          style={styles.image}
        />
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.location}>{location}</Text>
          <Text style={styles.price}>{price || "$59/Người"}</Text>
        </View>
      </View>

      {/* Form thanh toán */}
      <View style={styles.form}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput style={styles.input} placeholder="Nguyễn Văn A" />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="example@gmail.com"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="0123456789"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Phương thức thanh toán</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví MoMo / ZaloPay / Visa..."
        />
      </View>

      {/* Nút xác nhận */}
      <TouchableOpacity style={styles.button} onPress={handleConfirmPayment}>
        <Text style={styles.buttonText}>Xác nhận thanh toán</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  image: { width: 100, height: 100 },
  name: { fontSize: 17, fontWeight: "700", color: "#111827" },
  location: { fontSize: 14, color: "#6B7280", marginVertical: 4 },
  price: { color: "#2563EB", fontWeight: "600", fontSize: 15 },
  form: { marginTop: 10, marginBottom: 40 },
  label: { fontSize: 15, color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
