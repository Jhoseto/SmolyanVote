/**
 * Custom hook за infinite scroll в message thread
 */

import { useEffect, useRef, useCallback } from 'react';

export const useSVInfiniteScroll = (
  conversationId,
  loadMessages,
  hasMore = true,
  isLoading = false
) => {
  const observerRef = useRef(null);
  const currentPage = useRef(0);
  
  const loadMoreMessages = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }
    
    currentPage.current += 1;
    await loadMessages(conversationId, currentPage.current);
  }, [conversationId, loadMessages, isLoading, hasMore]);
  
  const lastMessageRef = useCallback((node) => {
    if (isLoading) return;
    
    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    // Create new observer
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMessages();
      }
    });
    
    // Observe new node
    if (node) {
      observerRef.current.observe(node);
    }
  }, [isLoading, hasMore, loadMoreMessages]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  // Reset page on conversation change
  useEffect(() => {
    currentPage.current = 0;
  }, [conversationId]);
  
  return { lastMessageRef };
};
