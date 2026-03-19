'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import MisReservaciones from '@/components/MisReservaciones';

export default function MisReservasPage() {
  return (
    <ProtectedRoute requiredRole="estudiante">
      <main className="min-h-screen bg-gray-50">
        <div className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <MisReservaciones />
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
