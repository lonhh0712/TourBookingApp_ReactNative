import { Feather, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ProfileScreen() {
  const router = useRouter();

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          router.replace("/(auth)/sign-in"); // Điều hướng về trang đăng nhập
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
      </View>

      {/* Avatar */}
      <View style={styles.profileSection}>
        <Image
          source={require("../../assets/images/user.png")}
          style={styles.avatar}
        />
        <Text style={styles.username}>user</Text>
        <Text style={styles.email}>user@gmail.com</Text>
      </View>

      {/* Menu */}
      <View style={styles.menuContainer}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/edit-profile")}
        >
          <Feather name="user" size={20} color="#111" />
          <Text style={styles.menuText}>Hồ sơ</Text>
          <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Feather name="bookmark" size={20} color="#111" />
          <Text style={styles.menuText}>Đã lưu</Text>
          <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Feather name="map-pin" size={20} color="#111" />
          <Text style={styles.menuText}>Những chuyến đã đi qua</Text>
          <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Feather name="settings" size={20} color="#111" />
          <Text style={styles.menuText}>Cài đặt</Text>
          <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
        </TouchableOpacity>
      </View>

      {/* ✅ Nút Đăng xuất */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  header: { marginTop: 50, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  profileSection: { alignItems: "center", marginTop: 30, marginBottom: 20 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#F3F4F6" },
  username: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 12 },
  email: { fontSize: 14, color: "#6B7280" },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingVertical: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuText: { flex: 1, marginLeft: 12, fontSize: 16, color: "#111827" },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    paddingVertical: 14,
    backgroundColor: "#FEE2E2",
    borderRadius: 12,
  },
  logoutText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
