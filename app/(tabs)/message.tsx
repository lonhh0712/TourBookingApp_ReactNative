import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
    where,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import {
    auth,
    createOrGetConversation,
    db,
    getAllUsers,
    getUserProfile,
    sendConversationMessage,
    type ConversationParticipantProfile,
    type ConversationRecord,
    type PublicUserRecord,
} from "../../backend/firebaseService";

interface MessageItem {
  id: string;
  text: string;
  senderId: string;
  createdAt?: Date | null;
}

const resolveParamValue = (value?: string | string[] | null) =>
  Array.isArray(value) ? value[0] : value ?? null;

type MessageParams = {
  conversationId?: string | string[];
  tourId?: string | string[];
  tourName?: string | string[];
  tourLocation?: string | string[];
  tourStartDate?: string | string[];
  tourImage?: string | string[];
};

export default function MessageScreen() {
  const params = useLocalSearchParams<MessageParams>();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [userProfile, setUserProfile] = useState<PublicUserRecord | null>(null);
  const [conversations, setConversations] = useState<ConversationRecord[]>([]);
  const [conversationLoading, setConversationLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [availablePartners, setAvailablePartners] = useState<PublicUserRecord[]>([]);
  const [partnersLoading, setPartnersLoading] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const messagesListRef = useRef<FlatList<MessageItem>>(null);
  const requestedConversationId = useMemo(
    () => resolveParamValue(params.conversationId),
    [params.conversationId]
  );

  const tourContext = useMemo(() => {
    return {
      conversationId: requestedConversationId,
      tourId: resolveParamValue(params.tourId),
      tourName: resolveParamValue(params.tourName),
      tourLocation: resolveParamValue(params.tourLocation),
      tourStartDate: resolveParamValue(params.tourStartDate),
      tourImage: resolveParamValue(params.tourImage),
    };
  }, [params.tourId, params.tourImage, params.tourLocation, params.tourName, params.tourStartDate, requestedConversationId]);

  const formattedTourStartDate = useMemo(() => {
    if (!tourContext.tourStartDate) return null;
    const parsed = new Date(tourContext.tourStartDate);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.toLocaleDateString("vi-VN");
  }, [tourContext.tourStartDate]);

  const showTourContextCard = Boolean(
    tourContext.conversationId &&
      tourContext.conversationId === selectedConversationId &&
      (tourContext.tourName || tourContext.tourId)
  );

  useFocusEffect(
    useCallback(() => {
      if (requestedConversationId) {
        setSelectedConversationId(requestedConversationId);
      }
    }, [requestedConversationId])
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        loadUserProfile(user.uid).catch((error) =>
          console.error("loadUserProfile failed", error)
        );
      } else {
        setUserProfile(null);
        setConversations([]);
        setSelectedConversationId(null);
        setMessages([]);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = useCallback(async (uid: string) => {
    try {
      const snapshot = await getUserProfile(uid);
      if (snapshot) {
        setUserProfile({ uid, ...(snapshot as Record<string, unknown>) });
      } else {
        setUserProfile({ uid });
      }
    } catch (error) {
      console.error("Failed to load user profile", error);
    }
  }, []);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setConversationLoading(false);
      return;
    }

    const conversationsRef = collection(db, "conversations");
    const conversationsQuery = query(
      conversationsRef,
      where("participants", "array-contains", firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        const data: ConversationRecord[] = snapshot.docs
          .map((docSnapshot) => {
            const payload = docSnapshot.data() as ConversationRecord & {
              updatedAt?: { toDate?: () => Date } | null;
              createdAt?: { toDate?: () => Date } | null;
            };
            const updatedAt = payload.updatedAt && "toDate" in payload.updatedAt
              ? payload.updatedAt.toDate?.()
              : null;

            return {
              ...payload,
              id: docSnapshot.id,
              updatedAt,
            } as ConversationRecord & { updatedAt?: Date | null };
          })
          .sort((a, b) => {
            const aTime = (a as any).updatedAt?.getTime?.() ?? 0;
            const bTime = (b as any).updatedAt?.getTime?.() ?? 0;
            return bTime - aTime;
          });

        setConversations(data);
        setConversationLoading(false);
        setSelectedConversationId((prev) => prev ?? data[0]?.id ?? null);
      },
      (error) => {
        console.error("listen conversations failed", error);
        setConversationLoading(false);
      }
    );

    return unsubscribe;
  }, [firebaseUser?.uid]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    setMessagesLoading(true);
    const messagesRef = collection(db, `conversations/${selectedConversationId}/messages`);
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const chatMessages: MessageItem[] = snapshot.docs.map((docSnapshot) => {
          const payload = docSnapshot.data() as {
            senderId?: string;
            text?: string;
            createdAt?: { toDate?: () => Date } | null;
          };
          const createdAt = payload.createdAt && "toDate" in payload.createdAt
            ? payload.createdAt.toDate?.()
            : null;

          return {
            id: docSnapshot.id,
            senderId: payload.senderId ?? "",
            text: payload.text ?? "",
            createdAt,
          };
        });

        setMessages(chatMessages);
        setMessagesLoading(false);
        requestAnimationFrame(() => {
          messagesListRef.current?.scrollToEnd({ animated: true });
        });
      },
      (error) => {
        console.error("listen messages failed", error);
        setMessagesLoading(false);
      }
    );

    return unsubscribe;
  }, [selectedConversationId]);

  const formatRelativeTime = useCallback((value?: Date | null) => {
    if (!value) return "";
    const now = new Date().getTime();
    const diffMinutes = Math.floor((now - value.getTime()) / 60000);
    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Hôm qua";
    return value.toLocaleDateString("vi-VN");
  }, []);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const otherParticipant = useMemo(() => {
    if (!activeConversation || !firebaseUser?.uid) return null;
    const partnerId = activeConversation.participants?.find((uid) => uid !== firebaseUser.uid);
    if (!partnerId) return null;
    const profile = activeConversation.participantProfiles?.[partnerId];
    return {
      uid: partnerId,
      displayName: profile?.displayName ?? "Người dùng",
      role: profile?.role ?? undefined,
    };
  }, [activeConversation, firebaseUser?.uid]);

  const handleSendMessage = useCallback(async () => {
    if (!firebaseUser?.uid || !selectedConversationId || !messageInput.trim()) {
      return;
    }

    try {
      setSending(true);
      await sendConversationMessage(selectedConversationId, {
        senderId: firebaseUser.uid,
        text: messageInput,
      });
      setMessageInput("");
    } catch (error) {
      console.error("sendConversationMessage failed", error);
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }, [firebaseUser?.uid, messageInput, selectedConversationId]);

  const openPartnerPicker = useCallback(() => {
    setPickerVisible(true);
    loadAvailablePartners().catch((error) =>
      console.error("loadAvailablePartners failed", error)
    );
  }, []);

  const loadAvailablePartners = useCallback(async () => {
    try {
      setPartnersLoading(true);
      const users = await getAllUsers();
      const filtered = users.filter((user) => user.uid !== firebaseUser?.uid);
      setAvailablePartners(filtered);
    } catch (error) {
      console.error("Failed to fetch partners", error);
    } finally {
      setPartnersLoading(false);
    }
  }, [firebaseUser?.uid]);

  const resolveParticipantProfile = useCallback(
    (base: PublicUserRecord | null, fallbackUser: User | null): ConversationParticipantProfile => ({
      uid: base?.uid ?? fallbackUser?.uid ?? "",
      displayName:
        (typeof base?.displayName === "string" && base.displayName.length
          ? base.displayName
          : fallbackUser?.displayName) ??
        fallbackUser?.email ??
        "Người dùng",
      photoURL:
        (typeof base?.photoURL === "string" && base.photoURL.length
          ? base.photoURL
          : fallbackUser?.photoURL) ?? null,
      role:
        (typeof base?.role === "string" && base.role.length ? base.role : undefined) ??
        "user",
    }),
    []
  );

  const handleStartConversation = useCallback(
    async (partner: PublicUserRecord) => {
      if (!firebaseUser || !firebaseUser.uid) {
        Alert.alert("Cần đăng nhập", "Vui lòng đăng nhập để trò chuyện.");
        return;
      }

      const currentProfile = resolveParticipantProfile(userProfile, firebaseUser);
      const partnerProfile: ConversationParticipantProfile = {
        uid: partner.uid,
        displayName:
          (typeof partner.displayName === "string" && partner.displayName.length
            ? partner.displayName
            : typeof partner.email === "string"
            ? partner.email
            : "Người dùng"),
        photoURL:
          (typeof partner.photoURL === "string" && partner.photoURL.length
            ? partner.photoURL
            : null),
        role:
          (typeof partner.role === "string" && partner.role.length ? partner.role : undefined) ??
          undefined,
      };

      if (!currentProfile.uid || !partnerProfile.uid) {
        Alert.alert("Lỗi", "Thiếu thông tin người dùng.");
        return;
      }

      try {
        setStartingChat(true);
        const conversationRef = await createOrGetConversation(currentProfile, partnerProfile);
        setPickerVisible(false);
        setSelectedConversationId(conversationRef.id);
      } catch (error) {
        console.error("createOrGetConversation failed", error);
        Alert.alert("Lỗi", "Không thể tạo cuộc trò chuyện mới.");
      } finally {
        setStartingChat(false);
      }
    },
    [firebaseUser, resolveParticipantProfile, userProfile]
  );

  const renderConversationItem = useCallback(
    ({ item }: { item: ConversationRecord }) => {
      const partnerId = item.participants?.find((uid) => uid !== firebaseUser?.uid);
      const profile = partnerId ? item.participantProfiles?.[partnerId] : undefined;
      const name = profile?.displayName ?? (partnerId ? "Người dùng" : "Bạn");
      const preview = item.lastMessage ? `${item.lastMessage}` : "Chưa có tin nhắn";
      const isActive = item.id === selectedConversationId;

      return (
        <TouchableOpacity
          style={[styles.conversationItem, isActive && styles.conversationItemActive]}
          onPress={() => setSelectedConversationId(item.id)}
        >
          <View style={styles.conversationTextGroup}>
            <Text style={styles.conversationTitle}>{name}</Text>
            <Text style={styles.conversationPreview} numberOfLines={1}>
              {preview}
            </Text>
          </View>
          <Text style={styles.conversationTime}>
            {formatRelativeTime((item as any).updatedAt ?? null)}
          </Text>
        </TouchableOpacity>
      );
    },
    [firebaseUser?.uid, formatRelativeTime, selectedConversationId]
  );

  const renderMessageItem = useCallback(
    ({ item }: { item: MessageItem }) => {
      const isMine = item.senderId === firebaseUser?.uid;
      return (
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
          ]}
        >
          <Text style={isMine ? styles.messageTextMine : styles.messageTextOther}>{item.text}</Text>
          <Text style={isMine ? styles.messageTimestampMine : styles.messageTimestampOther}>
            {item.createdAt ? item.createdAt.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : ""}
          </Text>
        </View>
      );
    },
    [firebaseUser?.uid]
  );

  if (!firebaseUser) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.infoText}>Vui lòng đăng nhập để trò chuyện với nhà cung cấp tour.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Tin nhắn</Text>
        <TouchableOpacity style={styles.newChatButton} onPress={openPartnerPicker}>
          <Ionicons name="chatbubble-ellipses-outline" size={18} color="#2563EB" />
          <Text style={styles.newChatText}>Cuộc trò chuyện mới</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.conversationCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Danh sách cuộc trò chuyện</Text>
          {conversationLoading ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : null}
        </View>
        {conversationLoading ? null : conversations.length ? (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderConversationItem}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            style={styles.conversationList}
          />
        ) : (
          <Text style={styles.infoText}>Bạn chưa có cuộc trò chuyện nào. Hãy bắt đầu trò chuyện!</Text>
        )}
      </View>

      <View style={styles.chatCard}>
        {activeConversation ? (
          <>
            {showTourContextCard ? (
              <View style={styles.tourContextCard}>
                {tourContext.tourImage ? (
                  <Image source={{ uri: tourContext.tourImage }} style={styles.tourContextImage} />
                ) : (
                  <View style={styles.tourContextFallback}>
                    <Ionicons name="image" size={20} color="#6B7280" />
                  </View>
                )}
                <View style={styles.tourContextInfo}>
                  <Text style={styles.tourContextTitle} numberOfLines={1}>
                    {tourContext.tourName ?? "Tour chưa đặt tên"}
                  </Text>
                  {tourContext.tourLocation ? (
                    <Text style={styles.tourContextMeta} numberOfLines={1}>
                      {tourContext.tourLocation}
                    </Text>
                  ) : null}
                  {formattedTourStartDate ? (
                    <Text style={styles.tourContextMeta}>Khởi hành: {formattedTourStartDate}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}
            <View style={styles.chatHeader}>
              <View>
                <Text style={styles.chatPartner}>{otherParticipant?.displayName || "Người dùng"}</Text>
                {otherParticipant?.role ? (
                  <Text style={styles.chatPartnerRole}>{otherParticipant.role}</Text>
                ) : null}
              </View>
            </View>

            {messagesLoading ? (
              <View style={styles.messagesLoading}>
                <ActivityIndicator size="large" color="#2563EB" />
              </View>
            ) : (
              <FlatList
                ref={messagesListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessageItem}
                contentContainerStyle={styles.messagesList}
              />
            )}

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
            >
              <View style={styles.messageInputRow}>
                <TextInput
                  style={styles.messageInput}
                  placeholder="Nhập tin nhắn..."
                  placeholderTextColor="#9CA3AF"
                  value={messageInput}
                  onChangeText={setMessageInput}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendButton, (!messageInput.trim() || sending) && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </>
        ) : (
          <View style={styles.emptyChatState}>
            <Ionicons name="chatbubble-outline" size={42} color="#9CA3AF" />
            <Text style={styles.infoText}>Hãy chọn hoặc tạo cuộc trò chuyện để bắt đầu chat.</Text>
          </View>
        )}
      </View>

      <Modal
        animationType="slide"
        visible={pickerVisible}
        onRequestClose={() => setPickerVisible(false)}
        transparent
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn đối tác trò chuyện</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)}>
                <Ionicons name="close" size={20} color="#111" />
              </TouchableOpacity>
            </View>

            {partnersLoading ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.infoText}>Đang tải danh sách người dùng...</Text>
              </View>
            ) : (
              <FlatList
                data={availablePartners}
                keyExtractor={(item) => item.uid}
                ListEmptyComponent={
                  <Text style={styles.infoText}>Chưa có đối tác nào để chat.</Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.partnerItem}
                    onPress={() => handleStartConversation(item)}
                    disabled={startingChat}
                  >
                    <View style={styles.partnerAvatar}>
                      <Ionicons name="person-circle-outline" size={26} color="#6B7280" />
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.partnerName}>
                        {(typeof item.displayName === "string" && item.displayName.length
                          ? item.displayName
                          : item.email) || "Người dùng"}
                      </Text>
                      {item.role ? (
                        <Text style={styles.partnerRole}>{item.role}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60, paddingHorizontal: 20 },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#111827" },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  newChatText: {
    fontSize: 14,
    color: "#2563EB",
    fontWeight: "600",
  },
  conversationCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  conversationList: {
    maxHeight: 240,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  conversationItemActive: {
    backgroundColor: "#E0E7FF",
    borderRadius: 12,
    padding: 10,
  },
  conversationTextGroup: { flex: 1, paddingRight: 10 },
  conversationTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  conversationPreview: { fontSize: 13, color: "#6B7280", marginTop: 4 },
  conversationTime: { fontSize: 12, color: "#9CA3AF" },
  divider: { height: 12 },
  chatCard: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
  },
  tourContextCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  tourContextImage: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  tourContextFallback: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  tourContextInfo: {
    flex: 1,
  },
  tourContextTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  tourContextMeta: {
    fontSize: 13,
    color: "#6B7280",
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  chatPartner: { fontSize: 18, fontWeight: "700", color: "#111827" },
  chatPartnerRole: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  messagesLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  messagesList: {
    paddingBottom: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  messageBubbleMine: {
    backgroundColor: "#2563EB",
    alignSelf: "flex-end",
  },
  messageBubbleOther: {
    backgroundColor: "#E5E7EB",
  },
  messageTextMine: { color: "#fff", fontSize: 15 },
  messageTextOther: { color: "#111827", fontSize: 15 },
  messageTimestampMine: {
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
    textAlign: "right",
  },
  messageTimestampOther: {
    fontSize: 11,
    color: "#4B5563",
    marginTop: 4,
    textAlign: "right",
  },
  messageInputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  messageInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  emptyChatState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  infoText: { fontSize: 14, color: "#6B7280", textAlign: "center" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalLoading: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 20,
  },
  partnerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  partnerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  partnerRole: { fontSize: 13, color: "#6B7280" },
});
