import React from "react";
import ReactDOM from "react-dom/client";
import "./css/base.css";
import classes from "./dev.module.css";

import { all } from "./experiments/all";

import {
  HashRouter,
  Routes,
  Route,
  Outlet,
  Link,
  useParams,
} from "react-router-dom";
import { ExperimentDefinition } from "./types";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <HashRouter>
    <Routes>
      <Route path="/" element={<Main />}>
        <Route index element={<List />} />
        <Route path=":id" element={<ExperimentRoute />} />
      </Route>
    </Routes>
  </HashRouter>
  // </React.StrictMode>
);

function Main() {
  return (
    <div className={classes.main}>
      <Outlet />
    </div>
  );
}

// type FooterLinkProps = {
//   children: React.ReactNode;
//   href: string;
// };

// function FooterLink(props: FooterLinkProps) {
//   return <a className={classes.link} target="_blank" {...props} />;
// }

function List() {
  return (
    <>
      <ListHeader>
        WebGL experiments -{" "}
        <a
          className={classes.link}
          href="https://github.com/dxinteractive/webgl-experiments"
        >
          github repo
        </a>
      </ListHeader>
      <ol className={classes.list} start={0}>
        {all.map((experiment) => {
          return (
            <li className={classes.listItem} key={experiment.id}>
              <Link to={`/${experiment.id}`}>{experiment.name}</Link>
            </li>
          );
        })}
      </ol>
      <br />
      <br />
      <br />
      <hr />
      <br />
      Ideas for later
      <ol>
        <li>blur effect</li>
        <li>scatter-sample blur effect</li>
        <li>SDF textures</li>
        <li>Raymarch reflections</li>
        <li>Refract a texture</li>
        <li>voronoi</li>
        <li>https://iquilezles.org/articles/</li>
        <li>perspective projection</li>
        <li>reflections of skybox</li>
        <li>matrices + instancing</li>
        <li>mipmaps test</li>
        <li>custom mipmaps</li>
      </ol>
    </>
  );
}

type ListHeaderProps = {
  children: React.ReactNode;
};

function ListHeader(props: ListHeaderProps) {
  return (
    <header className={classes.header}>
      <div className={classes.headerTitle}>{props.children}</div>
    </header>
  );
}

function ExperimentRoute() {
  const { id } = useParams();
  const experiment = all.find((experiment) => experiment.id === id);

  if (!experiment) {
    return <Header>Experiment "{id}" not found</Header>;
  }

  return <ExperimentPage experiment={experiment} />;
}

type PageProps = {
  experiment: ExperimentDefinition;
};

function ExperimentPage(props: PageProps) {
  const { experiment } = props;
  const { name, description, filename, Component } = experiment;

  const sourceUrl = `https://github.com/dxinteractive/webgl-experiments/blob/main/src/experiments/${filename}`;

  return (
    <>
      <Header>
        <strong>{name}</strong> - {description}
        <br />
        <a className={classes.link} href={sourceUrl}>
          source code
        </a>
      </Header>
      <Component />
    </>
  );
}

type HeaderProps = {
  children: React.ReactNode;
};

function Header(props: HeaderProps) {
  return (
    <header className={classes.header}>
      <div className={classes.headerTitle}>{props.children}</div>
      <div className={classes.headerBack}>
        <Link to="/">back</Link>
      </div>
    </header>
  );
}
