import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import type { NotificationRecord } from "../../backend/firebaseService";
import {
  auth,
  getTours,
  getUserNotifications,
  getUserProfile,
  markNotificationRead,
  maybeNotifyUpcomingDepartures,
} from "../../backend/firebaseService";

// 🔹 Avatar mặc định
const defaultAvatar: ImageSourcePropType = require("../../assets/images/user.png");

type NotificationItem = {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
  read?: boolean;
  type?: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string>("User");
  const [avatarSource, setAvatarSource] =
    useState<ImageSourcePropType>(defaultAvatar);
  const [showNotifications, setShowNotifications] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ top: 120, right: 24 });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const hasUnreadNotifications = notifications.some((notification) => !notification.read);
  const bellAnchorRef = useRef<View | null>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const panelWidth = screenWidth * (2 / 3);
  const panelHeight = screenHeight * 0.75;

  const formatNotificationTime = useCallback((value?: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  }, []);

  const renderNotificationItem = useCallback(
    ({ item }: { item: NotificationItem }) => (
      <View style={[styles.notificationCard, !item.read && styles.notificationUnreadCard]}>
        <View style={styles.notificationCardHeader}>
          <Text style={styles.notificationTitle}>{item.title || "Thông báo"}</Text>
          {!item.read ? <View style={styles.notificationUnreadDot} /> : null}
        </View>
        <Text style={styles.notificationBody}>{item.body || ""}</Text>
        <Text style={styles.notificationTimestamp}>{formatNotificationTime(item.createdAt)}</Text>
      </View>
    ),
    [formatNotificationTime]
  );

  // 🔹 Hàm load thông tin user (tên + avatar)
  const refreshUserInfo = useCallback(
    async (userOverride?: User | null) => {
      const user = userOverride ?? auth.currentUser;
      if (!user) {
        setUserName("User");
        setAvatarSource(defaultAvatar);
        return;
      }

      try {
        const profile = await getUserProfile(user.uid);

        const displayName = String(
          profile?.displayName ?? user.displayName ?? "User"
        );
        setUserName(displayName);

        const photoUrl = profile?.photoURL ?? user.photoURL;
        setAvatarSource(photoUrl ? { uri: photoUrl as string } : defaultAvatar);
      } catch (error) {
        console.error("Load user profile failed", error);
      }
    },
    []
  );

  // 🔹 Load tours one time và hỗ trợ refresh thủ công
  const loadTours = useCallback(async () => {
    try {
      const data = await getTours();
      setTours(data);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    }
  }, []);

  useEffect(() => {
    const boot = async () => {
      try {
        await loadTours();
      } finally {
        setLoading(false);
      }
    };

    boot();
  }, [loadTours]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadTours();
    } finally {
      setRefreshing(false);
    }
  }, [loadTours]);

  const loadNotifications = useCallback(async () => {
    const user = auth.currentUser;
    if (!user) {
      setNotifications([]);
      return;
    }

    setLoadingNotifications(true);
    try {
      await maybeNotifyUpcomingDepartures(user.uid);
      const data = (await getUserNotifications(user.uid, 30)) as NotificationRecord[];
      setNotifications(
        data.map((raw) => ({
          id: String(raw.id),
          title: typeof raw.title === "string" ? raw.title : "Thông báo",
          body: typeof raw.body === "string" ? raw.body : "",
          createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
          read: Boolean(raw.read),
          type: typeof raw.type === "string" ? raw.type : undefined,
        }))
      );
    } catch (error) {
      console.error("Load notifications failed", error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // 🔹 Lắng nghe trạng thái đăng nhập Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        setUserName("User");
        setAvatarSource(defaultAvatar);
        setNotifications([]);
        return;
      }

      refreshUserInfo(firebaseUser).catch((error) =>
        console.error("Auth profile sync failed", error)
      );
      loadNotifications().catch((error) =>
        console.error("Auth notifications sync failed", error)
      );
    });

    return unsubscribe;
  }, [loadNotifications, refreshUserInfo]);

  // 🔹 Mỗi lần focus Home => reload info user (phòng trường hợp đổi avatar, tên)
  useFocusEffect(
    useCallback(() => {
      refreshUserInfo().catch((error) =>
        console.error("Refresh user info failed", error)
      );
      loadNotifications().catch((error) =>
        console.error("Refresh notifications failed", error)
      );

      return () => {
        setShowNotifications(false);
      };
    }, [loadNotifications, refreshUserInfo])
  );

  const closeNotifications = useCallback(() => {
    setShowNotifications(false);
  }, []);

  const toggleNotifications = useCallback(() => {
    if (!showNotifications) {
      loadNotifications().catch((error) =>
        console.error("Open notifications failed", error)
      );
      requestAnimationFrame(() => {
        bellAnchorRef.current?.measureInWindow((x, y, width, height) => {
          const computedRight = Math.max(16, screenWidth - (x + width));
          let computedTop = y + height + 8;
          const maxTop = screenHeight - panelHeight - 16;

          if (computedTop > maxTop) {
            computedTop = Math.max(60, maxTop);
          }

          setPanelPosition({ top: computedTop, right: computedRight });
          setShowNotifications(true);
        });

        if (!bellAnchorRef.current) {
          setShowNotifications(true);
        }
      });
      return;
    }

    setShowNotifications(false);
  }, [loadNotifications, panelHeight, screenHeight, screenWidth, showNotifications]);

  useEffect(() => {
    if (!showNotifications) {
      return;
    }

    const markUnread = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const unread = notifications.filter((notification) => !notification.read);
      if (!unread.length) {
        return;
      }

      try {
        await Promise.all(
          unread.map((notification) =>
            markNotificationRead(user.uid, notification.id).catch((error) => {
              console.error("markNotificationRead failed", error);
            })
          )
        );

        setNotifications((prev) =>
          prev.map((notification) =>
            notification.read ? notification : { ...notification, read: true }
          )
        );
      } catch (error) {
        console.error("Mark all notifications read failed", error);
      }
    };

    markUnread().catch((error) =>
      console.error("Mark unread effect failed", error)
    );
  }, [notifications, showNotifications]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image source={avatarSource} style={styles.avatar} />
          <Text style={styles.username}>{userName}</Text>
        </View>
        <View ref={bellAnchorRef} collapsable={false}>
          <TouchableOpacity style={styles.bellButton} onPress={toggleNotifications}>
            <Ionicons name="notifications-outline" size={22} color="#000" />
            {hasUnreadNotifications ? <View style={styles.bellDot} /> : null}
          </TouchableOpacity>
        </View>
      </View>

      {showNotifications ? (
        <View style={styles.dropdownOverlay} pointerEvents="box-none">
          <Pressable style={styles.dropdownBackdrop} onPress={closeNotifications} />
          <View
            style={[
              styles.dropdownPanel,
              {
                width: panelWidth,
                height: panelHeight,
                top: panelPosition.top,
                right: panelPosition.right,
              },
            ]}
          >
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>Thông báo</Text>
              <TouchableOpacity onPress={closeNotifications}>
                <Ionicons name="close" size={18} color="#111" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotificationItem}
              ItemSeparatorComponent={() => <View style={styles.notificationDivider} />}
              contentContainerStyle={styles.dropdownContent}
              showsVerticalScrollIndicator={false}
              refreshing={loadingNotifications}
              onRefresh={loadNotifications}
              ListEmptyComponent={
                loadingNotifications ? (
                  <View style={styles.notificationEmpty}>
                    <ActivityIndicator size="small" color="#2563EB" />
                    <Text style={styles.notificationLoadingText}>Đang tải thông báo...</Text>
                  </View>
                ) : (
                  <View style={styles.notificationEmpty}>
                    <Ionicons name="notifications-off-outline" size={28} color="#9CA3AF" />
                    <Text style={styles.notificationEmptyText}>Hiện chưa có thông báo mới.</Text>
                  </View>
                )
              }
            />
          </View>
        </View>
      ) : null}

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>
          Khám phá thế giới <Text style={styles.highlight}>tuyệt đẹp!</Text>
        </Text>
        <Text style={styles.subtitle}>Địa điểm tuyệt vời nhất!</Text>
      </View>

      {/* Danh sách tour */}
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 50 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/details",
                params: { ...item },
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardLocation}>{item.location}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  username: { fontSize: 15, fontWeight: "600", color: "#111827" },
  bellButton: {
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 12,
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#fff",
  },
  dropdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(17, 24, 39, 0.15)",
  },
  dropdownPanel: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dropdownTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  dropdownContent: {
    paddingBottom: 12,
  },
  notificationCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 14,
  },
  notificationUnreadCard: {
    backgroundColor: "#EEF2FF",
  },
  notificationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  notificationBody: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 10,
  },
  notificationTimestamp: {
    fontSize: 12,
    color: "#6B7280",
  },
  notificationUnreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563EB",
    marginLeft: 8,
  },
  notificationDivider: { height: 12 },
  notificationEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    gap: 10,
  },
  notificationEmptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
  notificationLoadingText: {
    fontSize: 13,
    color: "#4B5563",
  },
  titleBlock: {
    paddingHorizontal: 24,
    marginBottom: 12,
    paddingTop: 10,
  },
  title: {
    fontSize: 38,
    fontWeight: "400",
    color: "#111827",
    flexWrap: "wrap",
    width: "100%",
    lineHeight: 46,
  },
  highlight: { color: "#FF6B00", textDecorationLine: "underline" },
  subtitle: { fontSize: 17, color: "#6B7280", marginVertical: 16 },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 18,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: { width: "100%", height: 120, resizeMode: "cover" },
  cardContent: { paddingHorizontal: 10, paddingVertical: 8 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  cardLocation: { fontSize: 13, color: "#6B7280", marginVertical: 3 },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { marginLeft: 4, fontSize: 13, color: "#111827" },
});
