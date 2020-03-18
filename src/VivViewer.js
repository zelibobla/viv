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
    this.state.flyToX = 0;
    this.state.flyToY = 0;
    this._goTo = this._goTo.bind(this);
    this._interruptionStyle = TRANSITION_EVENTS.IGNORE;
    this._onViewStateChange = this._onViewStateChange.bind(this);
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

  _goTo(event) {
    const { flyToX, flyToY } = this.state;
    this.setState({
      viewState: {
        ...this.state.viewState,
        target: [flyToX, flyToY],
        zoom: 0,
        pitch: 0,
        bearing: 0,
        transitionDuration: 10000,
        transitionInterruption: this._interruptionStyle
      },
      flyToX: 0,
      flyToY: 0
    });
    event.preventDefault();
  }

  _onViewStateChange({ viewState }) {
    this.setState({ viewState });
  }

  handleChangeX(event) {
    this.setState({ flyToX: Number.parseInt(event.target.value) });
  }

  handleChangeY(event) {
    this.setState({ flyToY: Number.parseInt(event.target.value) });
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
        <form onSubmit={this._goTo}>
          <label>
            {' '}
            x:
            <input type="text" onChange={this.handleChangeX} />
          </label>
          <label>
            {' '}
            y:
            <input type="text" onChange={this.handleChangeY} />
          </label>
          <input type="submit" value="Submit" />
        </form>
      </DeckGL>
    );
    /* eslint-disable react/destructuring-assignment */
  }
}
