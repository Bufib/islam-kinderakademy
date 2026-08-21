import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Palette, Radius } from '@/constants/design';

type PdfReaderProps = {
  sourceUrl: string;
  title: string;
  height?: number;
  onError?: () => void;
};

export default function PdfReader({
  sourceUrl,
  height = 680,
  onError,
}: PdfReaderProps) {
  return (
    <View style={[styles.frame, { height }]}>
      <WebView
        source={{ uri: sourceUrl }}
        originWhitelist={['*']}
        style={styles.reader}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={Palette.forest} />
          </View>
        )}
        onError={() => onError?.()}
        onHttpError={() => onError?.()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Palette.line,
    borderRadius: Radius.medium,
    backgroundColor: Palette.white,
  },
  reader: {
    flex: 1,
    backgroundColor: Palette.white,
  },
  loading: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Palette.white,
  },
});
