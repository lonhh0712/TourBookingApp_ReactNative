import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addBookmark,
  auth,
  createOrGetConversation,
  getBookmarks,
  getTourById,
  getUserProfile,
  removeBookmark,
  type ConversationParticipantProfile,
} from "../backend/firebaseService";

// 🧠 Định nghĩa rõ các tham số được truyền từ Home hoặc Search
type TourParams = {
  id?: string;
  name?: string;
  location?: string;
  price?: string;
  rating?: string;
  image?: string;
  description?: string;
  startDate?: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhoto?: string;
  ownerRole?: string;
};

const resolveParamValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export default function DetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<TourParams>();
  const tourId = useMemo(() => {
    const rawId = params.id;
    if (Array.isArray(rawId)) return rawId[0];
    return rawId ?? undefined;
  }, [params.id]);

  const ownerIdParam = useMemo(
    () => resolveParamValue(params.ownerId as string | string[] | undefined),
    [params.ownerId]
  );
  const ownerNameParam = useMemo(
    () => resolveParamValue(params.ownerName as string | string[] | undefined),
    [params.ownerName]
  );
  const ownerEmailParam = useMemo(
    () => resolveParamValue(params.ownerEmail as string | string[] | undefined),
    [params.ownerEmail]
  );
  const ownerPhotoParam = useMemo(
    () => resolveParamValue(params.ownerPhoto as string | string[] | undefined),
    [params.ownerPhoto]
  );
  const ownerRoleParam = useMemo(
    () => resolveParamValue(params.ownerRole as string | string[] | undefined),
    [params.ownerRole]
  );

  const { name, location, rating, price, image, description, startDate } = params;
  const [bookmarked, setBookmarked] = useState(false);
  const [bookmarkSyncing, setBookmarkSyncing] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState({
    ownerId: ownerIdParam,
    ownerName: ownerNameParam,
    ownerEmail: ownerEmailParam,
    ownerPhoto: ownerPhotoParam ?? null,
    ownerRole: ownerRoleParam,
  });
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // 🗓️ Format ngày khởi hành (nếu có)
  let formattedDate = "Chưa cập nhật";

  if (startDate) {
    try {
      const dateObj = new Date(startDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString("vi-VN");
      }
    } catch (e) {
      formattedDate = "Không xác định";
    }
  }

  useEffect(() => {
    let active = true;

    const syncBookmarkStatus = async () => {
      if (!tourId) {
        if (active) setBookmarked(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        if (active) setBookmarked(false);
        return;
      }

      try {
        const bookmarks = await getBookmarks(user.uid);
        if (active) {
          setBookmarked(bookmarks.includes(tourId));
        }
      } catch (error) {
        console.error("sync bookmarks failed", error);
      }
    };

    syncBookmarkStatus();

    return () => {
      active = false;
    };
  }, [tourId]);

  useEffect(() => {
    setOwnerInfo((prev) => ({
      ownerId: ownerIdParam ?? prev.ownerId,
      ownerName: ownerNameParam ?? prev.ownerName,
      ownerEmail: ownerEmailParam ?? prev.ownerEmail,
      ownerPhoto: ownerPhotoParam ?? prev.ownerPhoto,
      ownerRole: ownerRoleParam ?? prev.ownerRole,
    }));
  }, [ownerEmailParam, ownerIdParam, ownerNameParam, ownerPhotoParam, ownerRoleParam]);

  useEffect(() => {
    if (!tourId) return;
    if (ownerInfo.ownerId && ownerInfo.ownerName && ownerInfo.ownerEmail) {
      return;
    }

    let active = true;
    setOwnerLoading(true);

    getTourById(tourId)
      .then((record) => {
        if (!active || !record) return;
        setOwnerInfo((prev) => ({
          ownerId: (record.ownerId as string | undefined) ?? prev.ownerId,
          ownerName: (record.ownerName as string | undefined) ?? prev.ownerName,
          ownerEmail: (record.ownerEmail as string | undefined) ?? prev.ownerEmail,
          ownerPhoto: (record.ownerPhoto as string | null | undefined) ?? prev.ownerPhoto,
          ownerRole: (record.ownerRole as string | undefined) ?? prev.ownerRole,
        }));
      })
      .catch((error) => {
        console.error("load tour owner failed", error);
      })
      .finally(() => {
        if (active) setOwnerLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ownerInfo.ownerEmail, ownerInfo.ownerId, ownerInfo.ownerName, tourId]);

  useEffect(() => {
    if (!ownerInfo.ownerId) return;
    if (ownerInfo.ownerName && ownerInfo.ownerEmail) return;

    let active = true;

    getUserProfile(ownerInfo.ownerId)
      .then((profile) => {
        if (!active || !profile) return;
        setOwnerInfo((prev) => ({
          ownerId: prev.ownerId,
          ownerName: (profile.displayName as string | undefined) ?? prev.ownerName,
          ownerEmail: (profile.email as string | undefined) ?? prev.ownerEmail,
          ownerPhoto: (profile.photoURL as string | null | undefined) ?? prev.ownerPhoto,
          ownerRole: (profile.role as string | undefined) ?? prev.ownerRole,
        }));
      })
      .catch((error) => console.error("load owner profile failed", error));

    return () => {
      active = false;
    };
  }, [ownerInfo.ownerEmail, ownerInfo.ownerId, ownerInfo.ownerName]);

  const ownerDisplayName = ownerInfo.ownerName ?? "Người đăng";
  const hasOwnerDetails = Boolean(ownerInfo.ownerId || ownerInfo.ownerName || ownerInfo.ownerEmail);
  const ownerInitials = useMemo(() => {
    if (!ownerDisplayName) return "?";
    return ownerDisplayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((segment) => segment[0]?.toUpperCase() ?? "")
      .join("")
      .trim()
      .slice(0, 2) || "?";
  }, [ownerDisplayName]);

  const handleChatWithOwner = useCallback(async () => {
    if (!ownerInfo.ownerId) {
      Alert.alert("Thiếu thông tin", "Không tìm thấy người đăng tour.");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Cần đăng nhập", "Bạn phải đăng nhập để trò chuyện với người đăng.", [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đăng nhập",
          onPress: () => router.replace("/(auth)/sign-in"),
        },
      ]);
      return;
    }

    if (currentUser.uid === ownerInfo.ownerId) {
      Alert.alert("Thông báo", "Đây là tour do bạn đăng.");
      return;
    }

    try {
      setStartingChat(true);
      const [currentProfile, ownerProfile] = await Promise.all([
        getUserProfile(currentUser.uid).catch(() => null),
        getUserProfile(ownerInfo.ownerId).catch(() => null),
      ]);

      const viewerParticipant: ConversationParticipantProfile = {
        uid: currentUser.uid,
        displayName:
          (currentProfile?.displayName as string | undefined) ||
          currentUser.displayName ||
          currentUser.email ||
          "Bạn",
        photoURL:
          (currentProfile?.photoURL as string | undefined) || currentUser.photoURL || null,
        role: (currentProfile?.role as string | undefined) ?? undefined,
      };

      const ownerParticipant: ConversationParticipantProfile = {
        uid: ownerInfo.ownerId,
        displayName:
          ownerInfo.ownerName ||
          (ownerProfile?.displayName as string | undefined) ||
          ownerInfo.ownerEmail ||
          "Người đăng",
        photoURL:
          ownerInfo.ownerPhoto ||
          (ownerProfile?.photoURL as string | undefined) ||
          null,
        role: ownerInfo.ownerRole || (ownerProfile?.role as string | undefined) || undefined,
      };

      const conversationRef = await createOrGetConversation(
        viewerParticipant,
        ownerParticipant
      );

      const conversationParams: Record<string, string> = {
        conversationId: conversationRef.id,
      };

      if (tourId) conversationParams.tourId = String(tourId);
      if (typeof name === "string" && name.length) {
        conversationParams.tourName = name;
      }
      if (typeof location === "string" && location.length) {
        conversationParams.tourLocation = location;
      }
      if (typeof startDate === "string" && startDate.length) {
        conversationParams.tourStartDate = startDate;
      }
      if (typeof image === "string" && image.length) {
        conversationParams.tourImage = image;
      }

      router.push({
        pathname: "/(tabs)/message",
        params: conversationParams,
      });
    } catch (error) {
      console.error("start chat failed", error);
      Alert.alert("Lỗi", "Không thể bắt đầu cuộc trò chuyện.");
    } finally {
      setStartingChat(false);
    }
  }, [ownerInfo.ownerEmail, ownerInfo.ownerId, ownerInfo.ownerName, ownerInfo.ownerPhoto, ownerInfo.ownerRole, router]);

  const viewerIsOwner = Boolean(
    ownerInfo.ownerId && auth.currentUser?.uid === ownerInfo.ownerId
  );

  const toggleBookmark = async () => {
    if (!tourId) {
      Alert.alert("Không thể lưu", "Tour này chưa có mã định danh.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để lưu tour yêu thích.", [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Đăng nhập",
          onPress: () => router.replace("/(auth)/sign-in"),
        },
      ]);
      return;
    }

    try {
      setBookmarkSyncing(true);
      if (bookmarked) {
        await removeBookmark(user.uid, tourId);
        setBookmarked(false);
      } else {
        await addBookmark(user.uid, tourId);
        setBookmarked(true);
      }
    } catch (error) {
      console.error("toggle bookmark failed", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái đánh dấu.");
    } finally {
      setBookmarkSyncing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.topBarButton}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.topBarButton}
          activeOpacity={0.8}
          onPress={toggleBookmark}
          disabled={bookmarkSyncing}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={18}
            color={bookmarked ? "#FBBF24" : "#fff"}
          />
        </TouchableOpacity>
      </View>
      {/* Ảnh tour */}
      <Image source={{ uri: image }} style={styles.image} />

      {/* Nội dung chi tiết */}
      <View style={styles.content}>
        <Text style={styles.title}>{name}</Text>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#2563EB" />
          <Text style={styles.location}>{location}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <Text style={styles.startDate}>Khởi hành: {formattedDate}</Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="star" size={18} color="#FBBF24" />
          <Text style={styles.rating}>Đánh giá: {rating}</Text>
        </View>

        <Text style={styles.price}>{price}</Text>

        <Text style={styles.description}>{description}</Text>

        {hasOwnerDetails ? (
          <View style={styles.ownerCard}>
            <Text style={styles.ownerSectionTitle}>Người đăng tour</Text>
            <View style={styles.ownerRow}>
              {ownerInfo.ownerPhoto ? (
                <Image source={{ uri: ownerInfo.ownerPhoto }} style={styles.ownerAvatar} />
              ) : (
                <View style={styles.ownerAvatarFallback}>
                  <Text style={styles.ownerAvatarText}>{ownerInitials}</Text>
                </View>
              )}
              <View style={styles.ownerInfoBlock}>
                <Text style={styles.ownerName}>{ownerDisplayName}</Text>
                {ownerInfo.ownerEmail ? (
                  <Text style={styles.ownerEmail}>{ownerInfo.ownerEmail}</Text>
                ) : null}
                {ownerInfo.ownerRole ? (
                  <Text style={styles.ownerRole}>{ownerInfo.ownerRole}</Text>
                ) : null}
              </View>
              {ownerInfo.ownerId && !viewerIsOwner ? (
                <TouchableOpacity
                  style={[styles.chatButton, (startingChat) && styles.chatButtonDisabled]}
                  onPress={handleChatWithOwner}
                  disabled={startingChat}
                >
                  {startingChat ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
            <Text style={styles.ownerHint}>
              {ownerLoading
                ? "Đang cập nhật thông tin người đăng..."
                : viewerIsOwner
                ? "Bạn là người đăng tour này."
                : "Trao đổi trực tiếp để hỏi thêm chi tiết hoặc yêu cầu đặc biệt."}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.button}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "./book-tour",
              params: {
                id: tourId,
                name,
                location,
                price,
                image,
                rating,
                startDate,
                description,
                ownerId: ownerInfo.ownerId ?? undefined,
                ownerName: ownerInfo.ownerName ?? undefined,
                ownerEmail: ownerInfo.ownerEmail ?? undefined,
                ownerPhoto: ownerInfo.ownerPhoto ?? undefined,
                ownerRole: ownerInfo.ownerRole ?? undefined,
              },
            })
          }
        >
          <Ionicons name="card-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Book Tour</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  topBar: {
    position: "absolute",
    top: 40,
    left: 20,
    right: 20,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topBarButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 20,
  },
  image: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  location: {
    fontSize: 15,
    color: "#4B5563",
    marginLeft: 6,
  },
  startDate: {
    fontSize: 15,
    color: "#2563EB",
    marginLeft: 6,
  },
  rating: {
    fontSize: 15,
    color: "#F59E0B",
    marginLeft: 6,
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563EB",
    marginTop: 10,
  },
  description: {
    fontSize: 15,
    color: "#374151",
    marginTop: 14,
    lineHeight: 22,
  },
  ownerCard: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  ownerSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  ownerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  ownerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  ownerAvatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  ownerAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4B5563",
  },
  ownerInfoBlock: {
    flex: 1,
  },
  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  ownerEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 2,
  },
  ownerRole: {
    fontSize: 13,
    color: "#2563EB",
    marginTop: 2,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  chatButtonDisabled: {
    opacity: 0.6,
  },
  chatButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  ownerHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#6B7280",
  },
  button: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#2563EB",
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 6,
  },
});
