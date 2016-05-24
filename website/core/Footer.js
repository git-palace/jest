/**
 * @providesModule Footer
 * @jsx React.DOM
 */

var React = require('React');
var OpenSourceGlyph = require('OpenSourceGlyph');

var siteConfig = require('../siteConfig.js');

var Footer = React.createClass({
  render: function() {
    var repo = "https://github.com/" + siteConfig.repo;
    return (
      <div className="footerContainer">
        <div className="wrapper footerWrapper">
          <div className="footerBlocks">
            <div className="footerSection fbOpenSourceFooter">
              <OpenSourceGlyph />
              <h2>Facebook Open Source</h2>
            </div>
            <div className="footerSection">
              <a className="footerLink" href="https://code.facebook.com/projects/" target="_blank">Open Source Projects</a>
              <a className="footerLink" href="https://github.com/facebook/" target="_blank">GitHub</a>
              <a className="footerLink" href="https://twitter.com/fbOpenSource" target="_blank">Twitter</a>
            </div>
            <div className="footerSection rightAlign">
              <a className="footerLink" href={repo} target="_blank">Contribute on GitHub</a>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = Footer;
