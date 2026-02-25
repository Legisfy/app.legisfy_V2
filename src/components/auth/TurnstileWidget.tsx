import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export interface TurnstileWidgetHandle {
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onSuccess?: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  className?: string;
}

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const w = window as any;
    if (w.turnstile) return resolve();
    const existing = document.querySelector('script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script failed to load'));
    document.head.appendChild(script);
  });
}

export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { siteKey, onSuccess, onError, onExpire, theme = 'auto', size = 'normal', className },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRenderingRef = useRef(false);

  const cleanupWidget = () => {
    const w = window as any;
    if (w.turnstile && widgetIdRef.current) {
      try {
        w.turnstile.remove(widgetIdRef.current);
      } catch (error) {
        console.warn('Failed to remove turnstile widget:', error);
      }
      widgetIdRef.current = undefined;
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
      renderTimeoutRef.current = null;
    }
    isRenderingRef.current = false;
  };

  useImperativeHandle(ref, () => ({
    reset: () => {
      const w = window as any;
      if (w.turnstile && widgetIdRef.current) {
        try {
          w.turnstile.reset(widgetIdRef.current);
        } catch (error) {
          console.warn('Failed to reset turnstile widget:', error);
          // If reset fails, try to re-render
          cleanupWidget();
          renderWidget();
        }
      }
    },
  }));

  const renderWidget = () => {
    if (isRenderingRef.current) return;
    
    const w = window as any;
    if (!containerRef.current || !w.turnstile) return;

    isRenderingRef.current = true;
    
    try {
      // Clean up any existing widget first
      cleanupWidget();
      
      widgetIdRef.current = w.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token: string) => {
          isRenderingRef.current = false;
          onSuccess?.(token);
        },
        'error-callback': () => {
          isRenderingRef.current = false;
          onError?.();
        },
        'expired-callback': () => {
          isRenderingRef.current = false;
          onExpire?.();
        },
        'timeout-callback': () => {
          isRenderingRef.current = false;
          console.warn('Turnstile widget timed out');
          onError?.();
        },
      }) as string | undefined;

      // Set a timeout to detect hung widgets
      renderTimeoutRef.current = setTimeout(() => {
        if (isRenderingRef.current) {
          console.warn('Turnstile widget appears to be hung, cleaning up');
          cleanupWidget();
          onError?.();
        }
      }, 30000); // 30 second timeout

    } catch (error) {
      console.error('Failed to render turnstile widget:', error);
      isRenderingRef.current = false;
      onError?.();
    }
  };

  useEffect(() => {
    let mounted = true;
    
    loadTurnstileScript()
      .then(() => {
        if (!mounted) return;
        renderWidget();
      })
      .catch((error) => {
        console.error('Failed to load turnstile script:', error);
        if (mounted) {
          onError?.();
        }
      });

    return () => {
      mounted = false;
      cleanupWidget();
    };
  }, [siteKey, theme, size]);

  return <div ref={containerRef} className={className} />;
});
