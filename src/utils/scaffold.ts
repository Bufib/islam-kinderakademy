import { Alert, Platform } from 'react-native';

export function showScaffoldNotice(feature: string) {
  const message = `${feature} ist im Grundgerüst vorbereitet und wird mit dem Backend verbunden, sobald die Inhalte eingepflegt werden.`;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(message);
    return;
  }

  Alert.alert('Grundgerüst', message);
}

