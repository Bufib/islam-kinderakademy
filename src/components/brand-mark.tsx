import { Image } from "expo-image";
import {
  ImageStyle,
  StyleProp,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { Layout } from "@/constants/design";

type BrandMarkProps = {
  dark?: boolean;
  style?: StyleProp<ImageStyle>;
};

const lightLogoAspectRatio = 1448 / 1086;
const darkLogoAspectRatio = 1536 / 1024;

export function BrandMark({
  dark = false,
  style,
}: BrandMarkProps) {
  const { width } = useWindowDimensions();
  const phone = width < Layout.compactBreakpoint;
  const tablet = width < Layout.desktopBreakpoint;

  const logoWidth = phone ? 64 : tablet ? 80 : 110;
  

  return (  
    <Image
      accessible
      accessibilityLabel="Islam-Kinderakademie"
      cachePolicy="memory-disk"
      contentFit="contain"
      source={
        dark
          ? require("@/assets/images/logo-dark.png")
          : require("@/assets/images/logo.png")
      }
      style={[
        styles.logo,
        {
          width: logoWidth,
          aspectRatio: dark ? darkLogoAspectRatio : lightLogoAspectRatio,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  logo: {
    flexShrink: 0,
  },
});
