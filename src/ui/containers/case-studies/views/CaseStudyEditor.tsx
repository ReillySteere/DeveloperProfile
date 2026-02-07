import React, { useState, useEffect } from 'react';
import { Button } from 'ui/shared/components/Button/Button';
import { MarkdownContent } from 'ui/shared/components/MarkdownContent/MarkdownContent';
import { CaseStudy, CaseStudyPhase, CaseStudyMetric } from 'shared/types';
import styles from '../case-studies.module.scss';

interface CaseStudyEditorProps {
  caseStudy: CaseStudy;
  onSave: (data: Partial<CaseStudy>) => void;
  onCancel: () => void;
}

type FormData = Omit<CaseStudy, 'id' | 'project'>;

export const CaseStudyEditor: React.FC<CaseStudyEditorProps> = ({
  caseStudy,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    slug: caseStudy.slug,
    projectId: caseStudy.projectId,
    problemContext: caseStudy.problemContext,
    challenges: [...caseStudy.challenges],
    approach: caseStudy.approach,
    phases: caseStudy.phases.map((p) => ({ ...p })),
    keyDecisions: [...caseStudy.keyDecisions],
    outcomeSummary: caseStudy.outcomeSummary,
    metrics: caseStudy.metrics.map((m) => ({ ...m })),
    learnings: [...caseStudy.learnings],
    diagrams: caseStudy.diagrams?.map((d) => ({ ...d })),
    codeComparisons: caseStudy.codeComparisons?.map((c) => ({ ...c })),
    published: caseStudy.published,
  });
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<
    'problem' | 'solution' | 'outcome'
  >('problem');

  useEffect(() => {
    setFormData({
      slug: caseStudy.slug,
      projectId: caseStudy.projectId,
      problemContext: caseStudy.problemContext,
      challenges: [...caseStudy.challenges],
      approach: caseStudy.approach,
      phases: caseStudy.phases.map((p) => ({ ...p })),
      keyDecisions: [...caseStudy.keyDecisions],
      outcomeSummary: caseStudy.outcomeSummary,
      metrics: caseStudy.metrics.map((m) => ({ ...m })),
      learnings: [...caseStudy.learnings],
      diagrams: caseStudy.diagrams?.map((d) => ({ ...d })),
      codeComparisons: caseStudy.codeComparisons?.map((c) => ({ ...c })),
      published: caseStudy.published,
    });
  }, [caseStudy]);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  // String array handlers
  const handleStringArrayChange = (
    field: 'challenges' | 'keyDecisions' | 'learnings',
    index: number,
    value: string,
  ) => {
    setFormData((prev) => {
      const arr = [...prev[field]];
      arr[index] = value;
      return { ...prev, [field]: arr };
    });
  };

  const addStringArrayItem = (
    field: 'challenges' | 'keyDecisions' | 'learnings',
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ''],
    }));
  };

  const removeStringArrayItem = (
    field: 'challenges' | 'keyDecisions' | 'learnings',
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  // Phase handlers
  const handlePhaseChange = (
    index: number,
    field: keyof CaseStudyPhase,
    value: string,
  ) => {
    setFormData((prev) => {
      const phases = [...prev.phases];
      phases[index] = { ...phases[index], [field]: value };
      return { ...prev, phases };
    });
  };

  const addPhase = () => {
    setFormData((prev) => ({
      ...prev,
      phases: [...prev.phases, { name: '', description: '', duration: '' }],
    }));
  };

  const removePhase = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      phases: prev.phases.filter((_, i) => i !== index),
    }));
  };

  // Metric handlers
  const handleMetricChange = (
    index: number,
    field: keyof CaseStudyMetric,
    value: string,
  ) => {
    setFormData((prev) => {
      const metrics = [...prev.metrics];
      metrics[index] = { ...metrics[index], [field]: value };
      return { ...prev, metrics };
    });
  };

  const addMetric = () => {
    setFormData((prev) => ({
      ...prev,
      metrics: [
        ...prev.metrics,
        { label: '', before: '', after: '', description: '' },
      ],
    }));
  };

  const removeMetric = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      metrics: prev.metrics.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter out empty items
    const payload: Partial<CaseStudy> = {
      slug: formData.slug,
      problemContext: formData.problemContext,
      challenges: formData.challenges.filter((c) => c.trim() !== ''),
      approach: formData.approach,
      phases: formData.phases.filter((p) => p.name.trim() !== ''),
      keyDecisions: formData.keyDecisions.filter((d) => d.trim() !== ''),
      outcomeSummary: formData.outcomeSummary,
      metrics: formData.metrics.filter((m) => m.label.trim() !== ''),
      learnings: formData.learnings.filter((l) => l.trim() !== ''),
      published: formData.published,
    };
    onSave(payload);
  };

  const renderStringArrayField = (
    field: 'challenges' | 'keyDecisions' | 'learnings',
    label: string,
  ) => (
    <div className={styles.formGroup}>
      <label>{label}</label>
      <div className={styles.arrayField}>
        {formData[field].map((item, index) => (
          <div key={index} className={styles.arrayItem}>
            <input
              type="text"
              value={item}
              onChange={(e) =>
                handleStringArrayChange(field, index, e.target.value)
              }
              placeholder={`${label.slice(0, -1)} ${index + 1}`}
              className={styles.input}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => removeStringArrayItem(field, index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => addStringArrayItem(field)}
        >
          + Add {label.slice(0, -1)}
        </Button>
      </div>
    </div>
  );

  const renderPhasesField = () => (
    <div className={styles.formGroup}>
      <label>Implementation Phases</label>
      <div className={styles.arrayField}>
        {formData.phases.map((phase, index) => (
          <div key={index} className={styles.phaseItem}>
            <div className={styles.phaseFields}>
              <input
                type="text"
                value={phase.name}
                onChange={(e) =>
                  handlePhaseChange(index, 'name', e.target.value)
                }
                placeholder="Phase name"
                className={styles.input}
              />
              <input
                type="text"
                value={phase.duration || ''}
                onChange={(e) =>
                  handlePhaseChange(index, 'duration', e.target.value)
                }
                placeholder="Duration (e.g., 4 weeks)"
                className={styles.input}
              />
            </div>
            <textarea
              value={phase.description}
              onChange={(e) =>
                handlePhaseChange(index, 'description', e.target.value)
              }
              placeholder="Phase description"
              className={styles.textareaSmall}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => removePhase(index)}
            >
              Remove Phase
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addPhase}>
          + Add Phase
        </Button>
      </div>
    </div>
  );

  const renderMetricsField = () => (
    <div className={styles.formGroup}>
      <label>Impact Metrics</label>
      <div className={styles.arrayField}>
        {formData.metrics.map((metric, index) => (
          <div key={index} className={styles.metricItem}>
            <div className={styles.metricFields}>
              <input
                type="text"
                value={metric.label}
                onChange={(e) =>
                  handleMetricChange(index, 'label', e.target.value)
                }
                placeholder="Metric label"
                className={styles.input}
              />
              <input
                type="text"
                value={metric.before || ''}
                onChange={(e) =>
                  handleMetricChange(index, 'before', e.target.value)
                }
                placeholder="Before value (optional)"
                className={styles.input}
              />
              <input
                type="text"
                value={metric.after}
                onChange={(e) =>
                  handleMetricChange(index, 'after', e.target.value)
                }
                placeholder="After value"
                className={styles.input}
              />
            </div>
            <input
              type="text"
              value={metric.description || ''}
              onChange={(e) =>
                handleMetricChange(index, 'description', e.target.value)
              }
              placeholder="Description (optional)"
              className={styles.input}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => removeMetric(index)}
            >
              Remove Metric
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addMetric}>
          + Add Metric
        </Button>
      </div>
    </div>
  );

  return (
    <div className={styles.editContainer}>
      <div className={styles.editorHeader}>
        <div className={styles.sectionTabs}>
          <button
            type="button"
            className={`${styles.sectionTab} ${activeSection === 'problem' ? styles.active : ''}`}
            onClick={() => setActiveSection('problem')}
          >
            Problem
          </button>
          <button
            type="button"
            className={`${styles.sectionTab} ${activeSection === 'solution' ? styles.active : ''}`}
            onClick={() => setActiveSection('solution')}
          >
            Solution
          </button>
          <button
            type="button"
            className={`${styles.sectionTab} ${activeSection === 'outcome' ? styles.active : ''}`}
            onClick={() => setActiveSection('outcome')}
          >
            Outcome
          </button>
        </div>
        <Button
          variant="secondary"
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Edit Mode' : 'Preview Mode'}
        </Button>
      </div>

      {!showPreview ? (
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="slug">Slug</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleTextChange}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="published"
                checked={formData.published}
                onChange={handleCheckboxChange}
              />
              Published
            </label>
          </div>

          {activeSection === 'problem' && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="problemContext">
                  Problem Context (Markdown)
                </label>
                <textarea
                  id="problemContext"
                  name="problemContext"
                  value={formData.problemContext}
                  onChange={handleTextChange}
                  className={styles.textareaLarge}
                  required
                />
              </div>
              {renderStringArrayField('challenges', 'Challenges')}
            </>
          )}

          {activeSection === 'solution' && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="approach">Approach (Markdown)</label>
                <textarea
                  id="approach"
                  name="approach"
                  value={formData.approach}
                  onChange={handleTextChange}
                  className={styles.textareaLarge}
                  required
                />
              </div>
              {renderPhasesField()}
              {renderStringArrayField('keyDecisions', 'Key Decisions')}
            </>
          )}

          {activeSection === 'outcome' && (
            <>
              <div className={styles.formGroup}>
                <label htmlFor="outcomeSummary">
                  Outcome Summary (Markdown)
                </label>
                <textarea
                  id="outcomeSummary"
                  name="outcomeSummary"
                  value={formData.outcomeSummary}
                  onChange={handleTextChange}
                  className={styles.textareaLarge}
                  required
                />
              </div>
              {renderMetricsField()}
              {renderStringArrayField('learnings', 'Learnings')}
            </>
          )}

          <div className={styles.editActions}>
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Changes
            </Button>
          </div>
        </form>
      ) : (
        <div className={styles.preview}>
          <div className={styles.previewSection}>
            <h3>Problem Context</h3>
            <MarkdownContent content={formData.problemContext} />
            {formData.challenges.length > 0 && (
              <>
                <h4>Challenges</h4>
                <ul>
                  {formData.challenges.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className={styles.previewSection}>
            <h3>Approach</h3>
            <MarkdownContent content={formData.approach} />
          </div>
          <div className={styles.previewSection}>
            <h3>Outcome Summary</h3>
            <MarkdownContent content={formData.outcomeSummary} />
          </div>
          <div className={styles.editActions}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowPreview(false)}
            >
              Back to Edit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
