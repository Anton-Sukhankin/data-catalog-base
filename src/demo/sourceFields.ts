import type { SourceField } from '../data/sourceDetails';

/** Prototype schemas combining observed fields with demonstration fields. */
type FieldSeed = readonly [name:string, sqlType:string, nullable?:boolean, key?:boolean, relatedMetrics?:readonly string[]];
function fields(seeds:readonly FieldSeed[]):readonly SourceField[] {
  return seeds.map(([name,sqlType,nullable=false,key=false,relatedMetrics])=>({
    name,sqlType,nullable,key,relatedMetrics,
    genericType:sqlType==='BIT'?'BooleanType':sqlType==='DATE'?'DateType':/^(DATETIME|TIMESTAMP)/.test(sqlType)?'DateTimeType':/^(INT|BIGINT|SMALLINT|TINYINT|DECIMAL|INTEGER)/.test(sqlType)?'NumberType':'StringType',
  }));
}

// Field relationships observed for reportcrm20.dbo.dimdate in SRC-17 and SRC-18.
const reportCrmDateMetrics = [
  'Количество задач оформления и регистрации',
  'Кол-во онлайн сделок, шт',
  'Доля онлайн сделок, %',
  'Срок подачи на регистрацию',
  'Выполнение плана дополнительных доходов, %',
  'Сборы страховок по рассрочке',
  'Устная бронь',
  'Устная бронь, перешедшая в платную',
  'Устных броней снято',
  'Платный резерв, перешедший в продажу',
  'Платных броней снято',
  'Площадь онлайн-продаж, м²',
] as const;

export const reportCrmObservedFields: readonly FieldSeed[] = [
  ['DateKey','INTEGER',false,true,[]],
  ['Date','DATE',true,false,reportCrmDateMetrics],
  ['FullDate','VARCHAR(100) COLLATE Cyrillic_General_CI_AS',true,false,[]],
  ['FullDateUSA','VARCHAR(100) COLLATE Cyrillic_General_CI_AS',true,false,[]],
];

const calendar:readonly FieldSeed[] = [
  ['calendar_quarter','TINYINT'], ['quarter_name','NVARCHAR'], ['month_number','TINYINT'],
  ['month_name','NVARCHAR'], ['month_short_name','NVARCHAR'], ['day_of_month','TINYINT'],
  ['day_of_year','SMALLINT'], ['day_of_week','TINYINT'], ['day_name','NVARCHAR'],
  ['week_of_year','TINYINT'], ['iso_week','TINYINT'], ['iso_year','SMALLINT'],
  ['is_weekend','BIT'], ['is_holiday','BIT'], ['holiday_name','NVARCHAR',true],
  ['is_working_day','BIT'], ['month_start','DATE'], ['month_end','DATE'],
  ['quarter_start','DATE'], ['quarter_end','DATE'], ['year_start','DATE'], ['year_end','DATE'],
];

const calendarYearMetrics = ['Количество дней в году','Рабочие дни с начала года','Доля прошедшего года','Выполнение годового плана'];
const calendarQuarterMetrics = ['Количество дней в квартале','Рабочие дни с начала квартала','Выполнение квартального плана','Продажи за квартал'];
const calendarMonthMetrics = ['Количество дней в месяце','Рабочие дни с начала месяца','Доля прошедшего месяца','Выполнение месячного плана','Продажи за месяц'];
const calendarDayMetrics = ['Сделки за день','Заявки за день','Продажи за день','Среднее число сделок в день','Доля продаж за день'];
const calendarWeekMetrics = ['Сделки за неделю','Продажи за неделю','Количество рабочих дней недели','Среднее число сделок за неделю'];
const workingDayMetrics = ['Количество рабочих дней','Продажи в рабочие дни','Среднее число заявок в рабочий день'];
const holidayMetrics = ['Количество праздничных дней','Заявки в праздничные дни','Доля заявок в праздничные дни'];
const fiscalYearMetrics = ['Продажи за финансовый год','Выполнение плана финансового года','Выручка с начала финансового года'];
const fiscalQuarterMetrics = ['Продажи за финансовый квартал','Выручка за финансовый квартал','Выполнение плана финансового квартала'];
const fiscalMonthMetrics = ['Продажи за финансовый месяц','Выручка за финансовый месяц','Выполнение плана финансового месяца'];

/** Authored links for the dimdate prototype only. FullDateUSA has zero observed links in SRC-28. */
const reportCrmDemoMetrics: Readonly<Partial<Record<string,readonly string[]>>> = {
  FullDateUSA:calendarDayMetrics,
  calendar_year:calendarYearMetrics,
  calendar_quarter:calendarQuarterMetrics,
  quarter_name:calendarQuarterMetrics,
  month_number:calendarMonthMetrics,
  month_name:calendarMonthMetrics,
  month_short_name:calendarMonthMetrics,
  day_of_month:calendarDayMetrics,
  day_of_year:calendarYearMetrics,
  day_of_week:calendarDayMetrics,
  day_name:calendarDayMetrics,
  week_of_year:calendarWeekMetrics,
  iso_week:calendarWeekMetrics,
  iso_year:calendarYearMetrics,
  is_weekend:['Количество выходных дней','Заявки в выходные дни','Доля заявок в выходные дни'],
  is_holiday:holidayMetrics,
  holiday_name:holidayMetrics,
  is_working_day:workingDayMetrics,
  month_start:calendarMonthMetrics,
  month_end:calendarMonthMetrics,
  quarter_start:calendarQuarterMetrics,
  quarter_end:calendarQuarterMetrics,
  year_start:calendarYearMetrics,
  year_end:calendarYearMetrics,
  fiscal_year:fiscalYearMetrics,
  fiscal_quarter:fiscalQuarterMetrics,
  fiscal_month:fiscalMonthMetrics,
  week_start:calendarWeekMetrics,
  week_end:calendarWeekMetrics,
  previous_year_date:['Продажи за аналогичный день прошлого года','Изменение продаж год к году','Изменение числа сделок год к году'],
  created_at:['Добавленные записи календаря','Последняя дата добавления записи календаря','Дни с новыми записями календаря'],
};

export const demoSourceFields:Readonly<Record<string,readonly SourceField[]>> = {
  'source-reportcrm-date':fields([
    ...reportCrmObservedFields,
    ['calendar_year','SMALLINT'], ...calendar,
    ['fiscal_year','SMALLINT'], ['fiscal_quarter','TINYINT'], ['fiscal_month','TINYINT'],
    ['week_start','DATE'], ['week_end','DATE'],
    ['previous_year_date','DATE',true], ['created_at','DATETIME2'],
  ]).map(field => {
    const relatedMetrics = reportCrmDemoMetrics[field.name];
    return relatedMetrics ? { ...field, relatedMetrics } : field;
  }),
  'source-dwh-date':fields([
    ['date_key','INT',false,true,['Количество рабочих дней','Количество выходных дней','Количество праздничных дней']],
    ['full_date','DATE'], ['calendar_year','SMALLINT',false,false,['Количество дней в году']], ...calendar,
    ['reporting_period','CHAR'], ['financial_year','SMALLINT'], ['financial_period','TINYINT'],
    ['is_month_closed','BIT'], ['is_quarter_closed','BIT'], ['working_day_number','SMALLINT',true],
    ['etl_loaded_at','DATETIME2'], ['source_system','NVARCHAR'],
  ]),
  'source-dwh-project':fields([
    ['project_id','BIGINT',false,true], ['project_code','NVARCHAR'], ['project_name','NVARCHAR'],
    ['project_description','NVARCHAR',true], ['status','NVARCHAR'], ['portfolio_id','BIGINT',true],
    ['customer_id','BIGINT'], ['manager_id','BIGINT',true], ['department_code','NVARCHAR'],
    ['start_date','DATE'], ['planned_end_date','DATE',true], ['actual_end_date','DATE',true],
    ['budget_amount','DECIMAL',true], ['actual_cost','DECIMAL',true], ['currency_code','CHAR'],
    ['completion_percent','DECIMAL'], ['is_archived','BIT'], ['created_at','DATETIME2'],
    ['updated_at','DATETIME2'], ['etl_loaded_at','DATETIME2'],
  ]),
  'source-demo-clients':fields([
    ['client_id','BIGINT',false,true], ['full_name','NVARCHAR'], ['email','NVARCHAR',true],
    ['phone','NVARCHAR',true], ['client_type','NVARCHAR'], ['segment','NVARCHAR',true],
    ['registration_date','DATE'], ['city','NVARCHAR',true], ['country_code','CHAR'],
    ['consent_personal_data','BIT'], ['is_active','BIT'], ['updated_at','DATETIME2'],
  ]),
  'source-demo-contracts':fields([
    ['contract_id','BIGINT',false,true], ['contract_number','NVARCHAR'], ['client_id','BIGINT'],
    ['contract_type','NVARCHAR'], ['status','NVARCHAR'], ['signed_at','DATE',true],
    ['valid_from','DATE'], ['valid_to','DATE',true], ['amount','DECIMAL'], ['currency_code','CHAR'],
    ['payment_terms','NVARCHAR',true], ['manager_id','BIGINT',true], ['department_code','NVARCHAR'],
    ['subject','NVARCHAR'], ['termination_date','DATE',true], ['is_renewable','BIT'],
    ['created_at','DATETIME2'], ['updated_at','DATETIME2'],
  ]),
  'source-demo-sales':fields([
    ['sale_id','BIGINT',false,true], ['sale_date','DATE'], ['order_id','BIGINT'], ['order_number','NVARCHAR'],
    ['client_id','BIGINT'], ['contract_id','BIGINT',true], ['product_id','BIGINT'], ['product_name','NVARCHAR'],
    ['product_category','NVARCHAR'], ['quantity','DECIMAL'], ['unit_price','DECIMAL'],
    ['discount_amount','DECIMAL'], ['net_amount','DECIMAL'], ['tax_amount','DECIMAL'],
    ['gross_amount','DECIMAL'], ['currency_code','CHAR'], ['payment_status','NVARCHAR'],
    ['sales_channel','NVARCHAR'], ['region_code','NVARCHAR'], ['manager_id','BIGINT',true],
    ['is_return','BIT'], ['return_reason','NVARCHAR',true], ['created_at','DATETIME2'], ['updated_at','DATETIME2'],
  ]),
  'source-demo-requests':fields([
    ['request_id','BIGINT',false,true], ['request_number','NVARCHAR'], ['request_type','NVARCHAR'],
    ['subject','NVARCHAR'], ['description','NVARCHAR',true], ['status','NVARCHAR'],
    ['priority','NVARCHAR'], ['requester_id','BIGINT'], ['assignee_id','BIGINT',true],
    ['service_code','NVARCHAR'], ['created_at','DATETIME2'], ['due_at','DATETIME2',true],
    ['resolved_at','DATETIME2',true], ['resolution','NVARCHAR',true], ['sla_breached','BIT'],
  ]),
  'source-demo-feedback':fields([
    ['feedback_id','BIGINT',false,true], ['request_id','BIGINT'], ['rating','TINYINT'],
    ['comment','NVARCHAR',true], ['channel','NVARCHAR'], ['submitted_at','DATETIME2'],
    ['is_anonymous','BIT'], ['service_code','NVARCHAR'], ['sentiment','NVARCHAR',true], ['processed_at','DATETIME2',true],
  ]),
};
