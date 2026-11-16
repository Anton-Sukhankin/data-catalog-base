export type AiFlag = 'reuse' | 'friday' | 'talent' | 'ui';
export type AiAction = 'recording' | 'instructions' | 'tool';
export interface AiResponsible {
  role: 'Владелец' | 'Разработчик';
  name: string;
  position?: string;
  avatar?: string;
}

export interface AiSolution {
  id: string;
  title: string;
  description: string;
  type: string;
  domain: string;
  status: string;
  platform: string;
  owner?: string;
  developer?: string;
  flags: readonly AiFlag[];
  views: number;
  likes: number;
  actions: Partial<Record<AiAction, { url?: string }>>;
  detail?: {
    summary?: string;
    purpose?: readonly string[];
    tasks?: readonly string[];
    example?: string;
    audience?: string;
    output?: string;
    created?: string;
    updated?: string;
    people?: readonly AiResponsible[];
    hasEditAction?: boolean;
  };
}
