import { ABOUT_SECTIONS } from "../data/aboutSections";
import { AboutSection } from "./AboutSection";

/** 9 alternating video sections (v1 `aboutUs.html` parity). */
export function AboutSections() {
  return (
    <div>
      {ABOUT_SECTIONS.map((section, index) => (
        <AboutSection key={section.id} section={section} reverse={index % 2 === 1} />
      ))}
    </div>
  );
}
