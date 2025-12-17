/**
 * Edit Profile Screen
 * Екран за редактиране на профил (само снимка и bio)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchImageLibrary, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { ProfileStackParamList } from '../../types/navigation';
import { Colors, Spacing, Typography } from '../../theme';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { profileService } from '../../services/profile/profileService';
import { Avatar } from '../../components/common';
import { ArrowLeftIcon, CameraIcon } from '../../components/common/Icons';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, setUser } = useAuthStore();
  const { setLoading } = useUIStore();
  
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedImage, setSelectedImage] = useState<{ uri: string; type: string; name: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.bio) {
      setBio(user.bio);
    }
  }, [user]);

  const handleSelectImage = () => {
    const options = {
      mediaType: 'photo' as MediaType,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Грешка', 'Неуспешно избиране на снимка');
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri || '',
          type: asset.type || 'image/jpeg',
          name: asset.fileName || `profile_${Date.now()}.jpg`,
        });
      }
    });
  };

  const handleSave = async () => {
    // Проверка дали има промени
    const hasImageChange = selectedImage !== null;
    const hasBioChange = bio.trim() !== (user?.bio || '');
    
    if (!hasImageChange && !hasBioChange) {
      Alert.alert('Информация', 'Няма промени за запазване');
      return;
    }

    setIsSaving(true);
    setLoading(true, 'Запазване на профила...');

    try {
      const response = await profileService.updateProfile({
        profileImage: selectedImage || undefined,
        bio: hasBioChange ? bio.trim() : undefined,
      });

      if (response.success && response.user) {
        // Update user in store
        setUser(response.user);
        
        Alert.alert('Успех', 'Профилът е обновен успешно', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Грешка', response.error || 'Неуспешно обновяване на профила');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Грешка', error.message || 'Неуспешно обновяване на профила');
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Няма данни за потребителя</Text>
      </View>
    );
  }

  const displayImage = selectedImage ? { uri: selectedImage.uri } : (user.imageUrl ? { uri: user.imageUrl } : null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeftIcon size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Редактирай профил</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
          activeOpacity={0.7}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.green[500]} />
          ) : (
            <Text style={styles.saveButtonText}>Запази</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Profile Image Section */}
      <View style={styles.imageSection}>
        <View style={styles.avatarContainer}>
          {displayImage ? (
            <Image source={displayImage} style={styles.avatarImage} />
          ) : (
            <Avatar
              imageUrl={user.imageUrl}
              name={user.fullName}
              size={120}
              isOnline={user.isOnline}
            />
          )}
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={handleSelectImage}
            activeOpacity={0.8}
          >
            <CameraIcon size={24} color={Colors.text.inverse} />
          </TouchableOpacity>
        </View>
        <Text style={styles.imageHint}>Докосни за смяна на снимката</Text>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <Text style={styles.label}>Биография</Text>
        <TextInput
          style={styles.bioInput}
          value={bio}
          onChangeText={setBio}
          placeholder="Напиши нещо за себе си..."
          placeholderTextColor={Colors.text.tertiary}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={styles.charCount}>{bio.length}/500</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.green[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.green[500],
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.green[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.background.primary,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  imageHint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  bioSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  bioInput: {
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.semantic.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

