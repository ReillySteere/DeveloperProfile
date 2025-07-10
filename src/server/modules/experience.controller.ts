import { Controller, Get } from '@nestjs/common';
import { ExperienceEntry } from 'shared/types';

@Controller('api/experience')
export class ExperienceController {
  @Get()
  getExperience(): Promise<ExperienceEntry[]> {
    return Promise.resolve([
      {
        id: '1',
        role: 'Team Lead - Checkout Platform Reliability',
        company: 'Getty Images',
        description:
          'Lead a team of developers responsible for the reliability, performance and scalability of the Checkout Platform, while ensuring new feature development is delivered with minimal disruption to the customer experience, while making significant advancements in our ability to detect degradations in user experience.',
        bulletPoints: [
          'Responsible for ensuring consistence quality and reliability of an E-Commerce platform that processes several hundred million in revenue per year globally across multiple sites.',
          'Support three active production tracks to ensure new features are built and deployed with intended impact to the customer experience in a scalable manner.',
          'Build out new alerting and testing tools to ensure reliability of the platform',
          'Provide mentorship and direct coaching to developers at multiple levels of development',
          'Built custom migration Service to support safe migration leveraging RMQ/S3/Redis',
          'Introduced Mock Service Worker functionality to fully support Jest based integration testing of complex subsystem',
          'Implemented significant improvements to monitoring and debugging utilities',
        ],
        startDate: '2025-04-01',
        endDate: null,
        tags: [
          'NestJS',
          'TypeScript',
          'React',
          'Coaching',
          'Site Reliability Engineering',
        ],
      },
      {
        id: '2',
        role: 'Technical Architect / Technical Lead / Project Manager - Checkout Migration',
        company: 'Getty Images',
        description:
          'Led the migration of all locations allowing user input of payment information from AngularJS to React / TypeScript.',
        bulletPoints: [
          'Delivered migration with minimal disruption to the customer experience',
          'Led a variably sized team of developers (2-6), establishing priorities, managing timelines and ensuring quality of deliverables',
          'Provided mentorship and direct coaching to developers at multiple levels of development',
          'Developed implementation plan, including architecture, for a complete rewrite of the checkout front-end platform',
          'Managed external stakeholders to ensure alignment on project goals and timelines',
          'Implemented Architecture Decision Records (ADRs) to track architectural decisions and their implications',
          'Implemented Project Proposals to ensure clear communication of project goals and scope across multiple development teams',
        ],
        startDate: '2024-05-01',
        endDate: '2025-04-01',
        tags: [
          'TypeScript',
          'React',
          'NestJS',
          'AngularJS',
          'Ruby on Rails',
          'Cypress',
          'Architecture Decision Records',
          'Grafana',
          'Legacy Code',
        ],
      },
      {
        id: '3',
        role: 'Platform Engineer - V2 Migration',
        company: 'Getty Images',
        description:
          'Accelerated the migration of various core components and libraries from AngularJS / Ruby on Rails to React / TypeScript / NestJS',
        bulletPoints: [
          'Implemented TypeScript / JavaScript cross-functional Jest Configuration',
          'Built out core libraries to support a wide range of applications',
          'Ensure minimal customer disruption across features spanning all Getty Images properties',
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-01',
        tags: [
          'TypeScript',
          'React',
          'NestJS',
          'Ruby on Rails',
          'Jest',
          'Platform Engineering',
        ],
      },
      {
        id: '4',
        role: 'Front End Technical Lead - Generative AI Imagery',
        company: 'Getty Images',
        description:
          'Led the front-end development team to produce the Getty Images Generative AI Imagery platform, working cross-functionality with many teams to ensure delivery of a brand appropriate offering on a tight deadline, while also ensuring that the new domain being created could be iterated on post-launch.',
        bulletPoints: [
          'Delivered product on time and to specification',
          'Led a team of 10 front-end developers',
          'Assumed significant project owner responsibilities to ensure delivery timelines were met',
          'Provided mentorship and direct coaching to developers at multiple levels of development',
          'Developed architecture for a new domain, leveraging new libraries that were not well adopted outside our team',
        ],
        startDate: '2023-04-01',
        endDate: '2024-01-01',
        tags: ['TypeScript', 'React', 'NestJS', 'Project Management', 'AI'],
      },
      {
        id: '5',
        role: 'Front End Technical Lead - Payment Instruments',
        company: 'Getty Images',
        description:
          'Build out robust, scalable payment instruments system that would allow for the rapid addition of any new payment methods',
        bulletPoints: [
          'Technical lead for 2 developers',
          'Ensure quality and reliability of the platform',
          'Support multiple payment processors, payment methods and purchase types',
          'Plan safe migration path for payment methods from AngularJS to React / JavaScript',
        ],
        startDate: '2022-08-01',
        endDate: '2023-04-01',
        tags: [
          'JavaScript',
          'React',
          'Cypress',
          'PCI Compliance',
          'Site Reliability Engineering',
        ],
      },
      {
        id: '6',
        role: 'Front End Technical Lead - Customer Acquisition',
        company: 'Getty Images',
        description:
          'Support large team of early career developers in building out new customer engagement and A/B Testing Experiences',
        bulletPoints: [
          'Introduced Cypress Platform prototype for reliable end-to-end testing',
          'Led team of 7 developers',
          'Provided mentorship and direct coaching to developers of generally beginner to intermediate levels of experience',
          'Responsible for reducing high rate of production incidents and ensuring quality of deliverables',
        ],
        startDate: '2021-08-01',
        endDate: '2022-08-01',
        tags: ['JavaScript', 'React', 'Ruby on Rails', 'Cypress'],
      },
      {
        id: '7',
        role: 'Senior Front End Developer - Customer Retention',
        company: 'Getty Images',
        description:
          'Build out new customer offering allowing sales of a video subscription product.',
        bulletPoints: [
          'Delivered first fully React view for a landing page',
          'Developed early patterns for how to implement React with Rails as a backend',
        ],
        startDate: '2021-05-01',
        endDate: '2021-08-01',
        tags: ['JavaScript', 'React', 'AngularJS', 'Ruby on Rails'],
      },
      {
        id: '8',
        role: 'Senior Front End Developer - Customer Retention (Contract)',
        company: 'Getty Images',
        description:
          'Build out new customer offering allowing sales of a video subscription product.',
        bulletPoints: [
          'Delivered first fully React view for a product offering page',
        ],
        startDate: '2020-11-15',
        endDate: '2021-05-01',
        tags: ['JavaScript', 'React', 'AngularJS', 'Ruby on Rails'],
      },
      {
        id: '9',
        role: 'Software Developer',
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
        id: '10',
        role: 'User Experience Researcher – Contract',
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
