"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/shared/loading-spinner";

interface QueryStateProps {
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  children: ReactNode;
  loadingFallback?: ReactNode;
}

export function QueryState({
  isLoading,
  isError,
  errorMessage,
  onRetry,
  children,
  loadingFallback,
}: QueryStateProps) {
  if (isLoading) {
    return <>{loadingFallback ?? <PageLoading />}</>;
  }

  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-4 py-16 text-center"
        role="alert"
        aria-live="polite"
      >
        <p className="font-medium text-destructive">Impossible de charger les données</p>
        {errorMessage ? (
          <p className="max-w-md text-sm text-muted-foreground">{errorMessage}</p>
        ) : null}
        {onRetry ? (
          <Button type="button" variant="outline" onClick={() => onRetry()}>
            Réessayer
          </Button>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
