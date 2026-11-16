import type { AssistantReplySource } from '@data-catalog/ui/source/features/ai-assistant/assistantChats';

export const replyFromCatalogDemo: AssistantReplySource = async (question, mode) => {
  await new Promise(resolve => setTimeout(resolve, 1400));
  if (mode === 'solution') {
    return { text: 'Начните с раздела «AI Hub». Опишите задачу и уточните, какие входные данные у вас есть. Так будет проще выбрать подходящее решение.', emphasis: 'AI Hub' };
  }
  if (/отч[её]т|дашборд|показател|метрик/iu.test(question)) {
    const section = /показател|метрик/iu.test(question) ? 'Метрики и показатели' : 'Отчёты';
    return { text: `Проверьте раздел «${section}». Уточните название или домен, чтобы сузить поиск в каталоге.`, emphasis: section };
  }
  return { text: 'Уточните, о какой сущности идёт речь и какой результат вы хотите получить. Например, назовите отчёт, источник или термин из каталога.' };
};
