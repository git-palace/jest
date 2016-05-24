/**
 * @providesModule Doc
 * @jsx React.DOM
 */

var React = require('React');
var Marked = require('Marked');

class Doc extends React.Component {
  render() {
    return (
      <div className="post">
        <header className="postHeader">
          <a className="edit-page-link" href={'https://github.com/facebook/jest/edit/master/docs/' + this.props.source} target="_blank">Edit on GitHub</a>
          <h1>{this.props.title}</h1>
        </header>
        <article>
          <Marked>{this.props.content}</Marked>
        </article>
      </div>
    )
  }
}

module.exports = Doc;
