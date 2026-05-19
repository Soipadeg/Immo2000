import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '@/components/Button/Button';
import Input from '@/components/Input/Input';
import './SearchBar.css';

/**
 * SearchBar Component
 * Hero search bar with filters
 */
const SearchBar = ({
  onSearch,
  placeholder = 'Chercher un bien immobilier...',
  showFilters = true,
  className = '',
  ...props
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({
        query: searchQuery,
        location,
        priceRange,
      });
    }
  };

  const searchBarClass = ['search-bar', className].filter(Boolean).join(' ');

  return (
    <div className={searchBarClass} {...props}>
      <form onSubmit={handleSearch} className="search-bar-form">
        <div className="search-bar-inputs">
          {/* Main Search */}
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon="🔍"
            className="search-bar-input"
          />

          {/* Filters */}
          {showFilters && (
            <>
              <Input
                type="text"
                placeholder="Localisation"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="search-bar-input"
              />

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="search-bar-select"
              >
                <option value="">Tous les budgets</option>
                <option value="0-200000">Jusqu'à 200 000 €</option>
                <option value="200000-400000">200 000 € - 400 000 €</option>
                <option value="400000-600000">400 000 € - 600 000 €</option>
                <option value="600000-1000000">600 000 € - 1 000 000 €</option>
                <option value="1000000+">Plus de 1 000 000 €</option>
              </select>
            </>
          )}

          {/* Search Button */}
          <Button
            type="submit"
            variant="primary"
            size="medium"
            className="search-bar-button"
          >
            Chercher
          </Button>
        </div>
      </form>
    </div>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  showFilters: PropTypes.bool,
  className: PropTypes.string,
};

export default SearchBar;
