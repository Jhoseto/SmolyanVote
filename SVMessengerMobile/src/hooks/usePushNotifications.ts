/**
 * usePushNotifications Hook
 * Hook за управление на push notifications
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { pushNotificationService } from '../services/notifications/pushNotificationService';
import { Platform, AppState, DeviceEventEmitter } from 'react-native';
import { useConversationsStore } from '../store/conversationsStore';
import { useMessagesStore } from '../store/messagesStore';
import { useCallsStore } from '../store/callsStore';
import { CallState } from '../types/call';
import { svMobileWebSocketService } from '../services/websocket/stompClient';
import { debounce } from '../utils/constants';
import { soundService } from '../services/sounds/soundService';
import apiClient from '../services/api/client';
import { API_CONFIG } from '../config/api';
import { CommonActions } from '@react-navigation/native';
import { navigationRef } from '../navigation/navigationRef';
import { useCalls } from './useCalls';
import { logger } from '../utils/logger';

export const usePushNotifications = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { fetchConversations } = useConversationsStore();
  const { fetchMessages } = useMessagesStore();
  const { startCall, setCallState, currentCall } = useCallsStore();
  const { answerCall, rejectCall } = useCalls();
  
  // Оптимизация: Debounced refresh за conversations (избягва излишни API calls)
  const debouncedRefreshConversations = useRef(
    debounce(() => {
      fetchConversations();
    }, 500) // 500ms debounce
  ).current;

  // Оптимизация: Debounced fetch за messages (избягва излишни API calls)
  const debouncedFetchMessages = useRef(
    debounce((conversationId: number) => {
      fetchMessages(conversationId);
    }, 300) // 300ms debounce
  ).current;

  // Heartbeat (disabled – WebSocket се грижи за online статус; избягваме излишни 401)
  useEffect(() => {
    return () => {};
  }, [isAuthenticated]);

  /**
   * Handle notification received
   * ВИНАГИ fetch-ваме съобщенията за конкретния conversation когато се получи notification
   * Това гарантира че съобщенията се виждат дори ако WebSocket не работи правилно
   */
  const handleNotificationReceived = useCallback(
    (notification: any) => {
      const data = notification.data || notification;

      const isAppInForeground = AppState.currentState === 'active';
      const conversationId = data?.conversationId ? Number(data.conversationId) : null;

      const notificationType = data?.type;
      
      // ✅ Обработка на INCOMING_CALL notifications (foreground)
      if (notificationType === 'INCOMING_CALL' && conversationId) {

        // Опитай да намериш участника от store / API
        const { getConversation, conversations } = useConversationsStore.getState();
        const findParticipant = async () => {
          const existing = conversations.find((c) => c.id === conversationId);
          if (existing?.participant) return existing.participant;
          try {
            const conv = await getConversation(conversationId);
            return conv?.participant;
          } catch {
            return undefined;
          }
        };

        findParticipant().then((participant) => {
          const participantId = participant?.id ?? 0;
          const participantName = data.callerName || participant?.fullName || participant?.username || 'Неизвестен потребител';
          const participantImageUrl = participant?.imageUrl;

          // Стартирай входящ разговор локално (UI + звук)
          startCall(
            conversationId,
            participantId,
            participantName,
            participantImageUrl,
            CallState.INCOMING
          );
          setCallState(CallState.INCOMING);
          soundService.playIncomingCallSound();

          // Refresh за актуални данни
          debouncedRefreshConversations();
        });
      }
      // ✅ Обработка на NEW_MESSAGE notifications
      else if (notificationType === 'NEW_MESSAGE' && conversationId) {
        // ✅ ВИНАГИ fetch-ваме съобщенията за конкретния conversation (с debounce)
        // Това гарантира че съобщенията се виждат дори ако WebSocket не работи правилно
        debouncedFetchMessages(conversationId);
        
        // Update conversation from backend (за да вземем correct unread count)
        // Използваме debounce за да избегнем излишни заявки
        debouncedRefreshConversations();
      } else if (conversationId) {
        // Fallback: ако има conversationId но няма type, fetch-ваме latest data from backend
        debouncedFetchMessages(conversationId);
        debouncedRefreshConversations();
      }

      // ВИНАГИ fetch-ваме съобщенията за да се виждат в реално време
      // Firebase автоматично показва notification дори когато app-ът е в foreground
    },
    [debouncedRefreshConversations, debouncedFetchMessages]
  );

  /**
   * Handle notification opened
   * Когато app-ът се отвори от notification (затворен или в background)
   * Оптимизирано като Facebook Messenger - автоматично навигира към правилния conversation
   */
  const handleNotificationOpened = useCallback(
    async (notification: any) => {
      const data = notification.data || notification;

      // Изчакай малко за да се инициализира navigation
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate based on notification type
      if (data?.conversationId) {
        const conversationId = Number(data.conversationId);
        const notificationType = data?.type;
        
        if (notificationType === 'INCOMING_CALL') {
          // Намери conversation за да вземем participant информация
          await fetchConversations();

          // Вземи актуализираните conversations / ако липсват – fetch по id
          const { conversations, getConversation } = useConversationsStore.getState();
          let participant = conversations.find((c) => c.id === conversationId)?.participant;
          if (!participant) {
            const conv = await getConversation(conversationId).catch(() => null);
            participant = conv?.participant;
          }
          
          const participantId = participant?.id ?? 0;
          const participantName = data.callerName || participant?.fullName || participant?.username || 'Неизвестен потребител';
          const participantImageUrl = participant?.imageUrl;

          // Стартирай incoming call от notification data (дори ако липсва participant, показваме име)
          startCall(
            conversationId,
            participantId,
            participantName,
            participantImageUrl,
            CallState.INCOMING
          );
          setCallState(CallState.INCOMING);
          soundService.playIncomingCallSound();

          // Свържи WebSocket ако не е свързан (за да получим call signals)
          if (!svMobileWebSocketService.isConnected() && isAuthenticated && user) {
            // WebSocket will auto-connect
          }
        } else {
          // NEW_MESSAGE или друг тип - навигирай към conversation и fetch-вай messages
          
          // Fetch conversations за да имаме актуални данни
          await fetchConversations();
          
          // Вземи conversation за participant name
          const { conversations, getConversation, selectConversation } = useConversationsStore.getState();
          let conversation = conversations.find((c) => c.id === conversationId);
          if (!conversation) {
            conversation = await getConversation(conversationId).catch(() => null);
          }
          
          const participantName = conversation?.participant?.fullName || data.senderName || 'Потребител';
          
          // Select conversation в store
          selectConversation(conversationId);
          
          // Навигирай към Chat screen и изчакай навигацията да завърши
          // преди да fetch-нем messages (избягваме race condition)
          const navigateToChat = (): Promise<void> => {
            return new Promise((resolve) => {
              const MAX_RETRIES = 20; // Максимум 20 опита (10 секунди)
              const RETRY_INTERVAL = 500; // 500ms между опитите
              const MAX_WAIT_TIME = 10000; // Максимум 10 секунди общо време
              
              let retryCount = 0;
              const startTime = Date.now();
              
              const attemptNavigation = () => {
                // Проверка за максимално време
                if (Date.now() - startTime > MAX_WAIT_TIME) {
                  resolve(); // Resolve за да не блокира целия процес
                  return;
                }
                
                // Проверка за максимален брой опити
                if (retryCount >= MAX_RETRIES) {
                  resolve(); // Resolve за да не блокира целия процес
                  return;
                }
                
                if (navigationRef.isReady()) {
                  try {
                    navigationRef.dispatch(
                      CommonActions.navigate({
                        name: 'Main',
                        params: {
                          screen: 'Conversations',
                          params: {
                            screen: 'Chat',
                            params: {
                              conversationId,
                              participantName,
                            },
                          },
                        },
                      })
                    );
                    // Изчакай малко за да се инициализира Chat screen
                    setTimeout(resolve, 300);
                  } catch (error) {
                    logger.error('❌ Error navigating to conversation:', error);
                    // Resolve за да не блокира целия процес дори ако навигацията fail-не
                    resolve();
                  }
                } else {
                  retryCount++;
                  // Опитай отново след RETRY_INTERVAL
                  setTimeout(attemptNavigation, RETRY_INTERVAL);
                }
              };
              
              // Стартирай първия опит
              attemptNavigation();
            });
          };
          
          // Изчакай навигацията да завърши преди да fetch-нем messages
          await navigateToChat();
          
          // Fetch messages (с debounce) - само след като навигацията е завършила
          debouncedFetchMessages(conversationId);
          debouncedRefreshConversations();
        }
      }
    },
    [debouncedRefreshConversations, debouncedFetchMessages, startCall, setCallState, isAuthenticated, user, fetchConversations]
  );

  /**
   * Register device token when user logs in
   * Retry logic за да се справи с изтекъл token
   */
  const registerDeviceToken = useCallback(
    async (deviceToken: string, retryCount = 0): Promise<void> => {
      if (!isAuthenticated || !user) {
        return;
      }

      try {
        // Изчакваме малко, за да се уверим че token е запазен след login
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Get app version from package.json
        const appVersion = require('../../package.json').version || '0.0.1';
        
        await pushNotificationService.registerDeviceToken({
          deviceToken,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          appVersion,
        });
      } catch (error: any) {
        // Ако получим 401 или 405 (вероятно изтекъл token), опитай да refresh-неш token и retry
        if ((error?.response?.status === 401 || error?.response?.status === 405) && retryCount < 2) {
          // Изчакай малко преди retry
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Retry - interceptor-ът ще се опита да refresh-не token-а
          try {
            return await registerDeviceToken(deviceToken, retryCount + 1);
          } catch (retryError) {
            logger.error('Retry failed for device token registration:', retryError);
            // Не хвърляй грешка - non-critical операция
            return;
          }
        }
        
        logger.error('Failed to register device token:', error?.response?.status || error?.message);
        // Не хвърляй грешка - non-critical операция
      }
    },
    [isAuthenticated, user]
  );

  /**
   * Unregister device token when user logs out
   */
  const unregisterDeviceToken = useCallback(async (deviceToken: string) => {
    try {
      await pushNotificationService.unregisterDeviceToken(deviceToken);
      await pushNotificationService.deleteToken();
    } catch (error) {
      logger.error('Failed to unregister device token:', error);
    }
  }, []);

  /**
   * Request notification permissions
   */
  const requestPermissions = useCallback(async () => {
    try {
      return await pushNotificationService.requestPermissions();
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }, []);

  /**
   * Get FCM token
   */
  const getFCMToken = useCallback(async () => {
    try {
      return await pushNotificationService.getFCMToken();
    } catch (error) {
      console.error('Failed to get FCM token:', error);
      return null;
    }
  }, []);

  // Setup notification handlers on mount
  useEffect(() => {
    try {
      pushNotificationService.setupNotificationHandlers(
        handleNotificationReceived,
        handleNotificationOpened
      );
    } catch (error) {
      console.error('Error setting up notification handlers:', error);
      // Don't crash the app if notification setup fails
    }
  }, [handleNotificationReceived, handleNotificationOpened]);

  // Track previous authentication state to detect logout
  const prevIsAuthenticatedRef = useRef(isAuthenticated);

  // Request permissions and register token when authenticated
  // Unregister ONLY when user logs out (isAuthenticated changes from true to false)
  useEffect(() => {
    const wasAuthenticated = prevIsAuthenticatedRef.current;
    const isNowAuthenticated = isAuthenticated;

    if (isNowAuthenticated) {
      // User logged in - register token
      const setupNotifications = async () => {
        try {
          const hasPermission = await requestPermissions();
          if (hasPermission) {
            const token = await getFCMToken();
            if (token) {
              // Wrap in try-catch to prevent unhandled promise rejection
              await registerDeviceToken(token).catch((error) => {
                console.error('Unhandled error in registerDeviceToken:', error);
                // Error already logged in registerDeviceToken, just prevent unhandled rejection
              });
            }
          }
        } catch (error) {
          console.error('Error in setupNotifications:', error);
          // Don't throw - non-critical operation
        }
      };

      setupNotifications();
    } else if (wasAuthenticated && !isNowAuthenticated) {
      // User logged out (was authenticated, now not) - unregister token
      // Това се случва само при logout, не при всяко зареждане
      getFCMToken().then((token) => {
        if (token) {
          unregisterDeviceToken(token);
        }
      });
    }

    // Update ref for next render
    prevIsAuthenticatedRef.current = isAuthenticated;
  }, [
    isAuthenticated,
    requestPermissions,
    getFCMToken,
    registerDeviceToken,
    unregisterDeviceToken,
  ]);

  // Online status management
  // WebSocket connection е ОСНОВНИЯТ механизъм за online статус - backend автоматично обновява статуса при свързване
  // Heartbeat endpoint има проблеми с JWT authentication, затова разчитаме основно на WebSocket
  const ensureOnlineStatus = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    
    // WebSocket connection автоматично обновява online статуса когато се свърже
    // Проверяваме дали WebSocket е connected
    if (svMobileWebSocketService.isConnected()) {
      return;
    }
    
    // Ако WebSocket не е connected, опитваме се да се reconnect-нем
    // WebSocket reconnect ще обновява online статуса автоматично
    // WebSocket reconnect се случва автоматично от useWebSocket hook при app state change
  }, [isAuthenticated]);


  // Handle app state changes
  // Оптимизация: Refresh conversations само когато app става active (не при всяка промяна)
  // НЕ refresh-ваме ако има отворен чат, за да не презапишем локалните промени
  // Също така изпращаме heartbeat за да поддържаме online статус
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && isAuthenticated) {
        // Ensure online status when app becomes active
        // WebSocket connection автоматично обновява online статуса
        ensureOnlineStatus();
        
        const { selectedConversationId } = useConversationsStore.getState();
        // Refresh само ако няма отворен чат
        if (!selectedConversationId) {
        debouncedRefreshConversations();
        }
      } else if (nextAppState === 'background' || nextAppState === 'inactive') {
        // WebSocket остава активен в background за real-time нотификации
        // Backend автоматично маркира като offline след 2 минути неактивност
      }
    });

    // Ensure online status when component mounts and app is active
    if (isAuthenticated && AppState.currentState === 'active') {
      ensureOnlineStatus();
    }

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, debouncedRefreshConversations, ensureOnlineStatus]);

  // Handle incoming call actions from IncomingCallActivity (Android Full Screen Intent)
  useEffect(() => {
    if (Platform.OS !== 'android' || !isAuthenticated) {
      return;
    }

    // Listen to native events using DeviceEventEmitter
    // MainActivity emits events via RCTDeviceEventEmitter.emit() which is accessible via DeviceEventEmitter
    // 
    // CRITICAL FIX: Read currentCall from store inside the listener closure instead of capturing
    // it from the effect's dependency array. This ensures we always check the latest currentCall
    // state, not a stale value from when the listener was attached.
    // answerCall and rejectCall from useCalls() are stable references that use Zustand's get()
    // internally, so they always access the latest state. We only need to check currentCall
    // to avoid calling them when there's no call, so we read it fresh inside the listener.
    const subscription = DeviceEventEmitter.addListener('IncomingCallAction', async (event: any) => {
      // CRITICAL FIX: Destructure without default value for participantId to distinguish between
      // missing (undefined) and valid 0. The native code now always includes participantId if it
      // was provided in the intent, even if it's 0, allowing us to distinguish between:
      // - participantId === undefined: not provided in intent (should not happen in normal flow)
      // - participantId === 0: valid participant ID of 0
      // conversationId is required for call initialization, so we validate it explicitly
      const { action, conversationId, participantId } = event;
      
      // Read currentCall from store inside listener to get latest state
      // This prevents stale closure issues when currentCall updates
      // CRITICAL FIX: Use direct assignment instead of destructuring
      // getState() returns the store state object which has a currentCall property
      // Direct assignment is clearer and avoids potential destructuring issues
      let latestCurrentCall = useCallsStore.getState().currentCall;
      
      // CRITICAL FIX: If currentCall is not initialized (app launched from Full Screen Intent),
      // initialize it from the event data before processing accept/reject actions.
      // This ensures the call UI works correctly even when the app launches directly from notification.
      // CRITICAL: Validate conversationId exists and is a valid number before using it
      // CRITICAL: participantId can be undefined (not provided) or a number (including 0)
      // CRITICAL: Read fetchConversations and startCall from stores inside listener to avoid stale closures
      if (!latestCurrentCall && conversationId) {
        // CRITICAL: Validate conversationId is a valid number to prevent NaN
        // If conversationId is missing or invalid, we cannot initialize the call
        const conversationIdNum = Number(conversationId);
        if (isNaN(conversationIdNum) || conversationIdNum <= 0) {
          logger.error('❌ Invalid conversationId in IncomingCallAction:', conversationId);
          return; // Cannot initialize call without valid conversationId
        }
        
        // CRITICAL: Validate participantId if provided
        // If participantId is undefined, we'll try to get it from the conversation
        // If participantId is provided (including 0), we use it directly
        let participantIdNum: number;
        if (participantId !== undefined) {
          participantIdNum = Number(participantId);
          if (isNaN(participantIdNum)) {
            logger.error('❌ Invalid participantId in IncomingCallAction:', participantId);
            return; // Cannot initialize call with invalid participantId
          }
          // participantIdNum is valid (including 0, which is a valid ID)
        } else {
          // participantId not provided - we'll try to get it from conversation
          participantIdNum = 0; // Temporary value, will be updated from conversation
        }
        try {
          // Read functions from stores inside listener to get latest references
          // This prevents stale closure issues if function references change between renders
          const { fetchConversations: latestFetchConversations } = useConversationsStore.getState();
          const { startCall: latestStartCall } = useCallsStore.getState();
          
          // Fetch conversation to get participant details
          await latestFetchConversations();
          const { conversations, getConversation } = useConversationsStore.getState();
          let conversation = conversations.find((c) => c.id === conversationIdNum);
          if (!conversation) {
            const fetchedConversation = await getConversation(conversationIdNum).catch(() => null);
            conversation = fetchedConversation || undefined;
          }
          
          const participantName = conversation?.participant?.fullName || conversation?.participant?.username || 'Потребител';
          const participantImageUrl = conversation?.participant?.imageUrl;
          
          // Use participantId from event if provided, otherwise use from conversation
          // CRITICAL: If participantId was provided in event (including 0), use it
          // Otherwise, fall back to conversation participant ID
          const finalParticipantId = (participantId !== undefined) 
            ? participantIdNum 
            : (conversation?.participant?.id || 0);
          
          // Initialize the call in the store using latest function reference
          // CRITICAL: Use validated conversationIdNum and finalParticipantId
          latestStartCall(
            conversationIdNum,
            finalParticipantId,
            participantName,
            participantImageUrl,
            CallState.INCOMING
          );
          
          // Read the newly initialized call
          latestCurrentCall = useCallsStore.getState().currentCall;
        } catch (error) {
          logger.error('❌ Error initializing currentCall from event data:', error);
        }
      }
      
      if (action === 'accept_call') {
        if (latestCurrentCall) {
          answerCall();
        } else {
          logger.error('❌ Cannot accept call: currentCall not initialized and could not be created from event data');
        }
      } else if (action === 'reject_call') {
        // For reject, we can still process it even if currentCall wasn't initialized
        // because rejectCall() clears the call state, which is safe to call
        if (latestCurrentCall) {
          rejectCall();
        } else {
          // If no currentCall, just clear any potential call state
          const { clearCall } = useCallsStore.getState();
          clearCall();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, answerCall, rejectCall]); // Removed currentCall from deps - read it inside listener instead

  return {
    registerDeviceToken,
    unregisterDeviceToken,
    requestPermissions,
    getFCMToken,
  };
};

