/**
 * @jsx React.DOM
 */

/* eslint-disable sort-keys */

const React = require('React');
const RedirectLayout = require('RedirectLayout');

class Support extends React.Component {
  render() {
    const metadata = {
      'id': 'support',
      'layout': 'redirect',
      'permalink': '/jest/support.html',
      'destinationUrl': 'help.html',
      'source': 'support.md',
    };
    return (
      <RedirectLayout metadata={metadata} />
    );
  }
}

module.exports = Support;
