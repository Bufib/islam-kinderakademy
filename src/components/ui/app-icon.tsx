import { AndroidSymbol, SFSymbol, SymbolView } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";

export type AppIconName =
  | "home"
  | "journeys"
  | "calendar"
  | "pass"
  | "profile"
  | "children"
  | "messages"
  | "dashboard"
  | "curriculum"
  | "lessons"
  | "groups"
  | "media"
  | "add"
  | "arrow"
  | "chevron"
  | "more"
  | "play"
  | "video"
  | "check"
  | "lock"
  | "settings"
  | "menu"
  | "close"
  | "clock"
  | "trophy"
  | "bell"
  | "edit"
  | "delete"
  | "download"
  | "external"
  | "refresh";

type PlatformIcon = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
};

const iconNames: Record<AppIconName, PlatformIcon> = {
  home: { ios: "house.fill", android: "home", web: "home" },
  journeys: {
    ios: "books.vertical.fill",
    android: "auto_stories",
    web: "auto_stories",
  },
  calendar: {
    ios: "calendar",
    android: "calendar_month",
    web: "calendar_month",
  },
  pass: {
    ios: "medal.fill",
    android: "workspace_premium",
    web: "workspace_premium",
  },
  profile: { ios: "person.crop.circle.fill", android: "person", web: "person" },
  children: {
    ios: "figure.2.and.child.holdinghands",
    android: "family_restroom",
    web: "family_restroom",
  },
  messages: {
    ios: "bell.fill",
    android: "notifications",
    web: "notifications",
  },
  dashboard: {
    ios: "square.grid.2x2.fill",
    android: "dashboard",
    web: "dashboard",
  },
  curriculum: {
    ios: "point.3.connected.trianglepath.dotted",
    android: "account_tree",
    web: "account_tree",
  },
  lessons: {
    ios: "doc.text.fill",
    android: "library_books",
    web: "library_books",
  },
  groups: { ios: "person.3.fill", android: "groups", web: "groups" },
  media: {
    ios: "photo.on.rectangle.angled",
    android: "perm_media",
    web: "perm_media",
  },
  add: { ios: "plus", android: "add", web: "add" },
  arrow: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  chevron: {
    ios: "chevron.right",
    android: "chevron_right",
    web: "chevron_right",
  },
  more: { ios: "ellipsis", android: "more_horiz", web: "more_horiz" },
  play: { ios: "play.fill", android: "play_arrow", web: "play_arrow" },
  video: {
    ios: "video.fill",
    android: "video_camera_front",
    web: "video_camera_front",
  },
  check: {
    ios: "checkmark.circle.fill",
    android: "check_circle",
    web: "check_circle",
  },
  lock: { ios: "lock.fill", android: "lock", web: "lock" },
  settings: { ios: "gearshape.fill", android: "settings", web: "settings" },
  menu: { ios: "line.3.horizontal", android: "menu", web: "menu" },
  close: { ios: "xmark", android: "close", web: "close" },
  clock: { ios: "clock.fill", android: "schedule", web: "schedule" },
  trophy: { ios: "trophy.fill", android: "trophy", web: "trophy" },
  bell: { ios: "bell.fill", android: "notifications", web: "notifications" },
  edit: { ios: "pencil", android: "edit", web: "edit" },
  delete: { ios: "trash.fill", android: "delete", web: "delete" },
  download: {
    ios: "arrow.down.circle.fill",
    android: "download",
    web: "download",
  },
  external: {
    ios: "arrow.up.right.square",
    android: "open_in_new",
    web: "open_in_new",
  },
  refresh: { ios: "arrow.clockwise", android: "refresh", web: "refresh" },
};

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({
  name,
  size = 22,
  color = "#173D3A",
  style,
}: AppIconProps) {
  return (
    <SymbolView
      name={iconNames[name]}
      size={size}
      tintColor={color}
      weight="semibold"
      style={style}
    />
  );
}
