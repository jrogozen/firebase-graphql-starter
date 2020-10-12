import React from 'react';
import { Heading } from 'theme-ui';
import { ThemeProvider } from 'theme-ui';

import theme from '../theme';

export const App = () => (
    <ThemeProvider theme={theme}>
        <Heading>Hi, this is react.</Heading>
        <Heading as="h3">subhead</Heading>
    </ThemeProvider>
);
