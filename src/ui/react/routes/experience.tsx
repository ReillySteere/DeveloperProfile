import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import Frame from 'ui/react/components/layout/frame';
import {
  Heading,
  Paragraph,
  ListItem,
  Section,
  List,
} from 'ui/react/components/layout';

export const Route = createFileRoute('/experience')({
  component: Experience,
});

function Experience() {
  return (
    <Frame>
      <Heading Tag="h2">Experience</Heading>
      <Section>
        <Heading Tag="h3">
          Getty Images – Senior Software Engineer (2020 – Present)
        </Heading>
        <Paragraph>
          Proven leader within the organization with a demonstrated track record
          on delivering against aggressive deadlines on highly complex product
          areas by leveraging a high degree of technical expertise, coaching
          experience and ability to work collaboratively with cross-functional
          stakeholders.
        </Paragraph>
        <List>
          <ListItem>
            Technical Architect / Project Manager for migration from Rails /
            AngularJS to Node / React of business critical transaction pages
            transaction in several hundred million in revenue per year.
          </ListItem>
          <ListItem>
            Led front-end team of 10 developers delivering the largest new
            feature roll-out the company has undertaken (AI Generative Imagery)
          </ListItem>
          <ListItem>
            Provided mentorship and direct coaching to developers at multiple
            levels of development
          </ListItem>
          <ListItem>
            Contributed to significant improvements in core web vital metrics
          </ListItem>
          <ListItem>
            Responsible for ensuring site reliability is maintained through
            Splunk / Grafana
          </ListItem>
          <ListItem>
            Implemented team’s first automated test suite via Cypress and
            responsible for ongoing development on this project
          </ListItem>
          <ListItem>Unit Lead on multiple production tracks</ListItem>
          <ListItem>
            Developed strong collaborative relationships with other teams
            (design, product management) to accelerate aggressive timelines
          </ListItem>
        </List>
      </Section>
      <Section>
        <Heading Tag="h3">
          H&amp;R Block Canada – Software Developer (2017 – 2020)
        </Heading>
        <Paragraph>
          Transferred from the User Experience team to join the Software
          Development group in a full-time capacity as the role was better
          aligned with my skillset. In this capacity my work has centered around
          the implementation of newer features / monetization channels and
          developing flexible architecture to support evolving business
          requirements.
        </Paragraph>
        <List>
          <ListItem>
            Delivered first internal react application to prototype stage
          </ListItem>
          <ListItem>
            Completed Migration of Enterprise software from Grunt Taskrunners to
            Webpack / Babel configuration, allowing full integration of modern
            ESLINT / ECMA2015+ standards as part of a long-term migration plan
            (AngularJS to React/Redux, Angular)
          </ListItem>
          <ListItem>Architected large scale new feature development</ListItem>
          <ListItem>
            Manage task prioritization within highly distributed team, including
            offshore resources
          </ListItem>
          <ListItem>
            Active contributor to all parts of agile development process
          </ListItem>
        </List>
      </Section>
      <Section>
        <Heading Tag="h3">
          H&amp;R Block Canada - User Experience Designer/Researcher – Contract
          (2015-2017)
        </Heading>
        <Paragraph>
          Worked as one of the first designers on a new User Experience team
          within the organization to completely reinvent the company’s digital
          do-it-yourself tax software. In this capacity I conducted many in
          person and remote usability testing sessions and worked actively to
          redevelop the UI, both in a design and front-end developer capacity.
        </Paragraph>
        <List>
          <ListItem>
            Improved overall NPS score from 34 to 65 in year one
          </ListItem>
          <ListItem>
            Maintained NPS in year two while converting to a monetization
            strategy that delivered revenue growth of 400% while maintaining
            consistent year over year growth in users
          </ListItem>
          <ListItem>
            Pioneered A/B Testing within organization for the purpose of
            maximizing both customer conversion and desired actions (Optimizely
            / Wasabi)
          </ListItem>
        </List>
      </Section>
    </Frame>
  );
}
