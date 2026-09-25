'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import MisReservaciones from '@/components/MisReservaciones';

export default function MisReservasPage({ embedded = false }: { embedded?: boolean }) {
  return (
    <ProtectedRoute requiredRole="Estudiante">
      <main className={embedded ? "bg-background" : "min-h-screen bg-background"}>
        {!embedded && (
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_45%)]" />
          </div>
        )}
        <div className={embedded ? "p-4 md:p-6" : "py-10 sm:py-12"}>
          <div className="max-w-7xl mx-auto px-0 sm:px-2">
            <MisReservaciones />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
