// app/CreateDeviceModal.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface CreateDeviceModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateDevice: (data: any) => Promise<{ success: boolean; errors?: any }>;
}

export default function CreateDeviceModal({ 
  visible, 
  onClose, 
  onCreateDevice 
}: CreateDeviceModalProps) {
  const [formData, setFormData] = useState({
    displayName: "",
    loginId: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    loginId?: string;
    password?: string;
  }>({});

  const handleSubmit = async () => {
    // Clear previous errors
    setErrors({});
    setLoading(true);
    
    const result = await onCreateDevice(formData);
    setLoading(false);

    if (result.success) {
      setFormData({ displayName: "", loginId: "", password: "" });
      onClose();
    } else if (result.errors) {
      // Map backend errors to form fields
      const newErrors: any = {};
      
      if (result.errors.DisplayName) {
        newErrors.displayName = result.errors.DisplayName[0];
      }
      if (result.errors.LoginId) {
        newErrors.loginId = result.errors.LoginId[0];
      }
      if (result.errors.Password) {
        newErrors.password = result.errors.Password[0];
      }
      
      setErrors(newErrors);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Device</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Display Name *</Text>
              <TextInput
                style={[styles.modalInput, errors.displayName && styles.inputError]}
                value={formData.displayName}
                onChangeText={(text) => {
                  setFormData({ ...formData, displayName: text });
                  if (errors.displayName) setErrors({ ...errors, displayName: undefined });
                }}
                placeholder="Enter display name"
              />
              {errors.displayName && (
                <Text style={styles.errorText}>{errors.displayName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Login ID *</Text>
              <TextInput
                style={[styles.modalInput, errors.loginId && styles.inputError]}
                value={formData.loginId}
                onChangeText={(text) => {
                  setFormData({ ...formData, loginId: text });
                  if (errors.loginId) setErrors({ ...errors, loginId: undefined });
                }}
                placeholder="Enter login ID"
              />
              {errors.loginId && (
                <Text style={styles.errorText}>{errors.loginId}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password *</Text>
              <TextInput
                style={[styles.modalInput, errors.password && styles.inputError]}
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                placeholder="Enter password"
                secureTextEntry
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={onClose}
                disabled={loading}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "90%",
    maxWidth: 400,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: "#1E3A8A",
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: "#475569",
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputError: {
    borderColor: "#EF4444",
    borderWidth: 1,
  },
  errorText: {
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    color: "#EF4444",
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelBtnText: {
    color: "#64748B",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: "#1E3A8A",
  },
  saveBtnText: {
    color: "#FFF",
    fontFamily: "Poppins_600SemiBold",
    fontSize: 14,
  },
});