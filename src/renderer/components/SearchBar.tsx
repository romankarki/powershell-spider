import React, { useCallback, useEffect, useRef, useState } from 'react';
import { searchNext, searchPrevious, clearSearch, onSearchResults, SearchResult } from '../hooks/useTerminal';

interface SearchBarProps {
  terminalId: string;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ terminalId, onClose }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [regex, setRegex] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [result, setResult] = useState<SearchResult>({ resultIndex: -1, resultCount: 0 });

  const opts = { caseSensitive, regex, wholeWord };

  // Subscribe to search result changes
  useEffect(() => {
    const unsub = onSearchResults(terminalId, setResult);
    return unsub;
  }, [terminalId]);

  // Trigger search when query or options change
  useEffect(() => {
    if (query) {
      searchNext(terminalId, query, opts);
    } else {
      clearSearch(terminalId);
      setResult({ resultIndex: -1, resultCount: 0 });
    }
  }, [query, caseSensitive, regex, wholeWord, terminalId]);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleClose = useCallback(() => {
    clearSearch(terminalId);
    onClose();
  }, [terminalId, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      searchPrevious(terminalId, query, opts);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      searchNext(terminalId, query, opts);
    }
  }, [terminalId, query, opts, handleClose]);

  const matchDisplay = query
    ? result.resultCount > 0
      ? `${result.resultIndex + 1}/${result.resultCount}`
      : 'no matches'
    : '';

  return (
    <div style={styles.container} onKeyDown={handleKeyDown}>
      <div style={styles.searchIcon}>&#x2315;</div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search terminal..."
        style={styles.input}
        spellCheck={false}
      />
      {matchDisplay && (
        <span style={{
          ...styles.matchCount,
          color: result.resultCount > 0 ? 'var(--green)' : 'var(--red)',
        }}>
          {matchDisplay}
        </span>
      )}
      <div style={styles.divider} />
      <ToggleButton
        label="Aa"
        title="Case Sensitive"
        active={caseSensitive}
        onClick={() => setCaseSensitive(!caseSensitive)}
      />
      <ToggleButton
        label=".*"
        title="Regex"
        active={regex}
        onClick={() => setRegex(!regex)}
      />
      <ToggleButton
        label='""'
        title="Whole Word"
        active={wholeWord}
        onClick={() => setWholeWord(!wholeWord)}
      />
      <div style={styles.divider} />
      <NavButton
        title="Previous (Shift+Enter)"
        onClick={() => searchPrevious(terminalId, query, opts)}
      >
        &#x25B2;
      </NavButton>
      <NavButton
        title="Next (Enter)"
        onClick={() => searchNext(terminalId, query, opts)}
      >
        &#x25BC;
      </NavButton>
      <div style={styles.divider} />
      <button
        onClick={handleClose}
        title="Close (Esc)"
        style={styles.closeButton}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = 'var(--red)';
          e.currentTarget.style.textShadow = '0 0 6px var(--red)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--text-secondary)';
          e.currentTarget.style.textShadow = 'none';
        }}
      >
        &#x2715;
      </button>
    </div>
  );
};

const ToggleButton: React.FC<{
  label: string;
  title: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, title, active, onClick }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      ...styles.toggleButton,
      color: active ? 'var(--green)' : 'var(--text-secondary)',
      background: active ? 'rgba(0, 255, 65, 0.1)' : 'transparent',
      borderColor: active ? 'var(--green-dim)' : 'transparent',
      textShadow: active ? '0 0 6px var(--green-glow)' : 'none',
    }}
  >
    {label}
  </button>
);

const NavButton: React.FC<{
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ title, onClick, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={styles.navButton}
    onMouseEnter={(e) => {
      e.currentTarget.style.color = 'var(--green)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = 'var(--text-secondary)';
    }}
  >
    {children}
  </button>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    top: 24, // below terminal header
    right: 8,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: 'rgba(10, 10, 10, 0.95)',
    border: '1px solid var(--green-dim)',
    borderRadius: 4,
    padding: '4px 8px',
    boxShadow: '0 0 12px rgba(0, 255, 65, 0.15), inset 0 0 8px rgba(0, 255, 65, 0.03)',
    animation: 'slide-in-down 0.1s ease-out',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
  },
  searchIcon: {
    color: 'var(--green-dim)',
    fontSize: 14,
    marginRight: 2,
  },
  input: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--green)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    width: 180,
    caretColor: 'var(--green)',
  },
  matchCount: {
    fontSize: 11,
    fontFamily: 'var(--font-mono)',
    whiteSpace: 'nowrap' as const,
    marginRight: 2,
  },
  divider: {
    width: 1,
    height: 16,
    background: 'var(--border)',
    margin: '0 2px',
  },
  toggleButton: {
    background: 'transparent',
    border: '1px solid transparent',
    borderRadius: 2,
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
    padding: '2px 5px',
    lineHeight: 1,
    transition: 'all 0.1s',
  },
  navButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 10,
    padding: '2px 4px',
    lineHeight: 1,
    transition: 'color 0.1s',
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    fontSize: 13,
    padding: '2px 4px',
    lineHeight: 1,
    transition: 'all 0.1s',
  },
};
