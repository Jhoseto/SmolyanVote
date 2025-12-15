/**
 * Call Screen
 * Екран за активен voice call
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Avatar } from '../../components/common';
import { Colors, Typography, Spacing } from '../../theme';
import { useCalls } from '../../hooks/useCalls';
import { CallState } from '../../types/call';

export const CallScreen: React.FC = () => {
  const { currentCall, callState, isMuted, endCall, toggleMute } = useCalls();

  useEffect(() => {
    // Auto-end call if disconnected
    if (callState === CallState.DISCONNECTED) {
      setTimeout(() => {
        endCall();
      }, 2000);
    }
  }, [callState, endCall]);

  if (!currentCall) {
    return null;
  }

  const formatCallDuration = (startTime?: Date): string => {
    if (!startTime) return '00:00';
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

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
          <Text style={styles.callStatus}>
            {callState === CallState.CONNECTING && 'Свързване...'}
            {callState === CallState.CONNECTED && formatCallDuration(currentCall.startTime)}
            {callState === CallState.DISCONNECTED && 'Разговорът приключи'}
          </Text>
        </View>

        <View style={styles.controlsSection}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.controlButtonActive]}
            onPress={toggleMute}
          >
            <Text style={styles.controlButtonText}>{isMuted ? '🔇' : '🎤'}</Text>
            <Text style={styles.controlButtonLabel}>
              {isMuted ? 'Включи' : 'Изключи'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={endCall}
          >
            <Text style={styles.controlButtonText}>📞</Text>
            <Text style={styles.controlButtonLabel}>Затвори</Text>
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
  },
  controlButtonActive: {
    backgroundColor: Colors.green[500],
    borderColor: Colors.green[500],
  },
  endCallButton: {
    backgroundColor: Colors.semantic.error,
    borderColor: Colors.semantic.error,
  },
  controlButtonText: {
    fontSize: 24,
  },
  controlButtonLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
  },
});

