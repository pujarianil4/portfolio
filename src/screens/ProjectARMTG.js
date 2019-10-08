import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useScrollToTop } from 'utils/hooks';
import Footer from 'components/Footer';
import ProgressiveImage from 'components/ProgressiveImage';
import {
  ProjectContainer, ProjectSection, ProjectSectionContent, ProjectImage,
  ProjectHeader
} from 'components/Project';
import Render from 'assets/armtg.mp4';
import RenderPlaceholder from 'assets/armtg-placeholder.png';

const prerender = navigator.userAgent === 'ReactSnap';
const title = 'ARMTG';
const description = 'A VR, AR, and multi-platform application to play the card game: Magic, the Gathering with database-fed decks displayed on real, physical cards in real-time. Automatic shuffling, an intuitive deck editor, and a cool 3D interface brought the technology of the future to the game.';
const roles = [
  'Front-end Development',
  'Back-end Development',
  'Software Development',
  'Visual & UI / UX Design',
  'Branding & Identity',
  'Creative Direction',
  '3D Modeling & Animation',
];

function ArMTG() {
  useScrollToTop();

  return (
    <React.Fragment>
      <Helmet
        title={`Projects | ${title}`}
        meta={[{ name: 'description', content: description, }]}
      />
      <ProjectContainer>
        <ProjectHeader
          title={title}
          description={description}
          url="https://mtg.codyb.co"
          roles={roles}
        />
        <ProjectSection>
          <ProjectSectionContent>
            <ProjectImage entered={!prerender}>
              <ProgressiveImage
                srcSet={Render}
                videoSrc={Render}
                placeholder={RenderPlaceholder}
                reveal
              />
            </ProjectImage>
          </ProjectSectionContent>
        </ProjectSection>
      </ProjectContainer>
      <Footer />
    </React.Fragment>
  );
}

export default ArMTG;
