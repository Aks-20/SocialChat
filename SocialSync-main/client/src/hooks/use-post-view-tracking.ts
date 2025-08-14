import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

interface UsePostViewTrackingOptions {
  postId: number;
  threshold?: number; // Percentage of element that needs to be visible
  delay?: number; // Delay in milliseconds before tracking view
}

export function usePostViewTracking({ 
  postId, 
  threshold = 0.5, 
  delay = 1000 
}: UsePostViewTrackingOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const trackViewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/posts/${postId}/view`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to track view');
      }
      
      return response.json();
    },
    onError: (error) => {
      console.error('View tracking error:', error);
    },
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasTracked.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
            // Clear any existing timeout
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }

            // Set a delay before tracking the view
            timeoutRef.current = setTimeout(() => {
              if (!hasTracked.current && entry.isIntersecting) {
                hasTracked.current = true;
                trackViewMutation.mutate();
              }
            }, delay);
          } else {
            // Clear timeout if element is no longer visible
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
          }
        });
      },
      {
        threshold: threshold,
        rootMargin: '0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [postId, threshold, delay, trackViewMutation]);

  return elementRef;
}