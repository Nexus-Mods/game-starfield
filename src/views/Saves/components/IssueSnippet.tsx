import React from 'react';
import { ISaveGamePlugin } from '../types';

export type IssueSnippetProps = {
  issueHeading: string;
  issue: ISaveGamePlugin[] | undefined;
};

export const IssueSnippet = (props: IssueSnippetProps): JSX.Element => {
  const { issueHeading, issue } = props;

  if (issue && issue.length) {
    return (
      <>
        <p>{issueHeading}</p>
        <ul>
          {issue.map((object, i) => (
            <li key={i}>{object.PluginName}</li>
          ))}
        </ul>
      </>
    );
  }

  return <></>;
};
