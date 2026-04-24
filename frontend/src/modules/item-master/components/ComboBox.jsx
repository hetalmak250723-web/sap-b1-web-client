import React, { useState, useRef, useEffect } from "react";

/**
 * SAP B1-style ComboBox — text input with dropdown arrow
 * Shows suggestions on click/focus, filters as you type
 * Supports both static options (for prefixes) and dynamic fetchOptions (for lookups)
 */
export default function ComboBox({
  name,
  value,
  onChange,
  onSelect,
  onBlur,
  fetchOptions,
  staticOptions = [],
  placeholder = "",
  readOnly = false,
  autoFocus = false,
  error = "",
  title = "",
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [options, setOptions] = useState(staticOptions);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Load options when dropdown opens (only for dynamic fetch)
  useEffect(() => {
    if (showDropdown && fetchOptions && options.length === 0) {
      loadOptions("");
    }
  }, [showDropdown]);

  // Initialize with static options if provided
  useEffect(() => {
    if (staticOptions.length > 0) {
      setOptions(staticOptions);
    }
  }, [staticOptions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadOptions = async (query) => {
    if (!fetchOptions) return;
    setLoading(true);
    try {
      const results = await fetchOptions(query);
      setOptions(Array.isArray(results) ? results : []);
    } catch (err) {
      console.error("Failed to load options:", err);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(e);
    // Only fetch if fetchOptions is provided (not for static options)
    if (fetchOptions && !staticOptions.length) {
      loadOptions(newValue);
    }
  };

  const handleSelect = (option) => {
    if (onSelect) {
      onSelect(option);
    } else {
      onChange({ target: { name, value: option.code } });
    }
    setShowDropdown(false);
  };

  const handleToggleDropdown = () => {
    if (readOnly) return;
    setShowDropdown((prev) => !prev);
  };

  const handleInputFocus = () => {
    if (!readOnly) setShowDropdown(true);
  };

  // Filter options based on current input
  const filteredOptions = options.filter((opt) =>
    opt.code?.toLowerCase().includes(value?.toLowerCase() || "") ||
    opt.name?.toLowerCase().includes(value?.toLowerCase() || "")
  );

  return (
    <div className="im-combobox" ref={wrapperRef}>
      <input
        className={`im-combobox__input${error ? " im-combobox__input--error" : ""}`}
        name={name}
        value={value || ""}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={onBlur}
        readOnly={readOnly}
        autoFocus={autoFocus}
        placeholder={placeholder}
        title={title}
        autoComplete="off"
      />
      <button
        type="button"
        className="im-combobox__arrow"
        onClick={handleToggleDropdown}
        disabled={readOnly}
        tabIndex={-1}
      >
        ▼
      </button>
      {error && <span className="im-combobox__error">{error}</span>}
      
      {showDropdown && (
        <div className="im-combobox__dropdown">
          {loading ? (
            <div className="im-combobox__loading">Loading...</div>
          ) : filteredOptions.length === 0 ? (
            <div className="im-combobox__empty">No items found</div>
          ) : (
            <ul className="im-combobox__list">
              {filteredOptions.map((opt, i) => (
                <li
                  key={i}
                  className="im-combobox__item"
                  onClick={() => handleSelect(opt)}
                >
                  <span className="im-combobox__item-code">{opt.code}</span>
                  {opt.name && (
                    <span className="im-combobox__item-name">{opt.name}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
