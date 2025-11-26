import { Feather, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, getUserProfile } from "../../backend/firebaseService";

type ProfileData = {
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
} & Record<string, unknown>;

export default function ProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const loadProfile = useCallback(
    async (user: User, showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
      }

      try {
        const data = (await getUserProfile(user.uid)) as ProfileData | null;
        const normalized: ProfileData = {
          ...data,
          displayName: data?.displayName ?? user.displayName ?? "User",
          email: data?.email ?? user.email ?? "",
          photoURL: data?.photoURL ?? user.photoURL ?? undefined,
        };
        setProfile(normalized);
      } catch (error) {
        console.error("getUserProfile error", error);
        Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
        setProfile({
          displayName: user.displayName ?? "User",
          email: user.email ?? "",
          photoURL: user.photoURL ?? undefined,
        });
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        router.replace("/(auth)/sign-in");
        return;
      }
      setFirebaseUser(firebaseUser);
      await loadProfile(firebaseUser, true);
    });

    return unsubscribe;
  }, [router, loadProfile]);

  useFocusEffect(
    useCallback(() => {
      const current = auth.currentUser ?? firebaseUser;
      if (!current) {
        router.replace("/(auth)/sign-in");
        return;
      }

      loadProfile(current).catch((error) =>
        console.error("refresh profile error", error)
      );
    }, [firebaseUser, loadProfile, router])
  );

  const handleLogout = async () => {
    Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất không?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut(auth);
          } finally {
            router.replace("/(auth)/sign-in");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  const displayName = profile?.displayName ?? "User";
  const email = profile?.email ?? "user@gmail.com";
  const avatarSource: ImageSourcePropType = profile?.photoURL
    ? { uri: String(profile.photoURL) }
    : require("../../assets/images/user.png");

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ</Text>
      </View>

      {/* Avatar */}
      <View style={styles.profileSection}>
        <Image source={avatarSource} style={styles.avatar} />
        <Text style={styles.username}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
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

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push({ pathname: "/bookmark" as any })}
        >
          <Feather name="bookmark" size={20} color="#111" />
          <Text style={styles.menuText}>Đã lưu</Text>
          <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push({ pathname: "/booked" as any })}
        >
          <Feather name="map-pin" size={20} color="#111" />
          <Text style={styles.menuText}>Những chuyến đã book</Text>
          <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/manage-tours")}
        >
          <Feather name="briefcase" size={20} color="#111" />
          <Text style={styles.menuText}>Quản lý đăng tour</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
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
