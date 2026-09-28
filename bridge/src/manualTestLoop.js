const config = require('./config');
const logger = require('./logger');
const { getDb, admin } = require('./firebaseAdmin');
const { parametrosCfgHaciaFirmware } = require('./parametrosFirmwarePendulo');

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'));
      return;
    }
    const timer = setTimeout(resolve, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function patchLoopManual(penduloRef, patch) {
  const snap = await penduloRef.get();
  const current = snap.exists ? snap.data().loopManual || {} : {};
  await penduloRef.set(
    {
      loopManual: {
        ...current,
        ...patch,
      },
    },
    { merge: true },
  );
}

async function waitForMqttConnected(mqttClient, retries, delayMs, signal) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    if (signal?.aborted) throw new Error('aborted');
    if (mqttClient.connected) return true;
    logger.warn(`Loop manual: MQTT desconectado (intento ${attempt}/${retries})`);
    await sleep(delayMs, signal);
  }
  return mqttClient.connected;
}

function waitForComandoEstado(comandoId, timeoutMs, signal) {
  const db = getDb();
  return new Promise((resolve, reject) => {
    const ref = db.collection('pendulo_comandos').doc(comandoId);
    let unsub = () => {};
    const timeout = setTimeout(() => {
      unsub();
      reject(new Error(`Timeout esperando comando ${comandoId} (>${timeoutMs / 1000}s)`));
    }, timeoutMs);

    const onAbort = () => {
      clearTimeout(timeout);
      unsub();
      reject(new Error('aborted'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    unsub = ref.onSnapshot(
      (snap) => {
        if (!snap.exists) return;
        const data = snap.data();
        if (data.estado === 'enviado') {
          clearTimeout(timeout);
          signal?.removeEventListener('abort', onAbort);
          unsub();
          resolve(data);
        } else if (data.estado === 'error') {
          clearTimeout(timeout);
          signal?.removeEventListener('abort', onAbort);
          unsub();
          reject(new Error(data.errorMsg || 'El bridge no pudo publicar el comando'));
        }
      },
      (err) => {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', onAbort);
        unsub();
        reject(err);
      },
    );
  });
}

function waitForCycleComplete(penduloRef, cycleStartMs, timeoutMs, signal) {
  return new Promise((resolve, reject) => {
    let unsub = () => {};
    let silenceTimer = null;
    let gotSample = false;
    let lastMuestras = null;

    const cleanup = (fn) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      unsub();
      fn();
    };

    const scheduleSilence = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        cleanup(() =>
          resolve({
            reason: 'silence',
            muestras: lastMuestras,
          }),
        );
      }, config.manualLoop.sampleSilenceMs);
    };

    const timeout = setTimeout(() => {
      cleanup(() => {
        if (gotSample) {
          resolve({ reason: 'timeout_with_samples', muestras: lastMuestras });
        } else {
          reject(new Error(`Timeout del ciclo sin muestras (>${timeoutMs / 1000}s)`));
        }
      });
    }, timeoutMs);

    const onAbort = () => {
      cleanup(() => reject(new Error('aborted')));
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    unsub = penduloRef.onSnapshot(
      (snap) => {
        if (!snap.exists) return;
        const data = snap.data();
        const actMs = data.actualizadoEn?.toMillis?.() || 0;

        if (data.estado === 'error' && actMs >= cycleStartMs) {
          clearTimeout(timeout);
          signal?.removeEventListener('abort', onAbort);
          cleanup(() => reject(new Error(data.errorMensaje || 'Error reportado por el hardware')));
          return;
        }

        if (
          (data.estadoDispositivo === 'finalizado' || data.estado === 'finalizado') &&
          actMs >= cycleStartMs
        ) {
          clearTimeout(timeout);
          signal?.removeEventListener('abort', onAbort);
          cleanup(() =>
            resolve({
              reason: 'finalizado',
              muestras: data.muestras ?? data.muestra ?? lastMuestras,
            }),
          );
          return;
        }

        const muestras = data.muestras ?? data.muestra;
        const hasMeasurementField =
          data.periodo != null || data.gravedad != null || data.frecuencia != null;

        if (actMs >= cycleStartMs && hasMeasurementField) {
          gotSample = true;
          if (typeof muestras === 'number') lastMuestras = muestras;
          scheduleSilence();
        }
      },
      (err) => {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', onAbort);
        cleanup(() => reject(err));
      },
    );
  });
}

async function createIniciarComando(db, penduloId, session) {
  const cfg = parametrosCfgHaciaFirmware(
    config.manualLoop.oscilaciones,
    config.manualLoop.distanciaMuro,
  );

  const docRef = await db.collection('pendulo_comandos').add({
    penduloId,
    usuarioId: session.usuarioActivo,
    practicaId: session.practicaId,
    accion: 'iniciar',
    oscilaciones: cfg.oscilaciones,
    distanciaMuro: cfg.distanciaMuro,
    reservacionId: null,
    estado: 'pendiente',
    fechaCreacion: admin.firestore.Timestamp.now(),
  });

  return docRef.id;
}

async function runOneCycle(mqttClient, penduloRef, session, cycleNumber, signal) {
  const penduloId = config.defaultPenduloId;
  const db = getDb();
  const now = admin.firestore.Timestamp.now();

  await patchLoopManual(penduloRef, {
    estado: 'conectando',
    cicloActual: cycleNumber,
    ultimoCicloInicio: now,
    ultimoError: null,
    proximoCicloEn: null,
  });

  const connected = await waitForMqttConnected(
    mqttClient,
    config.manualLoop.connectRetries,
    config.manualLoop.connectRetryDelayMs,
    signal,
  );
  if (!connected) {
    throw new Error('MQTT no disponible tras varios reintentos');
  }

  await patchLoopManual(penduloRef, { estado: 'enviando' });

  const comandoId = await createIniciarComando(db, penduloId, session);
  logger.info(`Loop manual ciclo ${cycleNumber}: comando ${comandoId} creado (cfg ${config.manualLoop.distanciaMuro}/${config.manualLoop.oscilaciones})`);

  await waitForComandoEstado(comandoId, config.manualLoop.commandTimeoutMs, signal);

  const cycleStartMs = Date.now();
  await patchLoopManual(penduloRef, { estado: 'midiendo' });

  const result = await waitForCycleComplete(
    penduloRef,
    cycleStartMs,
    config.manualLoop.cycleTimeoutMs,
    signal,
  );

  const fin = admin.firestore.Timestamp.now();
  await patchLoopManual(penduloRef, {
    estado: 'esperando',
    ultimoCicloFin: fin,
    muestrasUltimoCiclo: result.muestras ?? 0,
    ultimoError: null,
  });

  logger.info(
    `Loop manual ciclo ${cycleNumber} OK (${result.reason}, muestras=${result.muestras ?? '?'})`,
  );

  return result;
}

function startManualTestLoop(mqttClient) {
  const db = getDb();
  const penduloId = config.defaultPenduloId;
  const penduloRef = db.collection('pendulo_data').doc(penduloId);

  let orchestrating = false;
  let stopRequested = false;
  let abortController = null;
  let waitTimer = null;
  let waitReject = null;
  let activePracticaId = null;
  let orchestratorGeneration = 0;

  const clearWaitTimer = () => {
    if (waitTimer) {
      clearTimeout(waitTimer);
      waitTimer = null;
    }
    if (waitReject) {
      const reject = waitReject;
      waitReject = null;
      reject(new Error('aborted'));
    }
  };

  const stopOrchestrator = () => {
    stopRequested = true;
    clearWaitTimer();
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    orchestrating = false;
  };

  const scheduleNextCycle = (delayMs, signal) => {
    clearWaitTimer();
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        reject(new Error('aborted'));
        return;
      }

      waitReject = reject;
      waitTimer = setTimeout(() => {
        waitTimer = null;
        waitReject = null;
        resolve();
      }, delayMs);

      const onAbort = () => {
        clearWaitTimer();
        reject(new Error('aborted'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
    });
  };

  const needsOrchestratorRestart = (data) => {
    if (!data?.practicaId || !activePracticaId) return false;
    return data.practicaId !== activePracticaId;
  };

  const startOrchestrator = (session) => {
    orchestratorGeneration += 1;
    const generation = orchestratorGeneration;
    activePracticaId = session.practicaId ?? null;
    stopRequested = false;
    orchestrating = true;
    void runOrchestrator(session, generation);
  };

  const runOrchestrator = async (initialSession, generation) => {
    abortController = new AbortController();
    const { signal } = abortController;

    let cycleNumber = initialSession.loopManual?.cicloActual ?? 0;
    if (cycleNumber < 1) cycleNumber = 1;

    let exitedUnexpectedly = false;

    try {
      while (!stopRequested && generation === orchestratorGeneration) {
        const snap = await penduloRef.get();
        const session = snap.exists ? snap.data() : null;
        if (!session?.modoManual || !session?.loopManual?.activo) {
          break;
        }

        if (session.practicaId && session.practicaId !== activePracticaId) {
          logger.info('Loop manual: practicaId cambió durante el orquestador, saliendo');
          break;
        }

        try {
          await runOneCycle(mqttClient, penduloRef, session, cycleNumber, signal);
        } catch (err) {
          if (err.message === 'aborted') break;
          logger.error(`Loop manual ciclo ${cycleNumber} falló:`, err.message);
          await patchLoopManual(penduloRef, {
            estado: 'error',
            ultimoError: err.message,
          });
          if (stopRequested || generation !== orchestratorGeneration) break;
        }

        if (stopRequested || generation !== orchestratorGeneration) break;

        const freshSnap = await penduloRef.get();
        const fresh = freshSnap.exists ? freshSnap.data() : null;
        if (!fresh?.modoManual || !fresh?.loopManual?.activo) break;

        const intervalMs =
          (fresh.loopManual?.intervaloMinutos ?? config.manualLoop.intervalMin) * 60 * 1000;
        const proximo = admin.firestore.Timestamp.fromMillis(Date.now() + intervalMs);
        await patchLoopManual(penduloRef, {
          estado: 'esperando',
          proximoCicloEn: proximo,
        });

        logger.info(
          `Loop manual: próximo ciclo ${cycleNumber + 1} en ${intervalMs / 60000} min`,
        );

        try {
          await scheduleNextCycle(intervalMs, signal);
        } catch (err) {
          if (err.message === 'aborted') break;
          throw err;
        }

        if (stopRequested || generation !== orchestratorGeneration) break;

        cycleNumber += 1;
        await patchLoopManual(penduloRef, { cicloActual: cycleNumber, estado: 'iniciando' });
      }

      exitedUnexpectedly =
        !stopRequested &&
        generation === orchestratorGeneration;
    } finally {
      if (generation === orchestratorGeneration) {
        orchestrating = false;
        abortController = null;

        if (exitedUnexpectedly) {
          try {
            const snap = await penduloRef.get();
            const session = snap.exists ? snap.data() : null;
            if (session?.modoManual && session?.loopManual?.activo) {
              const ultimoError =
                session.loopManual?.ultimoError ||
                'El orquestador del loop se detuvo inesperadamente';
              await patchLoopManual(penduloRef, {
                activo: false,
                estado: 'detenido',
                ultimoError,
                proximoCicloEn: null,
              });
              logger.warn(`Loop manual: orquestador detenido con sesión activa (${ultimoError})`);
            }
          } catch (err) {
            logger.error('Loop manual: no se pudo marcar loop como detenido:', err.message);
          }
        }
      }
    }
  };

  const unsubscribe = penduloRef.onSnapshot(
    (snap) => {
      const data = snap.exists ? snap.data() : null;
      const shouldRun = data?.modoManual === true && data?.loopManual?.activo === true;

      if (shouldRun && !orchestrating) {
        logger.info('Loop manual: sesión activa detectada, iniciando orquestador');
        startOrchestrator(data);
      } else if (shouldRun && orchestrating && needsOrchestratorRestart(data)) {
        logger.info('Loop manual: reinicio de sesión detectado, reiniciando orquestador');
        stopOrchestrator();
        startOrchestrator(data);
      } else if (!shouldRun && orchestrating) {
        logger.info('Loop manual: sesión detenida, cancelando orquestador');
        stopOrchestrator();
        activePracticaId = null;
      }
    },
    (err) => {
      logger.error('Loop manual: error escuchando pendulo_data:', err.message);
    },
  );

  logger.info('Escuchando modo prueba manual (loop automático) en pendulo_data...');

  return () => {
    stopOrchestrator();
    unsubscribe();
  };
}

module.exports = { startManualTestLoop };
