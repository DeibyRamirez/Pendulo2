'use client';

import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useReservations } from '@/hooks/useReservations';
import { usePendulos } from '@/hooks/usePendulos';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';

export default function FormularioReservacion() {
  const { user } = useAuth();
  const { crearNuevaReservacion, validarHorario, error: reservaError } = useReservations(user?.uid || '');
  const { pendulosDisponibles, loading: loadingPendulos } = usePendulos();

  const [formData, setFormData] = useState({
    pendulo_id: '',
    fecha: '',
    hora_inicio: '',
    hora_final: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Actualizar hora final automáticamente (30 minutos después)
  const actualizarHoraFinal = (horaInicio: string) => {
    if (horaInicio) {
      const [hours, minutes] = horaInicio.split(':').map(Number);
      const fecha = new Date();
      fecha.setHours(hours, minutes + 30, 0);

      const horaFinal = fecha.toTimeString().slice(0, 5);
      setFormData((prev) => ({
        ...prev,
        hora_final: horaFinal,
      }));
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'hora_inicio') {
      actualizarHoraFinal(value);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Validar que todos los campos estén completos
      if (!formData.pendulo_id || !formData.fecha || !formData.hora_inicio) {
        throw new Error('Por favor completa todos los campos');
      }

      // Construir fechas completas
      const fechaInicio = new Date(`${formData.fecha}T${formData.hora_inicio}`);
      const fechaFinal = new Date(`${formData.fecha}T${formData.hora_final}`);

      // Validar que la fecha no sea en el pasado
      if (fechaInicio < new Date()) {
        throw new Error('No puedes reservar en el pasado');
      }

      // Validar conflictos de horario
      const horarioValido = await validarHorario(
        formData.pendulo_id,
        fechaInicio,
        fechaFinal
      );

      if (!horarioValido && reservaError) {
        throw new Error(reservaError);
      }

      // Crear la reservación
      if (!user) {
        throw new Error('Debes iniciar sesion para reservar');
      }

      await crearNuevaReservacion({
        usuario_id: user.uid,
        inicio_sesion_reserva: fechaInicio,
        final_sesion_reserva: fechaFinal,
        estado: 'pending',
        institucion: user.institucion || 'No especificada',
        pendulo_id: formData.pendulo_id,
      });

      setSuccess(true);
      setFormData({
        pendulo_id: '',
        fecha: '',
        hora_inicio: '',
        hora_final: '',
      });

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al crear la reservacion');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPendulos) {
    return <div className="text-center py-8">Cargando péndulos disponibles...</div>;
  }

  return (
    <Card className="w-full max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Nueva Reservación</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          ¡Reservación creada exitosamente!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Selección de Péndulo */}
        <div>
          <Label htmlFor="pendulo_id">Péndulo</Label>
          <Select
            value={formData.pendulo_id}
            onValueChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                pendulo_id: value,
              }))
            }
          >
            <option value="">Selecciona un pendulo</option>
            {pendulosDisponibles.map((pendulo) => (
              <option key={pendulo.id} value={pendulo.pendulo_id}>
                {pendulo.institucion} - {pendulo.pais}
              </option>
            ))}
          </Select>
        </div>

        {/* Fecha */}
        <div>
          <Label htmlFor="fecha">Fecha</Label>
          <Input
            type="date"
            name="fecha"
            value={formData.fecha}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>

        {/* Hora de Inicio */}
        <div>
          <Label htmlFor="hora_inicio">Hora de Inicio</Label>
          <Input
            type="time"
            name="hora_inicio"
            value={formData.hora_inicio}
            onChange={handleInputChange}
            required
          />
        </div>

        {/* Hora Final (automática) */}
        <div>
          <Label htmlFor="hora_final">Hora Final (30 minutos)</Label>
          <Input
            type="time"
            name="hora_final"
            value={formData.hora_final}
            disabled
            className="bg-gray-100"
          />
          <p className="text-sm text-gray-500 mt-1">
            La sesión dura automáticamente 30 minutos
          </p>
        </div>

        {/* Botón Submit */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? 'Creando reservación...' : 'Crear Reservación'}
        </Button>
      </form>
    </Card>
  );
}
