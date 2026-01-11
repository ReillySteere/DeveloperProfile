import React, { useState, useEffect } from 'react';
import { BlogPostReader } from './BlogPostReader';
import styles from '../blog.module.scss';
import { BlogPost as BlogPostType } from 'shared/types';
import { Button } from 'ui/shared/components/Button/Button';

interface BlogPostEditorProps {
  post?: Partial<BlogPostType>;
  onSave: (post: Partial<BlogPostType>) => void;
  onCancel: () => void;
}

export const BlogPostEditor: React.FC<BlogPostEditorProps> = ({
  post,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<Partial<BlogPostType>>({
    title: '',
    slug: '',
    metaDescription: '',
    tags: [],
    content: '',
    ...(post || {}),
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (post) {
      setFormData({
        title: '',
        slug: '',
        metaDescription: '',
        tags: [],
        content: '',
        ...post,
      });
    }
  }, [post]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map((tag) => tag.trim());
    setFormData((prev) => ({
      ...prev,
      tags,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Explicitly construct payload to exclude id, publishedAt, createdAt, updatedAt
    const payload: Partial<BlogPostType> = {
      title: formData.title,
      metaDescription: formData.metaDescription,
      tags: formData.tags,
      content: formData.content,
      slug: formData.slug,
    };

    onSave(payload);
  };

  return (
    <div className={styles.editContainer}>
      <div className={styles.previewToggle}>
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
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="slug">Slug</label>
            <input
              type="text"
              id="slug"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="metaDescription">Meta Description</label>
            <input
              type="text"
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags?.join(', ')}
              onChange={handleTagsChange}
            />
          </div>

          {formData.publishedAt && (
            <div className={styles.formGroup}>
              <label>Published At</label>
              <input
                type="text"
                value={new Date(formData.publishedAt).toLocaleString()}
                disabled
                readOnly
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="content">Content (Markdown)</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.actions}>
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
          <div className={styles.blogPost}>
            <h1>{formData.title}</h1>
            <BlogPostReader content={formData.content || ''} />
          </div>
          <div className={styles.actions}>
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
