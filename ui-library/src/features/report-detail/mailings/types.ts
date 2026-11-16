import type { ManualDeliveryData } from './deliveryModel';

export interface ReportMailing {
  id: string;
  name: string;
  subscribed: boolean;
  dateTime: string;
  displayDate: string;
}

export interface MailingsSource {
  list(reportId: string): readonly ReportMailing[] | undefined;
  manual?(reportId: string): ManualDeliveryData | undefined;
}
