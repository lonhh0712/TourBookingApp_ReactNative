// app/_layout.tsx
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Màn hình khởi động (nếu có) */}
      <Stack.Screen name="index" />

      {/* Nhóm đăng nhập/đăng ký */}
      <Stack.Screen name="(auth)" />

      {/* Nhóm chính có thanh Tab */}
      <Stack.Screen name="(tabs)" />

      {/* Màn hình chỉnh sửa hồ sơ (nằm ngoài tab, tab bar sẽ ẩn) */}
      <Stack.Screen
        name="edit-profile"
        options={{
          presentation: "card", // hiệu ứng trượt như iOS
          animation: "slide_from_right",
        }}
      />
    </Stack>
  );
}
