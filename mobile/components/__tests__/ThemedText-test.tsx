import * as React from 'react';
import AccessibleText from '@/components/AccessibleText';
import renderer from 'react-test-renderer';

import { ThemedText } from '../ThemedText';

it(`renders correctly`, () => {
  const tree = renderer.create(<AccessibleText>Snapshot test!</AccessibleText>).toJSON();

  expect(tree).toMatchSnapshot();
});
