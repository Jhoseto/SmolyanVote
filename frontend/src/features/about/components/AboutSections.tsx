import { ABOUT_SECTIONS } from "../data/aboutSections";
import { AboutPhilosophyClosing } from "./AboutPhilosophyClosing";
import { AboutSection } from "./AboutSection";

export function AboutSections() {
  return (
    <>
      <div id="about-sections" className="scroll-mt-[var(--navbar-offset)] bg-white">
        {ABOUT_SECTIONS.map((section, index) => (
          <AboutSection
            key={section.id}
            section={section}
            reverse={index % 2 === 1}
            muted={index % 2 === 1}
          />
        ))}
      </div>
      <AboutPhilosophyClosing />
    </>
  );
}
