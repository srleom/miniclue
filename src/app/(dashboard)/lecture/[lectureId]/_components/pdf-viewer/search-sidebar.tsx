"use client";

// react
import * as React from "react";

// third-party
import { MinimalButton, Spinner, TextBox } from "@react-pdf-viewer/core";
import {
  Match,
  NextIcon,
  PreviousIcon,
  RenderSearchProps,
  SearchPlugin,
} from "@react-pdf-viewer/search";

enum SearchStatus {
  NotSearchedYet,
  Searching,
  FoundResults,
}

interface SearchSidebarProps {
  searchPluginInstance: SearchPlugin;
}

const SearchSidebar: React.FC<SearchSidebarProps> = ({
  searchPluginInstance,
}) => {
  const [searchStatus, setSearchStatus] = React.useState(
    SearchStatus.NotSearchedYet,
  );
  const [matches, setMatches] = React.useState<Match[]>([]);

  const { Search } = searchPluginInstance;

  const renderMatchSample = (match: Match) => {
    //  match.startIndex    match.endIndex
    //      |                       |
    //      ▼                       ▼
    //  ....[_____props.keyword_____]....

    const wordsBefore = match.pageText.substr(match.startIndex - 20, 20);
    let words = wordsBefore.split(" ");
    words.shift();
    const begin = words.length === 0 ? wordsBefore : words.join(" ");

    const wordsAfter = match.pageText.substr(match.endIndex, 60);
    words = wordsAfter.split(" ");
    words.pop();
    const end = words.length === 0 ? wordsAfter : words.join(" ");

    return (
      <div>
        {begin}
        <span className="bg-yellow-400">
          {match.pageText.substring(match.startIndex, match.endIndex)}
        </span>
        {end}
      </div>
    );
  };

  return (
    <Search>
      {(renderSearchProps: RenderSearchProps) => {
        const {
          currentMatch,
          keyword,
          setKeyword,
          jumpToMatch,
          jumpToNextMatch,
          jumpToPreviousMatch,
          search,
          clearKeyword,
        } = renderSearchProps;

        const handleSearchKeyDown = (e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            if (keyword) {
              setSearchStatus(SearchStatus.Searching);
              search().then((matches) => {
                setSearchStatus(SearchStatus.FoundResults);
                setMatches(matches);
              });
            } else {
              search().then(() => {
                clearKeyword();
                setMatches([]);
                setSearchStatus(SearchStatus.NotSearchedYet);
              });
            }
          }
        };

        return (
          <div className="flex h-full w-full flex-col overflow-hidden">
            <div className="p-2">
              <div style={{ position: "relative" }}>
                <TextBox
                  placeholder="Enter to search"
                  value={keyword}
                  onChange={(value) => {
                    setKeyword(value);
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchStatus === SearchStatus.Searching && (
                  <div className="absolute top-0 right-2 bottom-0 flex items-center">
                    <Spinner size="1.5rem" />
                  </div>
                )}
              </div>
            </div>
            {searchStatus === SearchStatus.FoundResults && (
              <>
                {matches.length === 0 && (
                  <div className="flex items-center p-2">Not found</div>
                )}
                {matches.length > 0 && (
                  <>
                    <div className="flex items-center p-2">
                      <div className="mr-2 text-xs text-gray-500">
                        Found {matches.length} results
                      </div>
                      <div className="mr-2 ml-auto">
                        <MinimalButton onClick={jumpToPreviousMatch}>
                          <PreviousIcon />
                        </MinimalButton>
                      </div>
                      <MinimalButton onClick={jumpToNextMatch}>
                        <NextIcon />
                      </MinimalButton>
                    </div>
                    <div className="flex-1 overflow-auto border-t border-gray-300 p-2">
                      {matches.map((match, index) => (
                        <div key={index} className="my-4">
                          <div className="mb-2 flex justify-between">
                            <div>#{index + 1}</div>
                            <div className="text-right text-xs text-gray-500">
                              Page {match.pageIndex + 1}
                            </div>
                          </div>
                          <div
                            className={` ${currentMatch === index + 1 ? "bg-gray-100" : ""} cursor-pointer rounded-md border border-gray-300 p-2 break-words`}
                            onClick={() => jumpToMatch(index + 1)}
                          >
                            {renderMatchSample(match)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      }}
    </Search>
  );
};

export default SearchSidebar;
