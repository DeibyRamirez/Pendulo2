'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import MisReservaciones from '@/components/MisReservaciones';

export default function MisReservasPage() {
  return (
    <ProtectedRoute requiredRole="Estudiante">
      <main className="min-h-screen bg-background">
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.12),_transparent_45%)]" />
        </div>
        <div className="py-10 sm:py-12">
          <div className="max-w-7xl mx-auto">
            <MisReservaciones />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
