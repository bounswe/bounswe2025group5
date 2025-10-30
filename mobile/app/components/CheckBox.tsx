import {
  Image,
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Text,
  Platform,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";

function CheckBox({
  checked,
  onPress,
}: {
  checked: boolean;
  onPress: () => void;
}) {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <TouchableOpacity
      style={[
        styles.checkbox,
        {
          borderColor: themeColors.text,
          backgroundColor: checked ? themeColors.buttonPrimary : "transparent",
        },
      ]}
      onPress={onPress}
    >
      {checked && (
        <Ionicons
          name="checkmark"
          size={16}
          color={checked ? "#fff" : themeColors.text}
        />
      )}
    </TouchableOpacity>
  );
}

export default CheckBox;

const styles = StyleSheet.create({
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
});
