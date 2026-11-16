export interface MailingTask {
  id: string;
  title: string;
  reportId: string;
  reportTitle: string;
  requestedBy: string;
  requestedAt: string;
  analyst?: string;
}
