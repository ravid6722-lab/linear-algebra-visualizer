import { useVisualizerStore } from '../store/useVisualizerStore.js';

const conceptGroups = [
  {
    title: 'טרנספורמציות ומטריצות',
    items: [
      { key: 'transformation', icon: '↗', label: 'טרנספורמציה ליניארית' },
      { key: 'determinant', icon: '▱', label: 'דטרמיננטה' },
      { key: 'eigen', icon: 'λ', label: 'וקטורים עצמיים' },
    ],
  },
  {
    title: 'צירופים, פריסה ובסיס',
    description: 'שלושה נושאים קשורים, עם מצב תרגול נפרד לכל אחד.',
    emphasized: true,
    items: [
      { key: 'combination', icon: '+', label: 'צירוף ליניארי' },
      { key: 'span', icon: '⇿', label: 'מרחב נפרס' },
      { key: 'basis', icon: '⊞', label: 'בסיס, קואורדינטות ומעבר בסיס' },
    ],
  },
  {
    title: 'הרחבה למרחבים כלליים',
    items: [
      { key: 'abstract', icon: '◫', label: 'מרחבים וקטוריים אבסטרקטיים' },
    ],
  },
];

export default function ConceptSelector() {
  const concept = useVisualizerStore((s) => s.concept);
  const setConcept = useVisualizerStore((s) => s.setConcept);

  return (
    <div className="card-section" dir="rtl">
      <div className="section-title">בחירת נושא</div>
      <div className="concept-groups">
        {conceptGroups.map((group) => (
          <section className={`concept-group ${group.emphasized ? 'emphasized' : ''}`} key={group.title}>
            <div className="concept-group-title">{group.title}</div>
            {group.description && <div className="concept-group-description">{group.description}</div>}
            <div className="concept-list">
              {group.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`concept-item ${concept === item.key ? 'active' : ''}`}
                  onClick={() => setConcept(item.key)}
                >
                  <span className="ico">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
