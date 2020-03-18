import React, { PureComponent } from 'react';
import DeckGL from '@deck.gl/react';
import { OrthographicView, TRANSITION_EVENTS } from '@deck.gl/core';
import { VivViewerLayer, StaticImageLayer } from './layers';
import FlyToInterpolatorViv from './viv-flyto';

const interruptionStyles = [
  {
    title: 'BREAK',
    style: TRANSITION_EVENTS.BREAK
  },
  {
    title: 'SNAP_TO_END',
    style: TRANSITION_EVENTS.SNAP_TO_END
  },
  {
    title: 'IGNORE',
    style: TRANSITION_EVENTS.IGNORE
  }
];
export default class VivViewer extends PureComponent {
  constructor(props) {
    super(props);
    const { initialViewState } = props;
    this.state = {};
    this.state.viewState = initialViewState;
    this.state.flyToX1 = 8000;
    this.state.flyToY1 = 8000;
    this.state.flyToX2 = 10000;
    this.state.flyToY2 = 10000;

    this.state.flyToX = 8000;
    this.state.flyToY = 10000;
    this._flyToBox = this._flyToBox.bind(this);
    this._flyToCenter = this._flyToCenter.bind(this);
    this._interruptionStyle = TRANSITION_EVENTS.IGNORE;
    this._onViewStateChange = this._onViewStateChange.bind(this);
    this.handleChangeX1 = this.handleChangeX1.bind(this);
    this.handleChangeY1 = this.handleChangeY1.bind(this);
    this.handleChangeX2 = this.handleChangeX2.bind(this);
    this.handleChangeY2 = this.handleChangeY2.bind(this);
    this.handleChangeX = this.handleChangeX.bind(this);
    this.handleChangeY = this.handleChangeY.bind(this);
  }

  _renderLayers() {
    const { loader } = this.props;
    // For now this is hardcoded but in general we should look at
    // a proper structure for taking lists of configurations so that
    // we can handle multiple overlapping layers.
    // https://github.com/hubmapconsortium/vitessce-image-viewer/issues/107
    return loader.isPyramid
      ? new VivViewerLayer({
          id: `VivViewerLayer-${loader.type}`,
          ...this.props
        })
      : new StaticImageLayer({
          id: `StaticImageLayer-${loader.type}`,
          ...this.props
        });
  }

  _flyToCenter(event) {
    const { flyToX, flyToY } = this.state;
    const center = [flyToX, flyToY];

    this.setState({
      viewState: {
        ...this.state.viewState,
        target: center,
        zoom: 0,
        pitch: 0,
        bearing: 0,
        transitionDuration: 10000,
        transitionInterpolator: new FlyToInterpolatorViv(),
        transitionInterruption: this._interruptionStyle
      }
    });
    event.preventDefault();
  }

  _flyToBox(event) {
    const { flyToX1, flyToY1, flyToX2, flyToY2 } = this.state;
    const { viewHeight, viewWidth } = this.props;
    const center = [
      flyToX1 + (flyToX2 - flyToX1) / 2,
      flyToY1 + (flyToY2 - flyToY1) / 2
    ];
    const zoom =
      flyToY2 - flyToY1 > viewHeight && flyToX2 - flyToX1 > viewWidth
        ? Math.min(
            -1 * Math.log2((flyToY2 - flyToY1) / viewHeight),
            -1 * Math.log2((flyToX2 - flyToX1) / viewWidth)
          )
        : Math.min(
            Math.log2((flyToY2 - flyToY1) / viewHeight),
            Math.log2((flyToX2 - flyToX1) / viewWidth)
          );
    this.setState({
      viewState: {
        ...this.state.viewState,
        target: center,
        zoom,
        pitch: 0,
        bearing: 0,
        transitionDuration: 10000,
        transitionInterpolator: new FlyToInterpolatorViv(),
        transitionInterruption: this._interruptionStyle
      }
    });
    event.preventDefault();
  }

  _onViewStateChange({ viewState }) {
    this.setState({ viewState });
  }

  handleChangeX1(event) {
    this.setState({ flyToX1: Number.parseInt(event.target.value) });
  }

  handleChangeY1(event) {
    this.setState({ flyToY1: Number.parseInt(event.target.value) });
  }

  handleChangeX2(event) {
    this.setState({ flyToX2: Number.parseInt(event.target.value) });
  }

  handleChangeY2(event) {
    this.setState({ flyToY2: Number.parseInt(event.target.value) });
  }

  handleChangeY(event) {
    this.setState({ flyToY: Number.parseInt(event.target.value) });
  }

  handleChangeX(event) {
    this.setState({ flyToX: Number.parseInt(event.target.value) });
  }

  render() {
    /* eslint-disable react/destructuring-assignment */
    const views = [
      new OrthographicView({
        id: 'ortho',
        controller: true,
        height: this.props.viewHeight,
        width: this.props.viewWidth
      })
    ];
    const { viewState } = this.state;
    return (
      <DeckGL
        glOptions={{ webgl2: true }}
        layers={this._renderLayers()}
        initialViewState={viewState}
        _onViewStateChange={this._onViewStateChange}
        controller
        views={views}
      >
        <form onSubmit={this._flyToBox}>
          <label>
            {' '}
            x1:
            <input
              type="text"
              value={this.state.flyToX1}
              onChange={this.handleChangeX1}
            />
          </label>
          <label>
            {' '}
            y1:
            <input
              type="text"
              value={this.state.flyToY1}
              onChange={this.handleChangeY1}
            />
          </label>
          <label>
            {' '}
            x2:
            <input
              type="text"
              value={this.state.flyToX2}
              onChange={this.handleChangeX2}
            />
          </label>
          <label>
            {' '}
            y2:
            <input
              type="text"
              value={this.state.flyToY2}
              onChange={this.handleChangeY2}
            />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <form onSubmit={this._flyToCenter}>
          <label>
            {' '}
            x:
            <input
              type="text"
              value={this.state.flyToX}
              onChange={this.handleChangeX}
            />
          </label>
          <label>
            {' '}
            y:
            <input
              type="text"
              value={this.state.flyToY}
              onChange={this.handleChangeY}
            />
          </label>
          <input type="submit" value="Submit" />
        </form>
      </DeckGL>
    );
    /* eslint-disable react/destructuring-assignment */
  }
}
