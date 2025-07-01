import { Controller, Get } from '@nestjs/common';
import { ExperienceEntry } from 'shared/types';

@Controller('api/experience')
export class ExperienceController {
  @Get()
  getExperience(): Promise<ExperienceEntry[]> {
    // Placeholder data; replace with real data source as needed
    return Promise.resolve([
      {
        id: '1',
        title: 'Senior Software Engineer',
        company: 'Getty Images',
        description:
          'Proven leader within the organization with a demonstrated track record on delivering against aggressive deadlines on highly complex product areas by leveraging a high degree of technical expertise, coaching experience and ability to work collaboratively with cross-functional stakeholders.',
        bulletPoints: [
          'Technical Architect / Project Manager for migration from Rails / AngularJS to Node / React of business critical transaction pages transaction in several hundred million in revenue per year.',
          'Led front-end team of 10 developers delivering the largest new feature roll-out the company has undertaken (AI Generative Imagery)',
          'Provided mentorship and direct coaching to developers at multiple levels of development',
          'Contributed to significant improvements in core web vital metrics',
          'Responsible for ensuring site reliability is maintained through Splunk / Grafana',
          'Implemented team’s first automated test suite via Cypress and responsible for ongoing development on this project',
          'Unit Lead on multiple production tracks',
          'Developed strong collaborative relationships with other teams (design, product management) to accelerate aggressive timelines',
        ],
        startDate: '2022-01-01',
        endDate: '2023-01-01',
        tags: ['JavaScript', 'React', 'Node.js'],
      },
      {
        id: '2',
        title: 'Senior Software Engineer',
        company: 'Getty Images',
        description:
          'Proven leader within the organization with a demonstrated track record on delivering against aggressive deadlines on highly complex product areas by leveraging a high degree of technical expertise, coaching experience and ability to work collaboratively with cross-functional stakeholders.',
        bulletPoints: [
          'Technical Architect / Project Manager for migration from Rails / AngularJS to Node / React of business critical transaction pages transaction in several hundred million in revenue per year.',
          'Led front-end team of 10 developers delivering the largest new feature roll-out the company has undertaken (AI Generative Imagery)',
          'Provided mentorship and direct coaching to developers at multiple levels of development',
          'Contributed to significant improvements in core web vital metrics',
          'Responsible for ensuring site reliability is maintained through Splunk / Grafana',
          'Implemented team’s first automated test suite via Cypress and responsible for ongoing development on this project',
          'Unit Lead on multiple production tracks',
          'Developed strong collaborative relationships with other teams (design, product management) to accelerate aggressive timelines',
        ],
        startDate: '2022-01-01',
        endDate: '2023-01-01',
        tags: ['JavaScript', 'React', 'Node.js'],
      },
      {
        id: '3',
        title: 'Senior Software Engineer',
        company: 'Getty Images',
        description:
          'Proven leader within the organization with a demonstrated track record on delivering against aggressive deadlines on highly complex product areas by leveraging a high degree of technical expertise, coaching experience and ability to work collaboratively with cross-functional stakeholders.',
        bulletPoints: [
          'Technical Architect / Project Manager for migration from Rails / AngularJS to Node / React of business critical transaction pages transaction in several hundred million in revenue per year.',
          'Led front-end team of 10 developers delivering the largest new feature roll-out the company has undertaken (AI Generative Imagery)',
          'Provided mentorship and direct coaching to developers at multiple levels of development',
          'Contributed to significant improvements in core web vital metrics',
          'Responsible for ensuring site reliability is maintained through Splunk / Grafana',
          'Implemented team’s first automated test suite via Cypress and responsible for ongoing development on this project',
          'Unit Lead on multiple production tracks',
          'Developed strong collaborative relationships with other teams (design, product management) to accelerate aggressive timelines',
        ],
        startDate: '2022-01-01',
        endDate: '2023-01-01',
        tags: ['JavaScript', 'React', 'Node.js'],
      },
      {
        id: '4',
        title: 'Software Developer',
        company: 'H&R Block Canada',
        description:
          'Transferred from the User Experience team to join the Software Development group in a full-time capacity as the role was better aligned with my skillset. In this capacity my work has centered around the implementation of newer features / monetization channels and developing flexible architecture to support evolving business requirements.',
        bulletPoints: [
          'Delivered first internal react application to prototype stage',
          'Completed Migration of Enterprise software from Grunt Taskrunners to Webpack / Babel configuration, allowing full integration of modern ESLINT / ECMA2015+ standards as part of a long-term migration plan (AngularJS to React/Redux, Angular)',
          'Architected large scale new feature development',
          'Manage task prioritization within highly distributed team, including offshore resources',
          'Active contributor to all parts of agile development process',
        ],
        startDate: '2017-01-01',
        endDate: '2020-01-01',
        tags: ['JavaScript', 'React', 'Node.js'],
      },
      {
        id: '5',
        title: 'User Experience Researcher – Contract',
        company: 'H&R Block Canada',
        description:
          'Worked as one of the first designers on a new User Experience team within the organization to completely reinvent the company’s digital do-it-yourself tax software. In this capacity I conducted many in person and remote usability testing sessions and worked actively to redevelop the UI, both in a design and front-end developer capacity.',
        bulletPoints: [
          'Improved overall NPS score from 34 to 65 in year one',
          'Maintained NPS in year two while converting to a monetization strategy that delivered revenue growth of 400% while maintaining consistent year over year growth in users',
          'Pioneered A/B Testing within organization for the purpose of maximizing both customer conversion and desired actions (Optimizely / Wasabi)',
        ],
        startDate: '2015-01-01',
        endDate: '2017-01-01',
        tags: ['UX Design', 'User Research'],
      },
    ]);
  }
}
