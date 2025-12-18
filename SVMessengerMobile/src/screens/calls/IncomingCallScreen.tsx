/**
 * Incoming Call Screen
 * Екран за входящо обаждане
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Avatar } from '../../components/common';
import { TelephoneIcon, XMarkIcon } from '../../components/common/Icons';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';

export const IncomingCallScreen: React.FC = () => {
  const { currentCall, answerCall, rejectCall } = useCalls();

  if (!currentCall) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.participantSection}>
          <Avatar
            imageUrl={currentCall.participantImageUrl}
            name={currentCall.participantName}
            size={120}
            isOnline={true}
          />
          <Text style={styles.participantName}>{currentCall.participantName}</Text>
          <Text style={styles.callStatus}>Входящо обаждане</Text>
        </View>

        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[styles.controlButton, styles.rejectButton]}
            onPress={rejectCall}
            activeOpacity={0.8}
          >
            <XMarkIcon size={28} color={Colors.text.inverse} />
            <Text style={styles.controlButtonLabel}>Откажи</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.answerButton]}
            onPress={answerCall}
            activeOpacity={0.8}
          >
            <TelephoneIcon size={28} color={Colors.text.inverse} />
            <Text style={styles.controlButtonLabel}>Приеми</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.xl,
  },
  participantSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantName: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginTop: Spacing.lg,
  },
  callStatus: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
  },
  controlsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: Colors.background.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border.medium,
    gap: Spacing.xs,
  },
  rejectButton: {
    backgroundColor: Colors.semantic.error,
    borderColor: Colors.semantic.error,
  },
  answerButton: {
    backgroundColor: Colors.green[500],
    borderColor: Colors.green[500],
  },
  controlButtonLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
});

