import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

initializeApp();

// Limite por execução para não ultrapassar o máximo de 500 ops por batch do Firestore
const BATCH_LIMIT = 400;

export const processScheduledMessages = onSchedule(
  {
    schedule: '* * * * *',
    timeZone: 'America/Sao_Paulo',
    retryCount: 3,
  },
  async () => {
    try {
      const db = getFirestore();
      const now = Timestamp.now();

      const snapshot = await db
        .collection('messages')
        .where('status', '==', 'scheduled')
        .where('scheduledAt', '<=', now)
        .limit(BATCH_LIMIT)
        .get();

      if (snapshot.empty) {
        logger.debug('Nenhuma mensagem agendada para processar');
        return;
      }

      const batch = db.batch();
      for (const docSnap of snapshot.docs) {
        batch.update(docSnap.ref, { status: 'sent', sentAt: now });
      }

      await batch.commit();
      logger.info(`Processadas ${snapshot.size} mensagem(ns) agendada(s)`);
    } catch (err) {
      logger.error('Falha ao processar mensagens agendadas', err);
      throw err;
    }
  }
);
