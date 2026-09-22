import content from './content.json'

// Names and order follow the original site's six resource groups.
export const categories = [
  { id: 'foundations', name: '基础必修', en: 'Foundations', layer: 0 },
  { id: 'infra', name: '基础设施', en: 'Infra', layer: 5 },
  { id: 'agent', name: '智能体', en: 'Agent', layer: 2 },
  { id: 'humanoid', name: '具身智能', en: 'Embodied AI', layer: 4 },
  { id: 'posttraining', name: '大模型后训练', en: 'LLM Post-Training', layer: 1 },
  { id: 'recsys', name: '推荐算法', en: 'Recommendation', layer: 3 },
] as const

export type CategoryId = (typeof categories)[number]['id']
export const resources = content.resources
export const schools = content.schools
export const members = schools.flatMap((school) =>
  Array.from({ length: school.count }, () => school)
)
export const memberCount = members.length
export const repoUrl = 'https://github.com/Ryannnice/nexus'
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`
