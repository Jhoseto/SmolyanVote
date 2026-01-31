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
import { ScreenBackground } from '../../components/common/ScreenBackground';
import { GlassHeader } from '../../components/common/GlassHeader';
import { useTranslation } from '../../hooks/useTranslation';

type NavigationProp = NativeStackNavigationProp<ProfileStackParamList>;

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, setUser } = useAuthStore();
  const { setLoading } = useUIStore();
  const { t } = useTranslation();

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
      quality: 0.8 as any,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert(t('common.error'), t('profile.selectImageError'));
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
      Alert.alert(t('common.info'), t('profile.noChangesAlert'));
      return;
    }

    setIsSaving(true);
    setLoading(true, t('profile.savingAlert'));

    try {
      const response = await profileService.updateProfile({
        profileImage: selectedImage || undefined,
        bio: hasBioChange ? bio.trim() : undefined,
      });

      if (response.success && response.user) {
        // Update user in store
        setUser(response.user);

        Alert.alert(t('common.success'), t('profile.successAlert'), [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert(t('common.error'), response.error || t('profile.errorAlert'));
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert(t('common.error'), error.message || t('profile.errorAlert'));
    } finally {
      setIsSaving(false);
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ScreenBackground>
        <View style={styles.container}>
          <Text style={styles.errorText}>{t('profile.errorNoUser')}</Text>
        </View>
      </ScreenBackground>
    );
  }

  const displayImage = selectedImage ? { uri: selectedImage.uri } : (user.imageUrl ? { uri: user.imageUrl } : null);

  return (
    <ScreenBackground>
      <GlassHeader
        title={t('profile.editProfile')}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={Colors.gold[400]} />
            ) : (
              <Text style={styles.saveButtonText}>{t('profile.saveButton')}</Text>
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
          <Text style={styles.imageHint}>{t('profile.tapToChange')}</Text>
        </View>

        {/* Bio Section */}
        <View style={styles.bioSection}>
          <Text style={styles.label}>{t('profile.bioLabel')}</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder={t('profile.bioPlaceholder')}
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>
        </View>
      </ScrollView>
    </ScreenBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: -Spacing.md, // Pull up closer to header
  },
  saveButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(250, 204, 21, 0.2)', // Glassy gold
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.5)',
  },
  saveButtonText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gold[400],
    fontWeight: Typography.fontWeight.bold,
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
    borderColor: Colors.gold[400],
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.green[600],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.gold[400],
    elevation: 4,
  },
  imageHint: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  bioSection: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gold[400],
    marginBottom: Spacing.sm,
  },
  bioInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.base,
    color: '#ffffff',
    minHeight: 120,
    maxHeight: 200,
  },
  charCount: {
    fontSize: Typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  errorText: {
    color: Colors.semantic.error,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});

