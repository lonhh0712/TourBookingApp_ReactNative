import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditProfileScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.profileSection}>
        <Image source={require("../assets/images/user.png")} style={styles.avatar} />
        <Text style={styles.username}>User</Text>
        <TouchableOpacity>
          <Text style={styles.changePhoto}>Thay đổi ảnh đại diện</Text>
        </TouchableOpacity>
      </View>

      {/* Input fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Họ</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder="Leonardo" />
          <Ionicons name="checkmark" size={20} color="#3B82F6" />
        </View>

        <Text style={styles.label}>Tên</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder="Ahmed" />
          <Ionicons name="checkmark" size={20} color="#3B82F6" />
        </View>

        <Text style={styles.label}>Địa chỉ</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder="Việt Nam" />
          <Ionicons name="checkmark" size={20} color="#3B82F6" />
        </View>

        <Text style={styles.label}>Số điện thoại</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder="+84 0123456789" keyboardType="phone-pad" />
          <Ionicons name="checkmark" size={20} color="#3B82F6" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  header: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  doneText: { color: "#3B82F6", fontSize: 16, fontWeight: "500" },
  profileSection: { alignItems: "center", marginTop: 25, marginBottom: 30 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  username: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 10 },
  changePhoto: { fontSize: 14, color: "#3B82F6", marginTop: 4 },
  inputGroup: { marginBottom: 40 },
  label: { fontSize: 14, color: "#111827", fontWeight: "600", marginBottom: 6, marginLeft: 2 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  input: { flex: 1, fontSize: 15, color: "#111827" },
});
