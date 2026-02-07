import React, { useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Frame, QueryState, Badge, Button } from 'ui/shared/components';
import { useBlogPost, useUpdateBlogPost } from './hooks/useBlog';
import { useAuth } from 'ui/shared/hooks/useAuth';
import styles from './blog.module.scss';
import { BlogPost as BlogPostType } from 'shared/types';
import { BlogPostEditor } from './views/BlogPostEditor';
import { BlogPostReader } from './views/BlogPostReader';

export default function BlogPostContainer() {
  const { slug } = useParams({ from: '/blog/$slug' });
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch } = useBlogPost(slug);
  const { mutate: updatePost } = useUpdateBlogPost();
  const { isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (
    post: BlogPostType,
    updatedPost: Partial<BlogPostType>,
  ) => {
    updatePost(
      { id: post.id, data: updatedPost },
      {
        onSuccess: (newPost) => {
          setIsEditing(false);
          if (newPost.slug !== slug) {
            navigate({ to: '/blog/$slug', params: { slug: newPost.slug } });
          }
        },
        onError: (err) => {
          console.error('Failed to update post:', err);
          alert('Failed to update post');
        },
      },
    );
  };

  return (
    <Frame id="blog-post">
      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={data}
        refetch={refetch}
        isEmpty={() => false} // Single item, if data exists it's not empty
      >
        {(post) =>
          isEditing ? (
            <BlogPostEditor
              post={post}
              onSave={(updates) => handleSave(post, updates)}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <article>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <header
                  style={{
                    marginBottom: '2rem',
                    textAlign: 'center',
                    width: '100%',
                  }}
                >
                  <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {post.title}
                  </h1>
                  <div
                    className={styles.meta}
                    style={{ justifyContent: 'center' }}
                  >
                    <span className={styles.date}>
                      {new Date(post.publishedAt).toLocaleDateString()}
                    </span>
                    <div className={styles.tags}>
                      {post.tags?.map((tag) => (
                        <Badge key={tag} variant="primary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </header>
                {isAuthenticated && (
                  <div style={{ marginBottom: '2rem' }}>
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Post
                    </Button>
                  </div>
                )}
              </div>
              <BlogPostReader content={post.content} />
            </article>
          )
        }
      </QueryState>
    </Frame>
  );
}
