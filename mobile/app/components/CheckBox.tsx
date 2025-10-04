import {
    Image,
    StyleSheet,
    TextInput,
    View,
    TouchableOpacity,
    Text,
    Platform,
  } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function CheckBox({ checked, onPress }: { checked: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.checkbox} onPress={onPress}>
      {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
    </TouchableOpacity>
  );
}

export default CheckBox;

const styles = StyleSheet.create({
checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});