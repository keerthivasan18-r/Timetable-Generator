import React from 'react';
import SpotlightSearchBar from './SpotlightSearchBar';

export default function CommandPalette(props) {
  return <SpotlightSearchBar {...props} embedded={false} />;
}
