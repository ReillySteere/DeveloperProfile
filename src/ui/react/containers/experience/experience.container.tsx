import React from 'react';
import Frame from 'ui/react/components/layout/frame';
import {
  Heading,
  Paragraph,
  ListItem,
  Section,
  List,
} from 'ui/react/components/layout';
import { useExperiences } from './useExperience';

export default function Experience() {
  const { experiences, isLoading, isError } = useExperiences();
  if (isLoading) return <div>Loading…</div>;
  if (isError || !experiences) return <div>Error loading experiences</div>;

  return (
    <Frame id="experience">
      {experiences.map((experience) => (
        <Section key={experience.id}>
          <Heading Tag="h3">{experience.title}</Heading>
          <Paragraph>{experience.description}</Paragraph>
          <List>
            {experience.bulletPoints.map((point, index) => (
              <ListItem key={index}>{point}</ListItem>
            ))}
          </List>
        </Section>
      ))}
    </Frame>
  );
}
