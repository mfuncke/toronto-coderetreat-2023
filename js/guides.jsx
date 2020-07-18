import { Fragment, render, h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import * as qs from "qs";
import classNames from "classnames";
import { OPERATING_SYSTEMS, LANGUAGES } from "./guides/metadata";

const SelectionButton = ({ image, text, className, ...buttonProps }) => (
  <button
    className={classNames(
      "btn btn-outline-primary btn-disabled-grayscale text-dark m-2",
      className
    )}
    {...buttonProps}
  >
    <img class="m-2" src={image} style={{ height: 52, width: 52 }} />
    <span className="d-block text-center">{text}</span>
  </button>
);

const useToggle = (initialValue) => {
  const [state, set] = useState(initialValue);

  return [
    state,
    (value) => {
      if (value === state) return set(null);
      return set(value);
    },
  ];
};

const GuideSelector = ({
  availableGuides,
  selectedGuideId,
  onSelectionChanged,
}) => {
  const [selectedOperatingSystem, selectOperatingSystem] = useToggle(
    selectedGuideId?.os
  );
  const [selectedLanguage, selectLanguage] = useToggle(
    selectedGuideId?.language
  );

  const isLanguageAvailable = (languageToShow) => {
    if (selectedOperatingSystem === null) return false;
    return availableGuides.some(
      ({ os, language }) =>
        os === selectedOperatingSystem && language === languageToShow
    );
  };

  useEffect(() => {
    if (selectedLanguage && selectedOperatingSystem) {
      onSelectionChanged({
        language: selectedLanguage,
        os: selectedOperatingSystem,
      });
    }
  }, [selectedLanguage, selectedOperatingSystem]);

  return (
    <div className="row">
      <div class="col-12 col-md-4">
        <h4>Operating System</h4>
        {Object.entries(OPERATING_SYSTEMS).map(([key, os]) => (
          <SelectionButton
            image={os.icon}
            text={os.name}
            key={key}
            className={{ active: key === selectedOperatingSystem }}
            onClick={(e) => {
              e.target.blur();
              selectOperatingSystem(key);
              selectLanguage(null);
            }}
          />
        ))}
      </div>
      <div class="col-12 col-md-8">
        <h4>Programming Language</h4>
        {Object.entries(LANGUAGES).map(([key, language]) => (
          <SelectionButton
            image={language.icon}
            text={language.name}
            disabled={!isLanguageAvailable(key)}
            className={{ active: key === selectedLanguage }}
            onClick={(e) => {
              e.target.blur();
              selectLanguage(key);
            }}
            key={key}
          />
        ))}
      </div>
    </div>
  );
};

const operatingSystemAndLanguageFromUrl = () => {
  const urlParams = qs.parse(window.location.search, {
    ignoreQueryPrefix: true,
  });

  if (urlParams.os && urlParams.language) {
    return { os: String(urlParams.os), language: String(urlParams.language) };
  }
  return null;
};

const updateUrlFromOperatingSystemAndLanguage = (selectedGuideId) => {
  window.history.pushState(
    {},
    null,
    "?" +
      qs.stringify({
        os: selectedGuideId.os,
        language: selectedGuideId.language,
      })
  );
};

const Resources = ({ resources }) => (
  <div className="tldr">
    <ul className="">
      {resources.map((resource) => {
        if (resource.type === "url") {
          return (
            <li>
              <span>{resource.description}</span>
              <br />
              <a href={resource.url}>{resource.url}</a>
            </li>
          );
        } else if (resource.type === "shell") {
          return (
            <li>
              <span>{resource.description}</span>
              <br />
              <pre>
                <code>{resource.command}</code>
              </pre>
            </li>
          );
        }
        return <li>{resource.description}</li>;
      })}
    </ul>
  </div>
);

const Guide = ({ guide, steps }) => {
  const section = useRef(null);
  useEffect(() => {
    section.current && section.current.scrollIntoView({ behavior: "smooth" });
  }, [guide, steps, section]);

  return (
    <div ref={section}>
      <h1>{guide.name}</h1>
      <div className="toc d-inline-block p-md-3 my-3">
        <h4 class="h4">Table of Contents</h4>
        <ol className="section-nav">
          {steps.map((s) => (
            <li key={s.slug}>
              <a href={`#${s.slug}`}>{s.title}</a>
            </li>
          ))}
        </ol>
      </div>
      <section class="content">
        {steps.map((s) => (
          <Fragment>
            <h2 className="h2">
              <a name={s.slug}>{s.title}</a>
            </h2>
            {s.resources && <Resources resources={s.resources} />}
            <div dangerouslySetInnerHTML={{ __html: s?.output }}></div>
          </Fragment>
        ))}
      </section>
    </div>
  );
};

const Guides = ({ setupSteps, availableGuides }) => {
  const [selectedGuideId, setSelectedGuideId] = useState(
    operatingSystemAndLanguageFromUrl
  );
  const selectedGuide =
    selectedGuideId &&
    availableGuides.find(
      ({ os, language }) =>
        selectedGuideId.os === os && selectedGuideId.language === language
    );

  const stepsForSelectedGuide = selectedGuide?.steps.map(
    (stepId) =>
      setupSteps.find(({ slug }) => slug === stepId) || {
        slug: stepId,
        title: stepId,
        output: "MISSING",
      }
  );

  useEffect(() => {
    if (selectedGuideId == null) return;
    updateUrlFromOperatingSystemAndLanguage(selectedGuideId);
  }, [selectedGuideId]);

  return (
    <div>
      <GuideSelector
        selectedGuideId={selectedGuideId}
        availableGuides={availableGuides}
        onSelectionChanged={setSelectedGuideId}
      />
      <p>
        Your setup isn't covered here? Check out the{" "}
        <a href="https://github.com/swkBerlin/kata-bootstraps">
          kata-bootstraps
        </a>{" "}
        repository for boilerplates in a lot of different languages, or add your
        guide (💙) by submitting a{" "}
        <a href="https://github.com/coderetreat/coderetreat">Pull Request</a>!
      </p>
      <hr className="my-5" />
      {selectedGuide && (
        <Guide guide={selectedGuide} steps={stepsForSelectedGuide} />
      )}
    </div>
  );
};

(window || global).initializeGuide = ({ setupSteps, availableGuides }) => {
  render(
    <Guides setupSteps={setupSteps} availableGuides={availableGuides} />,
    document.querySelector("#guides")
  );
};
